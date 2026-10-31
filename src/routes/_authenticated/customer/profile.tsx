import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Mail, Phone, MapPin, CalendarCheck, Bell, Info, ChevronRight, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { PageContainer, PageHeader } from "@/components/ui/app-form";
import { ProfileDetailsForm } from "@/components/ProfileDetailsForm";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/customer/profile")({
  head: () => ({
    meta: [
      { title: "My profile — LocalFix" },
      { name: "description", content: "View and update your LocalFix name, phone and address." },
      { property: "og:title", content: "My profile — LocalFix" },
      { property: "og:description", content: "View and update your LocalFix name, phone and address." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomerProfilePage,
});

function CustomerProfilePage() {
  const { lang, t } = useI18n();
  const { hasRole, profile, session, signOut } = useAuth();
  const navigate = useNavigate();
  const bn = lang === "bn" ? "font-bengali" : "";
  const uid = session?.user.id;
  const bookingsCount = useQuery({
    queryKey: ["my-bookings-count", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { count } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("customer_id", uid!);
      return count ?? 0;
    },
  });
  const name = profile?.full_name || session?.user.email || "";
  const place = [profile?.village, profile?.district].filter(Boolean).join(", ");
  const menu = [
    { to: "/customer/bookings" as const, icon: CalendarCheck, title: t("profile.myBookings"), sub: t("profile.myBookingsSub"), cls: "bg-success-50 text-success-600" },
    { to: "/notifications" as const, icon: Bell, title: t("profile.notifications"), sub: t("profile.notificationsSub"), cls: "bg-error-50 text-error-500" },
    { to: "/" as const, icon: Info, title: t("profile.about"), sub: t("brand.tagline"), cls: "bg-primary-50 text-primary-600" },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title={lang === "bn" ? "আমার প্রোফাইল" : "My profile"} backTo="/" />

        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-2xl font-extrabold text-primary-700">
            {name.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={`truncate text-lg font-bold text-neutral-900 ${bn}`}>{name}</h2>
            {profile?.phone && (
              <span className={`mt-1 inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700 ${bn}`}>
                <BadgeCheck className="h-3.5 w-3.5" /> {t("home.verified")}
              </span>
            )}
            <ul className="mt-2 space-y-1 text-xs text-neutral-600">
              {session?.user.email && <li className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" />{session.user.email}</li>}
              {profile?.phone && <li className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" />{profile.phone}</li>}
              {place && <li className={`flex items-center gap-1.5 truncate ${bn}`}><MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />{place}</li>}
            </ul>
          </div>
        </div>

        <div className="card mt-3 grid grid-cols-1 divide-x divide-neutral-100 py-3 text-center">
          <div>
            <p className="text-xl font-bold text-neutral-900">{bookingsCount.data ?? "–"}</p>
            <p className={`text-xs text-neutral-500 ${bn}`}>{t("profile.myBookings")}</p>
          </div>
        </div>

        <div className="card mt-4 divide-y divide-neutral-100">
          {menu.map((m) => (
            <Link key={m.title} to={m.to} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${m.cls}`}><m.icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold text-neutral-900 ${bn}`}>{m.title}</span>
                <span className={`block truncate text-xs text-neutral-500 ${bn}`}>{m.sub}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
            </Link>
          ))}
        </div>

        <h3 className={`mb-2 mt-6 text-sm font-semibold text-neutral-700 ${bn}`}>{t("profile.details")}</h3>
        <ProfileDetailsForm isProvider={hasRole("provider")} />

        <button
          onClick={async () => { await signOut(); navigate({ to: "/", replace: true }); }}
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-error-200 bg-error-50 py-3 text-sm font-semibold text-error-600 transition-colors hover:bg-error-100 ${bn}`}
        >
          <LogOut className="h-4 w-4" /> {t("nav.logout")}
        </button>
      </PageContainer>
    </AppLayout>
  );
}
