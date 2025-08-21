
import { MainHeader } from "@/components/layout/main-header";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    // This component will be rendered within the <main> tag of (app)/layout.tsx during route transitions.
    // It aims to fill the content area provided by the layout.
    <div className="flex h-full flex-col"> {/* Occupy full height of its container from layout.tsx */}
      <MainHeader />
      <div className="flex flex-1 items-center justify-center p-6"> {/* flex-1 to grow and center content */}
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Loading page...</p>
        </div>
      </div>
    </div>
  );
}
