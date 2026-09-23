import { afterEach, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { clearLocalVault, getAllShifts, getAllIncidents, getAllEvidence, getWorkerProfile, getVaultMetadata, saveShift, saveIncident, saveWorkerProfile, saveVaultMetadata } from "./vault-db";

afterEach(() => vi.unstubAllGlobals());

it("clears existing device data and PIN, then accepts fresh records", async () => {
  const storage = new Map<string, string>();
  vi.stubGlobal("window", { indexedDB: new IDBFactory(), localStorage: {
    setItem: (key: string, value: string) => storage.set(key, value),
    getItem: (key: string) => storage.get(key) ?? null,
    removeItem: (key: string) => storage.delete(key),
  } });
  await saveWorkerProfile({ id: "current", name: "Test worker", updatedAt: "2026-09-23" });
  await saveVaultMetadata({ id: "primary", saltBase64: "test", verifyTokenPayload: { ciphertext: "test", iv: "test" }, isPinEnabled: true, createdAt: "2026-09-23" });
  const shift = { id: 1, date: "2026-09-23", employer: "Test", location: "Test", start: "08:00", end: "16:00", agreed: 800, paid: 800, sunday: false };
  await saveShift(shift);
  await saveIncident({ id: 2, date: "2026-09-23", category: "general", description: "Test", evidenceIds: [], createdAt: "2026-09-23" });
  expect(await getAllShifts()).toHaveLength(1);
  await clearLocalVault();
  expect(await getAllShifts()).toEqual([]);
  expect(await getAllIncidents()).toEqual([]);
  expect(await getAllEvidence()).toEqual([]);
  expect(await getWorkerProfile()).toBeNull();
  expect(await getVaultMetadata()).toBeNull();
  await saveShift({ ...shift, id: 3 });
  expect((await getAllShifts()).map((item) => item.id)).toEqual([3]);
});
