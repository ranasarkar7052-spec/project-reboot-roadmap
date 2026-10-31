import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui/app-form";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Notification } from "@/lib/db-types";

import { notificationSide, type Side } from "@/lib/portal";

/** Notifications list shared by the customer site and the provider portal; each side only sees its own. */
export function NotificationsView({ side }: { side: Side }) {
  const { t, lang } = useI18n();
  const bn = lang === "bn" ? "font-bengali" : "";
  const { session } = useAuth();
  const qc = useQueryClient();
  const uid = session?.user.id;

  const q = useQuery({
    queryKey: ["notifications", uid, side],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, bookings(customer_id)")
        .eq("user_id", uid!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as (Notification & { bookings: { customer_id: string } | null })[]).filter((n) => notificationSide(n, uid!) === side);
    },
  });

  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`notif-page-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, () =>
        qc.invalidateQueries({ queryKey: ["notifications", uid] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, qc]);

  async function markRead(id?: string) {
    let query = supabase.from("notifications").update({ is_read: true }).eq("user_id", uid!).eq("is_read", false);
    query = id ? query.eq("id", id) : query.in("id", (q.data ?? []).map((n) => n.id));
    await query;
    qc.invalidateQueries({ queryKey: ["notifications", uid] });
    window.dispatchEvent(new Event("notifications-changed"));
  }

  const unread = q.data?.filter((n) => !n.is_read).length ?? 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-end justify-between gap-3">
          <PageHeader title={t("notifications.title")} subtitle={unread ? `${unread} ${t("notifications.unread")}` : undefined} />
          {unread > 0 && (
            <button onClick={() => markRead()} className={`btn-ghost mb-6 ${bn}`}>
              <CheckCheck className="h-4 w-4" /> {t("notifications.markAllRead")}
            </button>
          )}
        </div>
        {q.isLoading && <LoadingState message={t("misc.loading")} />}
        {q.isError && <ErrorState title={t("state.error")} description={t("state.errorDesc")} onRetry={() => q.refetch()} />}
        {q.data?.length === 0 && <EmptyState title={t("notifications.empty")} description={t("notifications.emptyDesc")} />}
        <ul className="space-y-3">
          {q.data?.map((n) => {
            const cls = `card flex w-full cursor-pointer items-start gap-3 p-4 text-left transition hover:bg-neutral-50 hover:shadow-md ${n.is_read ? "opacity-70" : "ring-1 ring-primary-200"}`;
            // Mark as read in the background; never blocks the navigation.
            const onOpen = () => { if (!n.is_read) void markRead(n.id); };
            const body = (
              <>
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.is_read ? "bg-neutral-100 text-neutral-400" : "bg-primary-100 text-primary-700"}`}>
                  <Bell className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold text-neutral-900 ${bn}`}>{t(`notif.${n.type}`) === `notif.${n.type}` ? n.title : t(`notif.${n.type}`)}</span>
                  {n.message && <span className="mt-0.5 block text-sm text-neutral-600">{n.message}</span>}
                  <span className="mt-1 block text-xs text-neutral-400">
                    {new Date(n.created_at).toLocaleString(lang === "bn" ? "bn-IN" : "en-IN")}
                  </span>
                </span>
                {!n.is_read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500" />}
              </>
            );
            return (
              <li key={n.id}>
                {n.booking_id ? (
                  side === "provider" ? (
                    <Link to="/provider/bookings/$bookingId" params={{ bookingId: n.booking_id }} onClick={onOpen} className={cls}>{body}</Link>
                  ) : (
                    <Link to="/bookings/$bookingId" params={{ bookingId: n.booking_id }} onClick={onOpen} className={cls}>{body}</Link>
                  )
                ) : n.type.startsWith("provider_") ? (
                  <Link to="/provider/profile" onClick={onOpen} className={cls}>{body}</Link>
                ) : (
                  <button type="button" onClick={onOpen} className={cls}>{body}</button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </AppLayout>
  );
}
