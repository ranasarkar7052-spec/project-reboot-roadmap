export type Side = "customer" | "provider";

type NotificationLike = { type: string; booking_id: string | null; bookings?: { customer_id: string } | null };

/** Which app a notification belongs to: provider-account and job alerts go to the provider portal, booking updates for your own requests go to the customer site. */
export function notificationSide(n: NotificationLike, uid: string): Side {
  if (n.type.startsWith("provider_")) return "provider";
  if (n.booking_id) return n.bookings?.customer_id === uid ? "customer" : "provider";
  return "customer";
}

/** Portal from the URL: everything under /provider is the provider app. */
export function sideFromPath(path: string): Side {
  return path === "/provider" || path.startsWith("/provider/") ? "provider" : "customer";
}
