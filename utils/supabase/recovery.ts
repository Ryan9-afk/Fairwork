import { createClient } from "./client";
import {
  bufferToBase64,
  base64ToBuffer,
  deriveKeyFromPin,
  deriveRecoveryIdVerifier,
  verifyVaultKey,
} from "@/lib/crypto";
import {
  getWorkerProfile,
  saveEvidenceRecord,
  saveIncident,
  saveShift,
  saveVaultMetadata,
  saveWorkerProfile,
  saveWorkArrangement,
  type EvidenceAttachment,
  type StoredIncident,
  type StoredShift,
  type VaultMetadata,
} from "@/lib/vault-db";
import type { Database, Json } from "@/types/supabase";
import type { ShiftDayType } from "@/lib/legal-engine";

export function normalizeKenyanPhone(input: string): string | null {
  const compact = input.trim().replace(/[\s()-]/g, "");
  if (/^\+\d{8,15}$/.test(compact)) return compact;
  if (/^254\d{9}$/.test(compact)) return `+${compact}`;
  if (/^0\d{9}$/.test(compact)) return `+254${compact.slice(1)}`;
  return null;
}

function readableSupabaseError(error: { message: string }): Error {
  if (/vault_recovery_metadata|recovery_id_(hash|salt)/i.test(error.message)) {
    return new Error(
      "Backup recovery is not enabled in the connected Supabase project yet. Apply the new Supabase migration, then retry.",
    );
  }
  return new Error(error.message);
}

export async function beginPhoneLink(phone: string): Promise<{ status: "verified" | "code-sent"; userId: string }> {
  const supabase = createClient();
  const currentUser = await supabase.auth.getUser();
  let user = currentUser.data.user;
  if (currentUser.error || !user) {
    const signedIn = await supabase.auth.signInAnonymously();
    if (signedIn.error || !signedIn.data.user) {
      throw new Error(signedIn.error?.message || "Could not create a secure backup session.");
    }
    user = signedIn.data.user;
  }

  if (user.phone === phone && user.phone_confirmed_at) return { status: "verified", userId: user.id };
  const { data, error: updateError } = await supabase.auth.updateUser({ phone });
  if (updateError) throw new Error(updateError.message);
  if (data.user?.phone === phone && data.user.phone_confirmed_at) return { status: "verified", userId: user.id };
  return { status: "code-sent", userId: user.id };
}

export async function verifyPhoneLink(phone: string, token: string, expectedUserId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "phone_change",
  });
  if (error) throw new Error(error.message);
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || data.user?.id !== expectedUserId || data.user.phone !== phone || !data.user.phone_confirmed_at) {
    // Supabase has documented an edge case where abandoned phone-change requests
    // can make an OTP match a different pending account. Never back up unless the
    // verified phone remains attached to the exact session that initiated it.
    await supabase.auth.signOut();
    throw new Error("Phone verification could not be safely linked to this backup. Start again or use a different number.");
  }
}

export async function requestBackupRecoveryCode(phone: string): Promise<void> {
  const { error } = await createClient().auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: false },
  });
  if (error) throw new Error(error.message);
}

type CipherPayload = { ciphertext: string; iv: string };
type BackupTables = Database["public"]["Tables"];

function readCipherPayload(value: Json | null): CipherPayload | undefined {
  if (!value || Array.isArray(value) || typeof value !== "object") return undefined;
  const payload = value as Record<string, Json | undefined>;
  if (typeof payload.ciphertext !== "string" || typeof payload.iv !== "string") return undefined;
  return { ciphertext: payload.ciphertext, iv: payload.iv };
}

function toDataUrl(blob: Blob, mimeType: string): Promise<string> {
  return blob.arrayBuffer().then((buffer) => `data:${mimeType};base64,${bufferToBase64(buffer)}`);
}

async function fetchPaged<T>(
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await fetchPage(from, from + 499);
    if (error) throw readableSupabaseError(error);
    const rows = data || [];
    all.push(...rows);
    if (rows.length < 500) return all;
  }
}

