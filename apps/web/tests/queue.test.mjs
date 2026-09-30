import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  database,
  enqueue,
  queued,
  syncQueue,
  saveState,
  readState,
  recordLocal,
  archiveConflicts,
} from "../lib/queue.mjs";
test("events persist, order correctly, retain failures and only remove acknowledged IDs", async () => {
  const db = await database();
  await db.clear("queue");
  await enqueue({ id: "second", sequence: 2, quantity: 20 });
  await enqueue({ id: "first", sequence: 1, quantity: 10 });
  assert.deepEqual(
    (await queued()).map((e) => e.id),
    ["first", "second"],
  );
  await assert.rejects(
    syncQueue(async () => {
      throw new Error("offline");
    }),
  );
  assert.equal((await queued()).length, 2);
  const sent = [];
  await syncQueue(async (e) => {
    sent.push(e.id);
    return { quantity: 70, version: 3 };
  });
  assert.deepEqual(sent, ["first", "second"]);
  assert.equal((await queued()).length, 0);
  assert.equal((await readState("stock")).quantity, 70);
  await saveState("stock", { quantity: 123 });
  assert.equal((await readState("stock")).quantity, 123);
});
test("duplicate local ID replaces rather than doubles an event", async () => {
  await enqueue({ id: "same", sequence: 1, quantity: 50 });
  await enqueue({ id: "same", sequence: 1, quantity: 50 });
  assert.equal((await queued()).length, 1);
  await (await database()).clear("queue");
});
test("partial synchronization preserves remaining provisional stock and conflict archive", async () => {
  await recordLocal(
    { id: "one", sequence: 1, quantity: 10 },
    { quantity: 90, version: 2 },
  );
  await recordLocal(
    { id: "two", sequence: 2, quantity: 20 },
    { quantity: 70, version: 3 },
  );
  await assert.rejects(
    syncQueue(async (event) => {
      if (event.id === "two") throw new Error("conflict");
      return { quantity: 90, version: 2 };
    }),
  );
  assert.equal((await queued()).length, 1);
  assert.equal((await readState("stock")).quantity, 70);
  await archiveConflicts();
  assert.equal((await queued()).length, 0);
  assert.equal((await readState("conflictArchive")).at(-1).events[0].id, "two");
});
