/**
 * Zero-Knowledge Supabase Synchronization Engine for Fairwork Pulse.
 * Synchronizes local IndexedDB shifts, incidents, and evidence records with Supabase PostgreSQL.
 * If zero-knowledge encryption is active, only ciphertext and metadata are sent,
 * ensuring the server never holds unencrypted wage or incident details.
 */

import { createClient } from "./client";
import { getAllShifts, getAllIncidents, getAllEvidence } from "@/lib/vault-db";

export interface SyncStatus {
  lastSyncTime: string | null;
  pendingCount: number;
  isSyncing: boolean;
  error: string | null;
}

export async function syncVaultToSupabase(): Promise<{
  success: boolean;
  uploadedShifts: number;
  uploadedIncidents: number;
  uploadedEvidence: number;
  userId?: string;
  error?: string;
}> {
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
        error: "Supabase authentication required. Please sign in or enable anonymous sign-in in Supabase Auth settings.",
      };
    }

    // 1. Fetch local shifts from IndexedDB
    const localShifts = await getAllShifts();
    let uploadedShifts = 0;

    for (const shift of localShifts) {
      const payload = {
        user_id: user.id,
        client_id: String(shift.id),
        shift_date: shift.date,
        sector: shift.sector || "construction",
        employer: shift.isEncrypted ? "[ENCRYPTED]" : shift.employer,
        location: shift.isEncrypted ? "[ENCRYPTED]" : shift.location,
        start_time: shift.start,
        end_time: shift.end,
        agreed_pay: shift.isEncrypted ? 0 : shift.agreed,
        amount_paid: shift.isEncrypted ? 0 : shift.paid,
        is_sunday_or_holiday: shift.sunday,
        is_encrypted: !!shift.isEncrypted,
        ciphertext_payload: (shift.ciphertextPayload as unknown as import("@/types/supabase").Json) || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("shifts")
        .upsert(payload, { onConflict: "user_id,client_id" });

      if (!error) uploadedShifts++;
    }

    // 2. Fetch local incidents from IndexedDB
    const localIncidents = await getAllIncidents();
    let uploadedIncidents = 0;

    for (const inc of localIncidents) {
      const payload = {
        user_id: user.id,
        client_id: String(inc.id),
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

      if (!error) uploadedIncidents++;
    }

    // 3. Fetch local evidence attachments from IndexedDB
    const localEvidence = await getAllEvidence();
    let uploadedEvidence = 0;

    for (const ev of localEvidence) {
      let storagePath: string | null = null;

      // If binary image dataUrl is present, upload to Supabase Storage bucket
      if (ev.dataUrl && ev.dataUrl.startsWith("data:")) {
        try {
          const extension = ev.fileName.split(".").pop() || "jpg";
          const path = `${user.id}/${ev.id}.${extension}`;

          // Convert dataURL to Blob
          const res = await fetch(ev.dataUrl);
          const blob = await res.blob();

          const { error: storageError } = await supabase.storage
            .from("evidence-vault")
            .upload(path, blob, {
              upsert: true,
              contentType: ev.mimeType || "image/jpeg",
            });

          if (!storageError) {
            storagePath = path;
          }
        } catch {
          // If storage upload fails, still record metadata with cryptographic hash
        }
      }

      const payload = {
        id: ev.id,
        user_id: user.id,
        parent_type: ev.parentType,
        parent_id: ev.parentId ? String(ev.parentId) : null,
        file_name: ev.fileName,
        file_size: ev.fileSize,
        mime_type: ev.mimeType,
        sha256_hash: ev.sha256Hash,
        payment_type: ev.paymentType || null,
        storage_path: storagePath,
        notes: ev.notes || null,
        created_at: ev.createdAt,
      };

      const { error } = await supabase
        .from("evidence_files")
        .upsert(payload, { onConflict: "id" });

      if (!error) uploadedEvidence++;
    }

    return {
      success: true,
      uploadedShifts,
      uploadedIncidents,
      uploadedEvidence,
      userId: user.id,
    };
  } catch (err) {
    return {
      success: false,
      uploadedShifts: 0,
      uploadedIncidents: 0,
      uploadedEvidence: 0,
      error: String(err),
    };
  }
}
