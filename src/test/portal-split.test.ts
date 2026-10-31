import { describe, it, expect } from "vitest";
import { notificationSide, sideFromPath } from "@/lib/portal";

const me = "u1";
describe("customer/provider split", () => {
  it("booking updates on my own request show on the customer side", () => {
    expect(notificationSide({ type: "booking_accepted", booking_id: "b", bookings: { customer_id: me } }, me)).toBe("customer");
  });
  it("job alerts for bookings I don't own show on the provider side", () => {
    expect(notificationSide({ type: "booking_requested", booking_id: "b", bookings: { customer_id: "other" } }, me)).toBe("provider");
  });
  it("provider approval alerts show on the provider side", () => {
    expect(notificationSide({ type: "provider_approved", booking_id: null }, me)).toBe("provider");
  });
  it("/provider pages belong to the provider app, everything else to the customer app", () => {
    expect(sideFromPath("/provider/dashboard")).toBe("provider");
    expect(sideFromPath("/provider-register")).toBe("customer");
    expect(sideFromPath("/customer/bookings")).toBe("customer");
  });
});
