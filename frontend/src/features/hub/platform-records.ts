import { platformApi } from "./platform-api";

type Kind = "members" | "materials" | "events" | "proofs" | "applications";
/** Re-reads school registers, requests, materials, activities and evidence from the platform. */
export const resyncSchoolData = () => window.dispatchEvent(new Event("plp:school-data-updated"));

/** Creates a record, or replaces an existing one at the version the user saw (conflicts are rejected by the server). */
export async function saveRecord(kind: Kind, data: Record<string, unknown>, existing?: { id: string; version?: number }) {
  const result = existing
    ? await platformApi<{ ok: boolean }>(`/records/${kind}/${existing.id}`, "PUT", { version: existing.version, data })
    : await platformApi<{ id: string }>(`/records/${kind}`, "POST", data);
  resyncSchoolData();
  return result;
}
export async function deleteRecord(kind: Kind, id: string) {
  await platformApi(`/records/${kind}/${id}`, "DELETE");
  resyncSchoolData();
}
/** Reads the full stored data of a record, so updates keep fields this screen does not edit. */
export const readRecord = <T,>(kind: Kind, id: string) => platformApi<{ version: number; data: T; school_id: string | null }>(`/records/${kind}/${id}`);
