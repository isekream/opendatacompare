import { Suspense } from "react";

import { CompareWorkspace } from "./compare-workspace";

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading compare workspace…
        </div>
      }
    >
      <CompareWorkspace />
    </Suspense>
  );
}
