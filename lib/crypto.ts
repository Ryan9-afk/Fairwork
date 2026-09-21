/**
 * Web Crypto API utilities for Fairwork Pulse Zero-Knowledge Vault.
 * Uses PBKDF2 for key derivation and AES-GCM-256 for authenticated encryption.
 * Computes SHA-256 hashes for evidence verification and tamper-evident audit chains.
 */

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH_BYTES = 12; // 96-bit recommended IV for AES-GCM

export function generateSalt(length = 16): Uint8Array {
  const salt = new Uint8Array(length);
  window.crypto.getRandomValues(salt);
  return salt;
}

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derives an AES-GCM-256 key from a worker PIN using PBKDF2 with SHA-256.
 */
export async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    pinBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts an arbitrary JSON-serializable object with AES-GCM.
 */
export async function encryptData<T>(
  data: T,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(JSON.stringify(data));

  const iv = new Uint8Array(IV_LENGTH_BYTES);
  window.crypto.getRandomValues(iv);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    key,
    plaintextBuffer as unknown as BufferSource
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts an AES-GCM ciphertext string back to the original object.
 */
export async function decryptData<T>(
  payload: { ciphertext: string; iv: string },
  key: CryptoKey
): Promise<T> {
  const ciphertextBuffer = base64ToBuffer(payload.ciphertext);
  const iv = base64ToBuffer(payload.iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    key,
    ciphertextBuffer as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  const jsonStr = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as T;
}

/**
 * Encrypts a raw string (e.g. data URL) with AES-GCM.
 */
export async function encryptString(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);

  const iv = new Uint8Array(IV_LENGTH_BYTES);
  window.crypto.getRandomValues(iv);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    key,
    plaintextBuffer as unknown as BufferSource
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts an AES-GCM ciphertext payload back into a string.
 */
export async function decryptString(
  payload: { ciphertext: string; iv: string },
  key: CryptoKey
): Promise<string> {
  const ciphertextBuffer = base64ToBuffer(payload.ciphertext);
  const iv = base64ToBuffer(payload.iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    key,
    ciphertextBuffer as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Encrypts arbitrary binary data (Uint8Array or ArrayBuffer) with AES-GCM.
 */
export async function encryptBinary(
  data: Uint8Array | ArrayBuffer,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const iv = new Uint8Array(IV_LENGTH_BYTES);
  window.crypto.getRandomValues(iv);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    key,
    bytes as unknown as BufferSource
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts an AES-GCM ciphertext payload back into raw binary bytes.
 */
export async function decryptBinary(
  payload: { ciphertext: string; iv: string },
  key: CryptoKey
): Promise<Uint8Array> {
  const ciphertextBuffer = base64ToBuffer(payload.ciphertext);
  const iv = base64ToBuffer(payload.iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    key,
    ciphertextBuffer as unknown as BufferSource
  );

  return new Uint8Array(decryptedBuffer);
}

/**
 * Computes a standard SHA-256 checksum (hex formatted) for audit trails and file integrity.
 */
export async function computeSha256(
  data: ArrayBuffer | Uint8Array | string
): Promise<string> {
  const source: unknown =
    typeof data === "string" ? new TextEncoder().encode(data) : data;

  const hashBuffer = await window.crypto.subtle.digest("SHA-256", source as BufferSource);
  return bufferToHex(hashBuffer);
}

const VAULT_VERIFY_PAYLOAD = "FAIRWORK_PULSE_VALID_VAULT_TOKEN_2026";

/**
 * Creates an encrypted verification token to test PIN validity upon unlocking.
 */
export async function createVaultVerificationToken(
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  return encryptData({ token: VAULT_VERIFY_PAYLOAD }, key);
}

/**
 * Verifies if the supplied derived key correctly decrypts the test token.
 */
export async function verifyVaultKey(
  key: CryptoKey,
  tokenPayload: { ciphertext: string; iv: string }
): Promise<boolean> {
  try {
    const result = await decryptData<{ token: string }>(tokenPayload, key);
    return result?.token === VAULT_VERIFY_PAYLOAD;
  } catch {
    return false;
  }
}
