import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Wrench, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { LanguageToggle } from "./LanguageToggle";

export type Portal = "provider" | "admin";

type NavItem = { to: string; en: string; bn: string };

/** Shared with the provider home page so both lists stay in step. */
export const PORTAL_NAV: Record<Portal, NavItem[]> = {
  provider: [
    { to: "/provider/dashboard", en: "Jobs", bn: "কাজ" },
    { to: "/provider/earnings", en: "Earnings", bn: "আয়" },
    { to: "/provider/profile", en: "Profile & services", bn: "প্রোফাইল ও পরিষেবা" },
    { to: "/provider/notifications", en: "Notifications", bn: "বিজ্ঞপ্তি" },
  ],
  admin: [
    { to: "/admin/dashboard", en: "Dashboard", bn: "ড্যাশবোর্ড" },
  ],
};

/** Separate shell for the provider and admin portals (own header + nav). */
export function PortalLayout({ portal, children }: { portal: Portal; children: ReactNode }) {
  const { lang } = useI18n();
  const { session, signOut } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const bn = lang === "bn" ? "font-bengali" : "";
  const isAdmin = portal === "admin";
  const title = isAdmin ? (lang === "bn" ? "অ্যাডমিন" : "Admin") : (lang === "bn" ? "প্রদানকারী" : "Provider");

  async function out() {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    navigate({ to: isAdmin ? "/admin/login" : "/provider/login", replace: true });
  }

  const links = PORTAL_NAV[portal].map((n) => (
    <Link
      key={n.to}
      to={n.to as "/"}
      onClick={() => setOpen(false)}
      activeProps={{ className: isAdmin ? "bg-white/15 text-white" : "bg-primary-50 text-primary-700" }}
      className={`block rounded-lg px-3 py-2.5 text-sm font-medium lg:inline-block ${isAdmin ? "text-neutral-200 hover:bg-white/10" : "text-neutral-600 hover:bg-neutral-100"} ${bn}`}
    >
      {lang === "bn" ? n.bn : n.en}
    </Link>
  ));

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className={`sticky top-0 z-50 border-b ${isAdmin ? "border-neutral-800 bg-neutral-900" : "border-primary-100 bg-white"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to={isAdmin ? "/admin/dashboard" : "/provider/dashboard"} className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${isAdmin ? "bg-accent-500" : "bg-primary-600"}`}>
              {isAdmin ? <ShieldCheck className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
            </div>
            <div className="leading-none">
              <span className={`text-lg font-bold ${isAdmin ? "text-white" : "text-neutral-900"}`}>LocalFix</span>
              <span className={`block text-[11px] font-semibold uppercase tracking-wide ${isAdmin ? "text-accent-300" : "text-primary-600"} ${bn}`}>{title}</span>
            </div>
          </Link>
          {session && <nav className="hidden items-center gap-1 lg:flex">{links}</nav>}
          <div className="flex items-center gap-2">
            <LanguageToggle />
            {session && (
              <button onClick={out} className={`hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium lg:inline-flex ${isAdmin ? "text-neutral-200 hover:bg-white/10" : "text-neutral-600 hover:bg-neutral-100"} ${bn}`}>
                <LogOut className="h-4 w-4" /> {lang === "bn" ? "লগআউট" : "Log out"}
              </button>
            )}
            {session && (
              <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className={`rounded-lg p-2 lg:hidden ${isAdmin ? "text-white" : "text-neutral-700"}`}>
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
        {open && session && (
          <nav className="mx-auto max-w-6xl px-4 pb-3 lg:hidden">
            {links}
            <button onClick={out} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${isAdmin ? "text-neutral-200" : "text-neutral-600"} ${bn}`}>
              {lang === "bn" ? "লগআউট" : "Log out"}
            </button>
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-400">
        LocalFix {title}
        {isAdmin && <> · <Link to="/" className="underline">{lang === "bn" ? "গ্রাহক সাইট" : "Customer site"}</Link></>}
      </footer>
    </div>
  );
}
