import { openDB } from "idb";
export const database = () =>
  openDB("arogyamesh-operator", 1, {
    upgrade(db) {
      db.createObjectStore("queue", { keyPath: "id" });
      db.createObjectStore("state");
    },
  });
export async function enqueue(event) {
  const db = await database();
  await db.put("queue", event);
}
export async function recordLocal(event, stock) {
  const db = await database();
  const tx = db.transaction(["queue", "state"], "readwrite");
  await tx.objectStore("queue").put(event);
  await tx.objectStore("state").put(stock, "stock");
  await tx.done;
}
export async function rebaseQueue(events, stock) {
  const db = await database();
  const tx = db.transaction(["queue", "state"], "readwrite");
  for (const event of events) await tx.objectStore("queue").put(event);
  await tx.objectStore("state").put(stock, "stock");
  await tx.done;
}
export async function archiveConflicts() {
  const db = await database();
  const tx = db.transaction(["queue", "state"], "readwrite");
  const events = await tx.objectStore("queue").getAll();
  const archive = (await tx.objectStore("state").get("conflictArchive")) || [];
  await tx
    .objectStore("state")
    .put(
      [...archive, { archived_at: new Date().toISOString(), events }],
      "conflictArchive",
    );
  await tx.objectStore("queue").clear();
  await tx.done;
}
export async function queued() {
  const db = await database();
  return (await db.getAll("queue")).sort((a, b) => a.sequence - b.sequence);
}
export async function saveState(key, value) {
  const db = await database();
  await db.put("state", value, key);
}
export async function readState(key) {
  const db = await database();
  return db.get("state", key);
}
export async function syncQueue(send) {
  const db = await database();
  let synced = 0;
  for (const event of await queued()) {
    // Delete only after a server acknowledgement. A lost response safely retries the same ID.
    const result = await send(event);
    const tx = db.transaction(["queue", "state"], "readwrite");
    await tx.objectStore("queue").delete(event.id);
    if ((await tx.objectStore("queue").count()) === 0)
      await tx.objectStore("state").put(result, "stock");
    await tx.done;
    synced++;
  }
  return synced;
}
