import { describe, expect, it } from "vitest";
import { canCancel, providerNextStatus, whatsappLink } from "@/lib/api";
import { normalizeIndianPhone, validateIndianPhone } from "@/lib/validation";

describe("booking status transitions", () => {
  it("provider moves accepted → on the way → in progress → completed", () => {
    expect(providerNextStatus("accepted")).toBe("on_the_way");
    expect(providerNextStatus("on_the_way")).toBe("in_progress");
    expect(providerNextStatus("in_progress")).toBe("completed");
  });
  it("finished bookings have no next step", () => {
    expect(providerNextStatus("completed")).toBeNull();
    expect(providerNextStatus("cancelled")).toBeNull();
  });
  it("only bookings before work starts can be cancelled", () => {
    expect(canCancel("requested")).toBe(true);
    expect(canCancel("on_the_way")).toBe(true);
    expect(canCancel("in_progress")).toBe(false);
    expect(canCancel("completed")).toBe(false);
  });
});

describe("Indian phone numbers", () => {
  it("accepts 10-digit mobile numbers starting 6-9", () => {
    expect(validateIndianPhone("98765 43210")).toBe(true);
    expect(validateIndianPhone("5876543210")).toBe(false);
  });
  it("normalizes to +91", () => {
    expect(normalizeIndianPhone("09876543210")).toBe("+919876543210");
    expect(normalizeIndianPhone("9876543210")).toBe("+919876543210");
  });
  it("WhatsApp link uses country code 91", () => {
    expect(whatsappLink("9876543210", "hi")).toBe("https://wa.me/919876543210?text=hi");
  });
});
