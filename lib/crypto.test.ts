import { describe, expect, it } from "vitest";
import {
  base64ToBuffer,
  bufferToBase64,
  bufferToHex,
  computeSha256,
  createVaultVerificationToken,
  decryptBinary,
  decryptData,
  decryptString,
  deriveKeyFromPin,
  deriveRecoveryIdVerifier,
  encryptBinary,
  encryptData,
  encryptString,
  generateSalt,
  verifyVaultKey,
} from "./crypto";

describe("generateSalt", () => {
  it("defaults to 16 bytes", () => {
    expect(generateSalt().byteLength).toBe(16);
  });

  it("honours a custom length", () => {
    expect(generateSalt(32).byteLength).toBe(32);
  });

  it("produces distinct salts", () => {
    expect(bufferToHex(generateSalt())).not.toBe(bufferToHex(generateSalt()));
  });
});

describe("base64 and hex helpers", () => {
  it("round-trips bytes through base64", () => {
    const original = new Uint8Array([0, 1, 2, 253, 254, 255]);
    expect(base64ToBuffer(bufferToBase64(original))).toEqual(original);
  });

  it("formats hex with zero padding", () => {
    expect(bufferToHex(new Uint8Array([0, 15, 255]))).toBe("000fff");
  });
});

describe("computeSha256", () => {
  it("matches the known digest for a string", async () => {
    expect(await computeSha256("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("matches the known digest for empty input", async () => {
    expect(await computeSha256("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("produces the same digest for equivalent string and byte input", async () => {
    const bytes = new TextEncoder().encode("fairwork");
    expect(await computeSha256(bytes)).toBe(await computeSha256("fairwork"));
  });
});

describe("AES-GCM vault encryption", () => {
  it("round-trips an object through encryptData/decryptData", async () => {
    const key = await deriveKeyFromPin("1234", generateSalt());
    const payload = { employer: "Acme", agreed: 1200, nested: { paid: false } };
    const encrypted = await encryptData(payload, key);
    expect(encrypted.ciphertext).not.toContain("Acme");
    expect(await decryptData<typeof payload>(encrypted, key)).toEqual(payload);
  });

  it("round-trips a string through encryptString/decryptString", async () => {
    const key = await deriveKeyFromPin("1234", generateSalt());
    const secret = "M-Pesa confirmation code QK12AB3XYZ";
    const encrypted = await encryptString(secret, key);
    expect(await decryptString(encrypted, key)).toBe(secret);
  });

  it("round-trips binary through encryptBinary/decryptBinary", async () => {
    const key = await deriveKeyFromPin("1234", generateSalt());
    const bytes = new Uint8Array([9, 8, 7, 6, 5, 0, 200]);
    const encrypted = await encryptBinary(bytes, key);
    expect(await decryptBinary(encrypted, key)).toEqual(bytes);
  });

  it("uses a unique IV per encryption", async () => {
    const key = await deriveKeyFromPin("1234", generateSalt());
    const first = await encryptString("same plaintext", key);
    const second = await encryptString("same plaintext", key);
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it("rejects decryption with the wrong PIN", async () => {
    const salt = generateSalt();
    const correctKey = await deriveKeyFromPin("1234", salt);
    const wrongKey = await deriveKeyFromPin("9999", salt);
    const encrypted = await encryptString("private", correctKey);
    await expect(decryptString(encrypted, wrongKey)).rejects.toThrow();
  });
});

describe("vault verification token", () => {
  it("accepts the key that created the token", async () => {
    const key = await deriveKeyFromPin("2468", generateSalt());
    const token = await createVaultVerificationToken(key);
    expect(await verifyVaultKey(key, token)).toBe(true);
  });

  it("rejects a different key", async () => {
    const salt = generateSalt();
    const key = await deriveKeyFromPin("2468", salt);
    const otherKey = await deriveKeyFromPin("0000", salt);
    const token = await createVaultVerificationToken(key);
    expect(await verifyVaultKey(otherKey, token)).toBe(false);
  });
});

describe("backup recovery ID verifier", () => {
  it("normalizes formatting and changes with the per-user salt", async () => {
    const salt = generateSalt();
    const formatted = await deriveRecoveryIdVerifier("12 345-678", salt);
    const plain = await deriveRecoveryIdVerifier("12345678", salt);
    const otherSalt = await deriveRecoveryIdVerifier("12345678", generateSalt());

    expect(formatted).toBe(plain);
    expect(otherSalt).not.toBe(plain);
    expect(plain).not.toContain("12345678");
  }, 30000);
});
