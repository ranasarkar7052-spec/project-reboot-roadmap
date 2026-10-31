import { createFileRoute, Link } from "@tanstack/react-router";
import { BookingDetailsView } from "@/components/BookingDetailsView";

export const Route = createFileRoute("/_authenticated/bookings/$bookingId")({
  head: () => ({
    meta: [
      { title: "Booking details — LocalFix" },
      { name: "description", content: "Details and status of one LocalFix booking." },
      { property: "og:title", content: "Booking details — LocalFix" },
      { property: "og:description", content: "Details and status of one LocalFix booking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomerBookingDetails,
});

function CustomerBookingDetails() {
  const { bookingId } = Route.useParams();
  return <BookingDetailsView bookingId={bookingId} side="customer" />;
}
