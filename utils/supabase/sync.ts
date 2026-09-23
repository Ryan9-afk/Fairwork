/**
 * Client-side encrypted Supabase backup engine for Fairwork Pulse.
 * Synchronizes local IndexedDB shifts, incidents, and evidence records with Supabase PostgreSQL.
 * If client-side encryption is active, sensitive content is sent as ciphertext alongside operational metadata,
 * so sensitive wage, incident, and evidence content can be uploaded as ciphertext.
 */

import { createClient } from "./client";
import {
  getAllShifts,
  getAllIncidents,
  getAllEvidence,
  getAllWorkArrangements,
  getWorkerProfile,
  getVaultMetadata,
} from "@/lib/vault-db";
import { encryptString } from "@/lib/crypto";

export interface SyncStatus {
  lastSyncTime: string | null;
  pendingCount: number;
  isSyncing: boolean;
  error: string | null;
}

export async function syncVaultToSupabase(vaultKey?: CryptoKey | null): Promise<{
  success: boolean;
  uploadedShifts: number;
  uploadedIncidents: number;
  uploadedEvidence: number;
  uploadedArrangements: number;
  userId?: string;
  error?: string;
  errors?: string[];
}> {
  const syncErrors: string[] = [];
  let uploadedShifts = 0;
  let uploadedIncidents = 0;
  let uploadedEvidence = 0;
  let uploadedArrangements = 0;

  try {
    const supabase = createClient();
    const { data: { user: initialUser }, error: authError } = await supabase.auth.getUser();
    let user = initialUser;

    // If no active session, try anonymous sign-in
    if (authError || !user) {
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (!anonError && anonData?.user) {
        user = anonData.user;
      }
    }

    if (!user) {
      return {
        success: false,
        uploadedShifts: 0,
        uploadedIncidents: 0,
        uploadedEvidence: 0,
        uploadedArrangements: 0,
        error: "Supabase authentication required. Please sign in or enable anonymous sign-in in Supabase Auth settings.",
        errors: ["Authentication failed: No user session found."],
      };
    }

    if (!user.phone || !user.phone_confirmed_at) {
      return {
        success: false,
        uploadedShifts: 0,
        uploadedIncidents: 0,
        uploadedEvidence: 0,
        uploadedArrangements: 0,
        error: "Verify a phone number before uploading so you can recover this backup on another device.",
        errors: ["A verified phone number is required for backup recovery."],
      };
    }

    const workerProfile = await getWorkerProfile();
    if (!workerProfile?.recoveryIdHash || !workerProfile.recoveryIdSaltBase64) {
      return {
        success: false,
        uploadedShifts: 0,
        uploadedIncidents: 0,
        uploadedEvidence: 0,
        uploadedArrangements: 0,
        error: "Add your National ID verifier in your worker profile before uploading a recoverable backup.",
        errors: ["Recovery identity is not set up."],
      };
    }
    const vaultMetadata = await getVaultMetadata();
    if (!vaultMetadata?.isPinEnabled) {
      return {
        success: false,
        uploadedShifts: 0,
        uploadedIncidents: 0,
        uploadedEvidence: 0,
        uploadedArrangements: 0,
        error: "Set up your Vault PIN before uploading a recoverable backup.",
        errors: ["Vault PIN is not set up."],
      };
    }

    // 0. Sync Worker Profile if present
    try {
      if (workerProfile.name) {
        const profilePayload = {
          id: user.id,
          display_name: workerProfile.name,
          phone: workerProfile.phone || null,
          preferred_sector: workerProfile.sector || "construction",
          updated_at: new Date().toISOString(),
          ...(workerProfile.recoveryIdHash && workerProfile.recoveryIdSaltBase64
            ? {
                recovery_id_hash: workerProfile.recoveryIdHash,
                recovery_id_salt: workerProfile.recoveryIdSaltBase64,
              }
            : {}),
        };
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(profilePayload, { onConflict: "id" });
        if (profileError) {
          return {
            success: false,
            uploadedShifts: 0,
            uploadedIncidents: 0,
            uploadedEvidence: 0,
            uploadedArrangements: 0,
            error: `Worker profile recovery setup: ${profileError.message}`,
            errors: [profileError.message],
          };
        }
      }
    } catch (profileErr) {
      console.warn("Failed to sync profile:", profileErr);
    }

    // The PIN verifier and random salt are needed to unlock a restored backup.
    // They do not reveal the PIN; the PIN itself is never uploaded.
    try {
      const { error } = await supabase.from("vault_recovery_metadata").upsert(
        {
          user_id: user.id,
          salt_base64: vaultMetadata.saltBase64,
          verify_token_payload: vaultMetadata.verifyTokenPayload as unknown as import("@/types/supabase").Json,
          created_at: vaultMetadata.createdAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) {
        return {
          success: false,
          uploadedShifts: 0,
          uploadedIncidents: 0,
          uploadedEvidence: 0,
          uploadedArrangements: 0,
          error: `Vault recovery metadata: ${error.message}`,
          errors: [error.message],
        };
      }
    } catch (metadataError) {
      return {
        success: false,
        uploadedShifts: 0,
        uploadedIncidents: 0,
        uploadedEvidence: 0,
        uploadedArrangements: 0,
        error: `Vault recovery metadata: ${String(metadataError)}`,
        errors: [String(metadataError)],
      };
    }

    // 1. Sync work arrangements first. This also lazily migrates legacy local
    // records by assigning them the stable "Existing work" arrangement ID.
    const localArrangements = await getAllWorkArrangements();
    for (const arrangement of localArrangements) {
      const payload = {
        user_id: user.id,
        id: arrangement.id,
        label: arrangement.label,
        sector: arrangement.sector,
        payment_basis: arrangement.paymentBasis,
        employer_or_client: arrangement.employerOrClient || null,
        custom_fields: arrangement.customFields || {},
        confirmed: arrangement.confirmed,
        created_at: arrangement.createdAt,
        updated_at: arrangement.updatedAt,
      };
      const { error } = await supabase
        .from("work_arrangements")
        .upsert(payload, { onConflict: "user_id,id" });
      if (error) {
        syncErrors.push(`Work arrangement (${arrangement.label}): ${error.message}`);
      } else {
        uploadedArrangements++;
      }
    }

    // 2. Fetch local shifts from IndexedDB
    const localShifts = await getAllShifts();

    for (const shift of localShifts) {
      const payload = {
        user_id: user.id,
        client_id: String(shift.id),
        arrangement_id: shift.arrangementId || "legacy-existing-work",
        shift_date: shift.date,
        sector: shift.sector || "construction",
        employer: shift.isEncrypted ? "[ENCRYPTED]" : shift.employer,
        location: shift.isEncrypted ? "[ENCRYPTED]" : shift.location,
        start_time: shift.start,
        end_time: shift.end,
        agreed_pay: shift.isEncrypted ? 0 : shift.agreed,
        amount_paid: shift.isEncrypted ? 0 : shift.paid,
        is_sunday_or_holiday: shift.sunday,
        day_type: shift.dayType || (shift.sunday ? "rest_day" : "normal"),
        is_encrypted: !!shift.isEncrypted,
        ciphertext_payload: (shift.ciphertextPayload as unknown as import("@/types/supabase").Json) || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("shifts")
        .upsert(payload, { onConflict: "user_id,client_id" });

      if (error) {
        syncErrors.push(`Shift on ${shift.date}: ${error.message}`);
      } else {
        uploadedShifts++;
      }
    }

    // 3. Fetch local incidents from IndexedDB
    const localIncidents = await getAllIncidents();

    for (const inc of localIncidents) {
      const payload = {
        user_id: user.id,
        client_id: String(inc.id),
        arrangement_id: inc.arrangementId || "legacy-existing-work",
        category: inc.category,
        incident_date: inc.date,
        description: inc.isEncrypted ? "[ENCRYPTED IN VAULT]" : inc.description,
        employer: inc.employer || null,
        location: inc.location || null,
        witnesses: inc.witnesses || null,
        is_encrypted: !!inc.isEncrypted,
        ciphertext_payload: (inc.ciphertextPayload as unknown as import("@/types/supabase").Json) || null,
      };

      const { error } = await supabase
        .from("incidents")
        .upsert(payload, { onConflict: "user_id,client_id" });

      if (error) {
        syncErrors.push(`Incident (${inc.category}): ${error.message}`);
      } else {
        uploadedIncidents++;
      }
    }

    // 4. Fetch local evidence attachments from IndexedDB
    const localEvidence = await getAllEvidence();
    const arrangementByParent = new Map<string, string>();
    for (const shift of localShifts) {
      arrangementByParent.set(`shift:${shift.id}`, shift.arrangementId || "legacy-existing-work");
    }
    for (const incident of localIncidents) {
      arrangementByParent.set(`incident:${incident.id}`, incident.arrangementId || "legacy-existing-work");
    }

    for (const ev of localEvidence) {
      let storagePath: string | null = null;
      const shouldEncrypt = !!(ev.isEncrypted || vaultKey);

      // Determine upload blob:
      // When client-side encryption is active (ev.isEncrypted or vaultKey available),
      // upload the AES-256-GCM ciphertext payload, NEVER the raw image blob.
      try {
        let uploadBlob: Blob | null = null;
        let uploadContentType = ev.mimeType || "image/jpeg";
        let uploadExtension = ev.fileName.split(".").pop() || "bin";

        if (ev.isEncrypted && ev.ciphertextPayload) {
          // Upload ciphertext payload as JSON blob
          uploadBlob = new Blob([JSON.stringify(ev.ciphertextPayload)], {
            type: "application/json; charset=utf-8",
          });
          uploadContentType = "application/json";
          uploadExtension = "enc.json";
        } else if (vaultKey && ev.dataUrl && ev.dataUrl.startsWith("data:")) {
          // Encrypt raw data on client before sending to cloud
          const encrypted = await encryptString(ev.dataUrl, vaultKey);
          uploadBlob = new Blob([JSON.stringify(encrypted)], {
            type: "application/json; charset=utf-8",
          });
          uploadContentType = "application/json";
          uploadExtension = "enc.json";
        } else if (!shouldEncrypt && ev.dataUrl && ev.dataUrl.startsWith("data:")) {
          // Plaintext upload only if the user has not configured the client-side encrypted vault
          const res = await fetch(ev.dataUrl);
          uploadBlob = await res.blob();
        }

        if (uploadBlob) {
          const path = `${user.id}/${ev.id}.${uploadExtension}`;
          const { error: storageError } = await supabase.storage
            .from("evidence-vault")
            .upload(path, uploadBlob, {
              upsert: true,
              contentType: uploadContentType,
            });

          if (storageError) {
            syncErrors.push(`Evidence storage (${ev.fileName}): ${storageError.message}`);
          } else {
            storagePath = path;
          }
        }
      } catch (uploadErr) {
        syncErrors.push(`Evidence upload (${ev.fileName}): ${String(uploadErr)}`);
      }

      const payload = {
        id: ev.id,
        user_id: user.id,
        arrangement_id:
          ev.arrangementId ||
          arrangementByParent.get(`${ev.parentType}:${ev.parentId}`) ||
          "legacy-existing-work",
        parent_type: ev.parentType,
        parent_id: ev.parentId ? String(ev.parentId) : null,
        file_name: ev.fileName,
        file_size: ev.fileSize,
        mime_type: ev.mimeType,
        sha256_hash: ev.sha256Hash,
        payment_type: ev.paymentType || null,
        storage_path: storagePath,
        notes: ev.notes || null,
        is_encrypted: shouldEncrypt,
        created_at: ev.createdAt,
      };

      const { error: dbError } = await supabase
        .from("evidence_files")
        .upsert(payload, { onConflict: "id" });

      if (dbError) {
        syncErrors.push(`Evidence record (${ev.fileName}): ${dbError.message}`);
      } else {
        uploadedEvidence++;
      }
    }

    const isAllSuccessful = syncErrors.length === 0;

    return {
      success: isAllSuccessful,
      uploadedShifts,
      uploadedIncidents,
      uploadedEvidence,
      uploadedArrangements,
      userId: user.id,
      error: syncErrors.length > 0 ? syncErrors.join("; ") : undefined,
      errors: syncErrors,
    };
  } catch (err) {
    return {
      success: false,
      uploadedShifts,
      uploadedIncidents,
      uploadedEvidence,
      uploadedArrangements,
      error: String(err),
      errors: [...syncErrors, String(err)],
    };
  }
}
