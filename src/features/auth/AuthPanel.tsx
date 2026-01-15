import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import { Mail, Shield, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { loginFormSchema, registerFormSchema, type LoginFormValues } from "@/types/forms";

const initialValues: LoginFormValues = {
  email: "",
  password: "",
};

type FormErrors = Partial<Record<keyof LoginFormValues, string>>;

export const AuthPanel = () => {
  const { status, login, register } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const isLoading = status === "loading";
  const schema = useMemo(() => (mode === "login" ? loginFormSchema : registerFormSchema), [mode]);

  const handleChange = (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    const success = mode === "login" ? await login(result.data) : await register(result.data);
    if (success) {
      setValues(initialValues);
      setErrors({});
    }
  };

  return (
    <Card id="auth" className="animate-fade-up">
      <CardHeader>
        <div className="flex items-center gap-3 text-primary">
          {mode === "login" ? <Shield className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          <CardTitle>Access the arena</CardTitle>
        </div>
        <CardDescription>
          Sign in to join contests, submit answers, and climb the live leaderboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">Sign in</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="login-email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@arena.com"
                    value={values.email}
                    onChange={handleChange("email")}
                    className="pl-10"
                  />
                </div>
                {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="login-password">
                  Password
                </label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="password"
                  value={values.password}
                  onChange={handleChange("password")}
                />
                {errors.password ? (
                  <p className="text-xs text-destructive">{errors.password}</p>
                ) : null}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Enter the arena"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="register-email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@arena.com"
                    value={values.email}
                    onChange={handleChange("email")}
                    className="pl-10"
                  />
                </div>
                {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="register-password">
                  Password
                </label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={values.password}
                  onChange={handleChange("password")}
                />
                {errors.password ? (
                  <p className="text-xs text-destructive">{errors.password}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Use 8-72 characters. Mix letters and numbers for better security.
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

