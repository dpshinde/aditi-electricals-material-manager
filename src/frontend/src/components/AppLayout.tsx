import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Package,
  StickyNote,
  User,
  Warehouse,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import {
  useSyncCompanies,
  useSyncGodowns,
  useSyncMaterials,
  useSyncMovements,
  useSyncNotes,
  useSyncSites,
} from "../hooks/useQueries";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/sites", label: "Sites", icon: MapPin },
  { path: "/godowns", label: "Godowns", icon: Warehouse },
  { path: "/companies", label: "Companies", icon: Building2 },
  { path: "/materials", label: "Materials", icon: Package },
  { path: "/materials-overview", label: "Stock Overview", icon: BarChart3 },
  { path: "/movements", label: "Movements", icon: ArrowLeftRight },
  { path: "/notes", label: "Notes", icon: StickyNote },
];

function SyncOnMount() {
  useSyncSites();
  useSyncGodowns();
  useSyncCompanies();
  useSyncMaterials();
  useSyncMovements();
  useSyncNotes();
  return null;
}

function ProfileSetupModal({ onSave }: { onSave: () => void }) {
  const { actor } = useActor();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !actor) return;
    setSaving(true);
    try {
      await actor.saveCallerUserProfile({
        name: name.trim(),
        email: undefined,
      });
      toast.success("Profile saved!");
      onSave();
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Aditi Electricals</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Please enter your name to get started.
          </p>
          <div className="space-y-2">
            <Label htmlFor="profile-name">Your Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Saving..." : "Get Started"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const currentPath = router.state.location.pathname;

  const NavLink = ({ item }: { item: (typeof navItems)[0] }) => {
    const isActive = currentPath === item.path;
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        <Icon size={18} />
        {item.label}
      </Link>
    );
  };

  const appId =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.hostname)
      : "aditi-electricals";

  const AppLogo = ({ size = 40 }: { size?: number }) => (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm"
    >
      <Zap size={size * 0.55} className="text-white" strokeWidth={2.5} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {showProfileSetup && (
        <ProfileSetupModal
          onSave={() =>
            queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] })
          }
        />
      )}

      {isAuthenticated && <SyncOnMount />}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <AppLogo size={40} />
          <div>
            <h1 className="font-bold text-sidebar-foreground text-sm leading-tight">
              Aditi Electricals
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              Material Manager
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
          {isAuthenticated && userProfile && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent">
              <User size={16} className="text-sidebar-foreground/60" />
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {userProfile.name}
              </span>
            </div>
          )}
          <Button
            variant={isAuthenticated ? "outline" : "default"}
            size="sm"
            className="w-full"
            onClick={handleAuth}
            disabled={isLoggingIn || isInitializing}
          >
            {isLoggingIn || isInitializing ? (
              "Loading..."
            ) : isAuthenticated ? (
              <>
                <LogOut size={14} className="mr-2" />
                Logout
              </>
            ) : (
              <>
                <LogIn size={14} className="mr-2" />
                Login
              </>
            )}
          </Button>
          <div className="text-center text-xs text-sidebar-foreground/40 pb-1">
            Built with{" "}
            <Heart size={10} className="inline text-green-400 fill-green-400" />{" "}
            using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-sidebar-foreground/70"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <AppLogo size={32} />
          <span className="font-bold text-sidebar-foreground text-sm">
            Aditi Electricals
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMobileOpen(false);
            }}
            // biome-ignore lint/a11y/useSemanticElements: backdrop overlay div
            role="presentation"
          />
          <aside className="relative w-72 bg-sidebar flex flex-col h-full shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <AppLogo size={32} />
                <span className="font-bold text-sidebar-foreground">
                  Aditi Electricals
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
              {isAuthenticated && userProfile && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent">
                  <User size={16} className="text-sidebar-foreground/60" />
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                    {userProfile.name}
                  </span>
                </div>
              )}
              <Button
                variant={isAuthenticated ? "outline" : "default"}
                size="sm"
                className="w-full"
                onClick={handleAuth}
                disabled={isLoggingIn || isInitializing}
              >
                {isLoggingIn || isInitializing ? (
                  "Loading..."
                ) : isAuthenticated ? (
                  <>
                    <LogOut size={14} className="mr-2" />
                    Logout
                  </>
                ) : (
                  <>
                    <LogIn size={14} className="mr-2" />
                    Login
                  </>
                )}
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        {!isAuthenticated && !isInitializing ? (
          <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
            <AppLogo size={80} />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Aditi Electricals
              </h2>
              <p className="text-muted-foreground mb-6">
                Material Manager — Please login to continue
              </p>
              <Button onClick={handleAuth} disabled={isLoggingIn} size="lg">
                {isLoggingIn ? "Logging in..." : "Login to Continue"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 lg:p-6">{children}</div>
        )}
      </main>
    </div>
  );
}
