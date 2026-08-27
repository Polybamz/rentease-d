import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { RoleProvider } from "@/lib/role";
import { AuthProvider } from "@/lib/auth";
import { AdminAuthProvider } from "@/lib/adminAuth";
import { firebaseConfigError } from "@/lib/firebase";
import { Nav } from "@/components/rentease/Nav";
import { Toaster } from "@/components/ui/sonner";



import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RentEase — Verified student housing near your campus" },
      { name: "description", content: "Find and manage verified off-campus student housing. Search listings, message landlords, and handle tenancies in one place." },
      { property: "og:title", content: "RentEase — Verified student housing near your campus" },
      { property: "og:description", content: "Find and manage verified off-campus student housing. Search listings, message landlords, and handle tenancies in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "RentEase — Verified student housing near your campus" },
      { name: "twitter:description", content: "Find and manage verified off-campus student housing. Search listings, message landlords, and handle tenancies in one place." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://rsms.me" },
      { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

    



  if (firebaseConfigError) {
    return <FirebaseConfigWarning message={firebaseConfigError} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
      <AuthProvider>
        <RoleProvider>
          <div className="flex min-h-screen flex-col">
            <Nav />
            <main className="flex-1">
              <Outlet />
            </main>
          </div>
          <Toaster />
        </RoleProvider>
      </AuthProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

function FirebaseConfigWarning({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg rounded-2xl border border-destructive/30 bg-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">Firebase Auth is not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Listing data is served from a local SQLite database. Firebase Authentication
          is required for sign-in, messaging landlords, and role assignment.
        </p>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Open <span className="font-mono">.env</span> at the project root.</li>
          <li>
            Set <span className="font-mono">VITE_FIREBASE_API_KEY</span> to your Firebase Web API key
            (Firebase Console → Project settings → Your apps → Web app → <span className="font-mono">apiKey</span>).
          </li>
          <li>Restart the dev server so Vite picks up the new value.</li>
        </ol>
      </div>
    </div>
  );
}

