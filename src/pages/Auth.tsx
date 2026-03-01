import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Car, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const usernameSchema = z.string().regex(/^[a-zA-Z]{5,10}$/, "Username must be 5-10 letters only");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, signInWithUsername } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      toast({ title: t("auth.error"), description: t("auth.invalidUsername"), variant: "destructive" });
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({ title: t("auth.error"), description: t("auth.passwordTooShort"), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await signInWithUsername(username, password);
    if (error) {
      toast({ title: t("auth.error"), description: t("auth.invalidCredentials"), variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary rounded-lg">
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-foreground">{t("app.name")}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{t("app.description")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl sm:text-2xl">{t("auth.signIn")}</CardTitle>
            <CardDescription className="text-sm">{t("auth.signInDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t("auth.username")}</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 10))}
                  placeholder={t("auth.usernamePlaceholder")}
                  required
                  minLength={5}
                  maxLength={10}
                  className="h-11 text-base"
                  autoComplete="username"
                  autoCapitalize="none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11 text-base"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base gap-2 mt-2" disabled={submitting}>
                {submitting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {t("auth.signIn")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
