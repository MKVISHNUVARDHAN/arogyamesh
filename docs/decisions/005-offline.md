# Offline synchronization

The service worker caches visited UI/static responses; API data is not silently served stale. IndexedDB atomically stores each local event and provisional stock. Events have stable UUIDs, a sequence number, resource version, quantity, type and client timestamp.

Sync processes events in order and deletes each only after acknowledgement. Replayed IDs return the original result without a second inventory effect. A lost network response can safely retry the same ID. Server stock is versioned; conflicts stop the queue. Operators explicitly review and rebase additive/dispense deltas on current stock. Physical reconciliation conflicts require a fresh count rather than automatic rebasing.

The current operator station is deliberately bound to PHC-A and ORS. Receive/reconcile workflows require the counted batch expiry; multi-batch counting is a production extension. An initial online visit is required. No browser application can cold-start offline before its assets and local data are cached.

The demo offline toggle exercises queue behavior; the browser E2E suite also tests actual network loss, reload and reconnect. Model timestamps and sync lag remain server-observable only after reconnection.