export async function restoreBackupWithOtp({
  phone,
  token,
  nationalId,
  pin,
}: {
  phone: string;
  token: string;
  nationalId: string;
  pin: string;
}): Promise<{ shifts: number; incidents: number; evidence: number }> {
  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (authError || !authData.user) {
    throw new Error(authError?.message || "The verification code could not be confirmed.");
  }
  const userId = authData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, phone, preferred_sector, recovery_id_hash, recovery_id_salt")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw readableSupabaseError(profileError);

  const normalizedId = nationalId.replace(/\D/g, "");
  if (
    !profile?.recovery_id_salt ||
    !profile.recovery_id_hash ||
    !normalizedId ||
    (await deriveRecoveryIdVerifier(normalizedId, base64ToBuffer(profile.recovery_id_salt))) !== profile.recovery_id_hash
  ) {
    throw new Error("We could not verify those recovery details. Check the ID number and linked phone, then try again.");
  }

  const { data: remoteMetadata, error: metadataError } = await supabase
    .from("vault_recovery_metadata")
    .select("salt_base64, verify_token_payload, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (metadataError) throw readableSupabaseError(metadataError);
  if (!remoteMetadata) {
    throw new Error("No encrypted backup is available for this account yet. Upload a backup from the original device first.");
  }

  const verifyTokenPayload = readCipherPayload(remoteMetadata.verify_token_payload);
  if (!verifyTokenPayload) throw new Error("The saved vault recovery data is incomplete.");
  const pinKey = await deriveKeyFromPin(pin, base64ToBuffer(remoteMetadata.salt_base64));
  if (!(await verifyVaultKey(pinKey, verifyTokenPayload))) {
    throw new Error("That vault PIN did not unlock this backup.");
  }

  const [arrangements, shifts, incidents, evidence] = await Promise.all([
    fetchPaged<BackupTables["work_arrangements"]["Row"]>(async (from, to) => await supabase.from("work_arrangements").select("*").eq("user_id", userId).order("created_at").range(from, to)),
    fetchPaged<BackupTables["shifts"]["Row"]>(async (from, to) => await supabase.from("shifts").select("*").eq("user_id", userId).order("id").range(from, to)),
    fetchPaged<BackupTables["incidents"]["Row"]>(async (from, to) => await supabase.from("incidents").select("*").eq("user_id", userId).order("id").range(from, to)),
    fetchPaged<BackupTables["evidence_files"]["Row"]>(async (from, to) => await supabase.from("evidence_files").select("*").eq("user_id", userId).order("created_at").range(from, to)),
  ]);

  const restoredArrangements = arrangements.map((row) => ({
    id: row.id,
    label: row.label,
    sector: row.sector as import("@/lib/legal-engine").KenyanSector,
    paymentBasis: row.payment_basis as import("@/lib/work-arrangements").WorkArrangement["paymentBasis"],
    employerOrClient: row.employer_or_client || undefined,
    customFields: (row.custom_fields && typeof row.custom_fields === "object" && !Array.isArray(row.custom_fields)
      ? row.custom_fields
      : {}) as Record<string, string>,
    confirmed: row.confirmed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const restoredShifts: StoredShift[] = shifts.map((row) => ({
    id: Number(row.client_id || row.id),
    date: row.shift_date,
    employer: row.employer || "",
    location: row.location || "",
    start: row.start_time || "",
    end: row.end_time || "",
    agreed: Number(row.agreed_pay || 0),
    paid: Number(row.amount_paid || 0),
    sunday: !!row.is_sunday_or_holiday,
    dayType: (row.day_type || (row.is_sunday_or_holiday ? "rest_day" : "normal")) as ShiftDayType,
    sector: row.sector as StoredShift["sector"],
    arrangementId: row.arrangement_id || undefined,
    isEncrypted: !!row.is_encrypted,
    ciphertextPayload: readCipherPayload(row.ciphertext_payload),
  }));

  const restoredIncidents: StoredIncident[] = incidents.map((row) => ({
    id: Number(row.client_id || row.id),
    date: row.incident_date,
    category: row.category as StoredIncident["category"],
    description: row.description || "",
    employer: row.employer || undefined,
    location: row.location || undefined,
    witnesses: row.witnesses || undefined,
    arrangementId: row.arrangement_id || undefined,
    isEncrypted: !!row.is_encrypted,
    ciphertextPayload: readCipherPayload(row.ciphertext_payload),
    createdAt: row.created_at,
  }));

  const restoredEvidence: EvidenceAttachment[] = await Promise.all(evidence.map(async (row) => {
    let dataUrl = "";
    let ciphertextPayload: CipherPayload | undefined;
    if (row.storage_path) {
      const { data: blob, error } = await supabase.storage.from("evidence-vault").download(row.storage_path);
      if (error || !blob) throw new Error(`Could not restore evidence file ${row.file_name}: ${error?.message || "download failed"}`);
      if (row.is_encrypted) {
        try {
          ciphertextPayload = readCipherPayload(JSON.parse(await blob.text()) as Json);
        } catch {
          throw new Error(`The encrypted evidence file ${row.file_name} is damaged.`);
        }
      } else {
        dataUrl = await toDataUrl(blob, row.mime_type || "application/octet-stream");
      }
    }
    return {
      id: row.id,
      parentId: row.parent_id || undefined,
      parentType: row.parent_type as EvidenceAttachment["parentType"],
      fileName: row.file_name,
      fileSize: Number(row.file_size),
      mimeType: row.mime_type,
      sha256Hash: row.sha256_hash,
      createdAt: row.created_at,
      paymentType: row.payment_type as EvidenceAttachment["paymentType"],
      notes: row.notes || undefined,
      isEncrypted: !!row.is_encrypted,
      ciphertextPayload,
      dataUrl,
      arrangementId: row.arrangement_id || undefined,
    };
  }));

  const localProfile = await getWorkerProfile();
  const restoredProfile = {
    id: "current" as const,
    name: profile?.display_name || localProfile?.name || "Worker",
    phone: profile?.phone || phone,
    sector: profile?.preferred_sector || localProfile?.sector,
    county: localProfile?.county,
    recoveryIdHash: profile.recovery_id_hash,
    recoveryIdSaltBase64: profile.recovery_id_salt,
    updatedAt: new Date().toISOString(),
  };

  const metadata: VaultMetadata = {
    id: "primary",
    saltBase64: remoteMetadata.salt_base64,
    verifyTokenPayload,
    isPinEnabled: true,
    createdAt: remoteMetadata.created_at,
  };

  // Persist only after every cloud record and evidence blob has been retrieved.
  await Promise.all(restoredArrangements.map(saveWorkArrangement));
  await Promise.all(restoredShifts.map(saveShift));
  await Promise.all(restoredIncidents.map(saveIncident));
  await Promise.all(restoredEvidence.map(saveEvidenceRecord));
  await saveVaultMetadata(metadata);
  await saveWorkerProfile(restoredProfile);

  return { shifts: restoredShifts.length, incidents: restoredIncidents.length, evidence: restoredEvidence.length };
}
