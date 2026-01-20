import { ContestExplorer } from "@/features/contests/ContestExplorer";
import { ContestWorkspace } from "@/features/contests/ContestWorkspace";

export const ContestExplorerPage = () => (
  <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
    <div className="space-y-6">
      <ContestExplorer />
    </div>
    <div className="space-y-6">
      <ContestWorkspace />
    </div>
  </div>
);
