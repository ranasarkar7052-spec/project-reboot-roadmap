import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GeoAddress = {
  address_line: string; village: string; post_office: string; pin_code: string;
  district: string; state: string; country: string; lat: number; lng: number; formatted: string;
};

type Comp = { long_name: string; types: string[] };

/** Map Google components to Indian address fields. Missing parts stay empty — never guessed. */
function parse(r: { address_components: Comp[]; formatted_address: string; geometry: { location: { lat: number; lng: number } } }): GeoAddress {
  const get = (...types: string[]) => {
    for (const t of types) { const c = r.address_components.find((x) => x.types.includes(t)); if (c) return c.long_name; }
    return "";
  };
  const street = [get("premise", "street_number"), get("route")].filter(Boolean).join(", ");
  return {
    address_line: street,
    village: get("sublocality_level_2", "sublocality_level_1", "sublocality", "neighborhood", "locality"),
    post_office: get("postal_town"),
    pin_code: get("postal_code"),
    district: get("administrative_area_level_3", "administrative_area_level_2"),
    state: get("administrative_area_level_1"),
    country: get("country"),
    lat: r.geometry.location.lat, lng: r.geometry.location.lng,
    formatted: r.formatted_address,
  };
}

async function geocode(params: string): Promise<GeoAddress | null> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !mapsKey) throw new Error("Google Maps is not connected");
  const res = await fetch(`https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?${params}&region=in&language=en`, {
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": mapsKey },
  });
  if (!res.ok) { const b = await res.text(); console.error(`Geocode failed [${res.status}]: ${b}`); throw new Error(`Address lookup failed (${res.status})`); }
  const json = (await res.json()) as { status: string; results: Parameters<typeof parse>[0][] };
  if (json.status === "ZERO_RESULTS" || !json.results?.length) return null;
  if (json.status !== "OK") throw new Error(`Address lookup failed (${json.status})`);
  return parse(json.results[0]!);
}

export const reverseGeocode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lat: number; lng: number }) => {
    if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng) || Math.abs(d.lat) > 90 || Math.abs(d.lng) > 180) throw new Error("Invalid coordinates");
    return d;
  })
  .handler(async ({ data }) => geocode(`latlng=${data.lat},${data.lng}`));

export const searchAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q: string }) => {
    const q = String(d.q ?? "").trim().slice(0, 200);
    if (q.length < 3) throw new Error("Enter at least 3 characters");
    return { q };
  })
  .handler(async ({ data }) => geocode(`address=${encodeURIComponent(data.q)}&components=country:IN`));
