import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthPanel } from "@/features/auth/AuthPanel";

export const AuthGate = () => (
  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
    <Card className="bg-hero-glow">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <CardTitle>Sign in to enter the arena</CardTitle>
        </div>
        <CardDescription>
          Your session keeps contests secure, scores accurate, and admin tools locked to the right
          team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-4 text-sm text-muted-foreground">
          Use your arena credentials to unlock live rounds, join leaderboards, and manage contests
          based on your role.
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Live scoring</Badge>
          <Badge variant="secondary">Role-based access</Badge>
          <Badge variant="secondary">Timed MCQs</Badge>
        </div>
      </CardContent>
    </Card>
    <AuthPanel />
  </div>
);
