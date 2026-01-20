import * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl bg-muted", className)}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      {children}
    </div>
  );
}

export { Skeleton };
