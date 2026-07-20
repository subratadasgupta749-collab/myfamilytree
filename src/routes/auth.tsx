import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookHeart, Loader2 } from "lucide-react";

const authSearchSchema = z.object({
  mode: z.enum(["login", "register", "forgot"]).optional().default("login"),
  ref: z.string().optional(),
});

const REF_STORAGE_KEY = "mfhb.referral_code";

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — My Family History Book" },
      { name: "description", content: "Sign in or create your account to start your family history book." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(128);
const nameSchema = z.string().trim().min(1, "Required").max(100);

function AuthPage() {
  const { mode, ref } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Persist referral code across the OAuth redirect
  useEffect(() => {
    if (ref && typeof window !== "undefined") {
      try { sessionStorage.setItem(REF_STORAGE_KEY, ref); } catch { /* ignore */ }
    }
  }, [ref]);

  useEffect(() => {
    if (loading || !user) return;
    // Attempt to attach a referral captured before OAuth. Dedupes server-side.
    try {
      const ref = typeof window !== "undefined" ? sessionStorage.getItem(REF_STORAGE_KEY) : null;
      if (ref) {
        import("@/lib/referrals.functions").then(({ attachReferralOnSignup }) =>
          attachReferralOnSignup({ data: { code: ref } }).catch(() => {}),
        );
        try { sessionStorage.removeItem(REF_STORAGE_KEY); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">

      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <BookHeart className="h-5 w-5 text-primary" />
          My Family History Book
        </Link>
        <div className="rounded-2xl border border-border/60 bg-background p-8 shadow-sm">
          {mode === "forgot" ? (
            <ForgotForm />
          ) : mode === "register" ? (
            <RegisterForm />
          ) : (
            <LoginForm />
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = googleClientId && !googleClientId.includes("YOUR_GOOGLE_CLIENT_ID");

  useEffect(() => {
    if (!isConfigured) return;

    const handleCredentialResponse = async (response: any) => {
      setBusy(true);
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard", replace: true });
      } catch (error: any) {
        toast.error(error.message || "Google login failed");
        setBusy(false);
      }
    };

    const initializeGoogleSignIn = () => {
      const g = (window as any).google;
      if (g) {
        g.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });

        const btnElement = document.getElementById("google-signin-button-container");
        if (btnElement) {
          g.accounts.id.renderButton(btnElement, {
            theme: "outline",
            size: "large",
            width: "384", // standard width for layout
            text: label === "Sign up with Google" ? "signup_with" : "signin_with",
          });
        }
      }
    };

    const g = (window as any).google;
    if (g) {
      initializeGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        const g = (window as any).google;
        if (g) {
          initializeGoogleSignIn();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [label, navigate, isConfigured, googleClientId]);

  if (!isConfigured) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4 text-xs text-yellow-800">
        <p className="font-semibold">Google Client ID is not configured</p>
        <p className="mt-1">
          To enable Google login, please obtain a Client ID from Google Cloud Console and add it to{" "}
          <code>VITE_GOOGLE_CLIENT_ID</code> in your <code>.env</code> file.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div id="google-signin-button-container" className="w-full min-h-[40px] flex justify-center" />
      {busy && (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          Signing in...
        </div>
      )}
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = z.object({ email: emailSchema, password: z.string().min(1, "Required") }).safeParse({ email, password });
    if (!p.success) {
      toast.error(p.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: p.data.email, password: p.data.password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your family history book.</p>
      <div className="mt-6">
        <GoogleButton label="Continue with Google" />
      </div>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        OR
        <div className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/auth" search={{ mode: "forgot" }} className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/auth" search={{ mode: "register" }} className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}

function RegisterForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema }).safeParse({ name, email, password });
    if (!p.success) {
      toast.error(p.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: p.data.email,
      password: p.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: p.data.name },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);

    // Best-effort post-signup automation. If email confirm is required,
    // the user isn't authenticated yet — the calls will simply no-op.
    try {
      const { sendWelcomeEmail } = await import("@/lib/onboarding.functions");
      await sendWelcomeEmail();
    } catch { /* ignore */ }

    try {
      const ref = typeof window !== "undefined" ? sessionStorage.getItem(REF_STORAGE_KEY) : null;
      if (ref) {
        const { attachReferralOnSignup } = await import("@/lib/referrals.functions");
        await attachReferralOnSignup({ data: { code: ref } });
        try { sessionStorage.removeItem(REF_STORAGE_KEY); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }

    toast.success("Account created. Check your email if confirmation is required.");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Start preserving your family's story today.</p>
      <div className="mt-6">
        <GoogleButton label="Sign up with Google" />
      </div>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        OR
        <div className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/auth" search={{ mode: "login" }} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = emailSchema.safeParse(email);
    if (!p.success) return toast.error(p.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(p.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Password reset email sent");
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll email you a secure link to set a new password.
      </p>
      {sent ? (
        <div className="mt-6 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
          If an account exists for <strong className="text-foreground">{email}</strong>, a reset link is on the way.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send reset link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/auth" search={{ mode: "login" }} className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
