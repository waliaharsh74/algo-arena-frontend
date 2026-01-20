import { ClipboardList, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContestAdminPanel } from "@/features/contests/ContestAdminPanel";
import { ContestQuestionPanel } from "@/features/contests/ContestQuestionPanel";
import { QuestionLibraryPanel } from "@/features/contests/QuestionLibraryPanel";

export const ContestCreationPage = () => (
  <div className="space-y-8">
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="bg-hero-glow">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <CardTitle>Contest creation</CardTitle>
          </div>
          <CardDescription>
            Plan upcoming rounds, adjust timings, and keep the arena flowing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-background/80 p-4 text-sm text-muted-foreground">
            Keep contests short and focused. Clear descriptions help participants pick the right
            round fast.
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Timed rounds</Badge>
            <Badge variant="secondary">Role-gated tools</Badge>
            <Badge variant="secondary">Live scoring</Badge>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <ClipboardList className="h-5 w-5" />
            <CardTitle>Admin checklist</CardTitle>
          </div>
          <CardDescription>Keep each contest polished before publishing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Confirm start and end times in your local timezone.</p>
          <p>Double-check descriptions to highlight the focus area.</p>
          <p>Preview upcoming rounds before announcing them.</p>
        </CardContent>
      </Card>
    </section>
    <ContestAdminPanel />
    <ContestQuestionPanel />
    <QuestionLibraryPanel />
  </div>
);
