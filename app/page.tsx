import { Suspense } from "react";
import { ControlPanel } from "@/components/control-panel";

export const dynamic = "force-dynamic";

function PanelFallback() {
  return (
    <div className="flex h-svh items-center justify-center text-sm text-zinc-500">
      Loading Control Center
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<PanelFallback />}>
      <ControlPanel />
    </Suspense>
  );
}
