import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Home, Shield, Mail, Phone as PhoneIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — RentEase" }] }),
});

function LoginPage() {
  const { user, loading, signInEmail, signUpEmail, signInGoogle } = useAuth();
  const { setRole } = useRole();
  const navigate = useNavigate();

  if (loading) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">Loading…</div>;
  }

  if (user) {
    const pick = (r: "student" | "landlord" | "admin", to: string) => {
      setRole(r);
      navigate({ to });
    };
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold md:text-4xl">Continue as…</h1>
          <p className="mt-2 text-muted-foreground">
            Signed in as <span className="font-medium">{user.email ?? user.phoneNumber}</span>. Pick a role to continue.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { r: "student", to: "/browse", icon: GraduationCap, title: "Student", body: "Search verified listings, message landlords, and manage your rental." },
            { r: "landlord", to: "/landlord", icon: Home, title: "Landlord", body: "Post listings, manage tenants, and track monthly payments." },
            { r: "admin", to: "/admin", icon: Shield, title: "Admin", body: "Approve listings, review reports, and monitor platform activity." },
          ].map((c) => (
            <button
              key={c.r}
              onClick={() => pick(c.r as any, c.to)}
              className="group rounded-2xl border bg-card p-6 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-elevated)]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Welcome to RentEase</h1>
        <p className="mt-2 text-muted-foreground">Sign in to continue</p>
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <Tabs defaultValue="email">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email"><Mail className="mr-1 h-4 w-4" />Email</TabsTrigger>
            <TabsTrigger value="phone"><PhoneIcon className="mr-1 h-4 w-4" />Phone</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-6">
            <EmailForm onSignIn={signInEmail} onSignUp={signUpEmail} />
          </TabsContent>

          <TabsContent value="phone" className="mt-6">
            <PhoneForm />
          </TabsContent>

          <TabsContent value="google" className="mt-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Continue with your Google account.
              </p>
              <Button
                className="w-full"
                onClick={async () => {
                  try {
                    await signInGoogle();
                    toast.success("Signed in with Google");
                  } catch (e: any) {
                    toast.error(e?.message ?? "Google sign-in failed");
                  }
                }}
              >
                Continue with Google
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmailForm({
  onSignIn,
  onSignUp,
}: {
  onSignIn: (e: string, p: string) => Promise<void>;
  onSignUp: (e: string, p: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        await onSignIn(email, password);
        toast.success("Signed in");
      } else {
        await onSignUp(email, password);
        toast.success("Account created");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </Button>
      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </form>
  );
}

function PhoneForm() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, []);

  const ensureVerifier = () => {
    if (!verifierRef.current && recaptchaRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: "invisible" });
    }
    return verifierRef.current!;
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const verifier = ensureVerifier();
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmation(result);
      toast.success("Verification code sent");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send code");
      verifierRef.current?.clear();
      verifierRef.current = null;
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    setBusy(true);
    try {
      await confirmation.confirm(code);
      toast.success("Phone verified");
    } catch (err: any) {
      toast.error(err?.message ?? "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {!confirmation ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 555 123 4567"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Include country code, e.g. +1, +44, +234.</p>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Sending…" : "Send verification code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification code</Label>
            <Input id="code" inputMode="numeric" required value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Verifying…" : "Verify & sign in"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setConfirmation(null);
              setCode("");
            }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Use a different number
          </button>
        </form>
      )}
      <div ref={recaptchaRef} />
    </div>
  );
}
