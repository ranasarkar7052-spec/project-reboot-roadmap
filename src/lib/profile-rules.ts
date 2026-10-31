/** Validation for the customer/provider profile form. Returns field -> true when invalid. */
export function validateProfileInput(v: { full_name: string; phone: string; pin_code: string }) {
  return {
    full_name: v.full_name.trim().length < 2,
    phone: v.phone.trim() !== "" && v.phone.replace(/\D/g, "").replace(/^91/, "").length !== 10,
    pin_code: v.pin_code.trim() !== "" && !/^[1-9]\d{5}$/.test(v.pin_code.trim()),
  };
}
