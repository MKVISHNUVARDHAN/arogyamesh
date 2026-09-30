import Dashboard from "../dashboard";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading ArogyaMesh…</p>}>
      <Dashboard />
    </Suspense>
  );
}
