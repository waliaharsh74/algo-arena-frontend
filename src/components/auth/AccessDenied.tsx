import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const AccessDenied = () => (
  <Card className="animate-fade-up">
    <CardHeader>
      <div className="flex items-center gap-2 text-primary">
        <ShieldAlert className="h-5 w-5" />
        <CardTitle>Admin access required</CardTitle>
      </div>
      <CardDescription>
        Contest creation and updates are limited to admin accounts.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-wrap items-center gap-3">
      <Button asChild>
        <Link to="/contests">Go to contest explorer</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/">Back to home</Link>
      </Button>
    </CardContent>
  </Card>
);
