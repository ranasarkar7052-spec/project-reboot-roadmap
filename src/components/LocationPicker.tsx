import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, Search } from "lucide-react";
import { reverseGeocode, searchAddress, type GeoAddress } from "@/lib/geo.functions";
import { useI18n } from "@/lib/i18n";

declare global { interface Window { __lfMapsReady?: () => void; google?: any } }

let loader: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    window.__lfMapsReady = () => resolve();
    const env = import.meta.env as Record<string, string | undefined>;
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"]}&loading=async&callback=__lfMapsReady&region=IN&channel=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"]}`;
    s.async = true;
    s.onerror = () => { loader = null; reject(new Error("map")); };
    document.head.appendChild(s);
  });
  return loader;
}

/**
 * "Use my current location" + map with draggable marker + address search.
 * Only fills fields when the user presses Confirm; every field stays editable afterwards.
 */
export function LocationPicker({ onConfirm }: { onConfirm: (a: GeoAddress) => void }) {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const L = (en: string, b: string) => (bn ? b : en);
  const rev = useServerFn(reverseGeocode);
  const find = useServerFn(searchAddress);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [found, setFound] = useState<GeoAddress | null>(null);
  const [q, setQ] = useState("");
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);

  async function lookup(lat: number, lng: number) {
    setBusy(true); setErr(null);
    try {
      const a = await rev({ data: { lat, lng } });
      setFound(a ?? { address_line: "", village: "", post_office: "", pin_code: "", district: "", state: "", country: "", lat, lng, formatted: "" });
    } catch { setErr(L("Couldn't look up this address. You can type it manually.", "ঠিকানা খুঁজে পাওয়া যায়নি। হাতে লিখুন।")); }
    setBusy(false);
  }

  function place(lat: number, lng: number) {
    const g = window.google;
    if (!g?.maps || !mapEl.current) return;
    const pos = { lat, lng };
    if (!map.current) {
      map.current = new g.maps.Map(mapEl.current, { center: pos, zoom: 17, clickableIcons: false, streetViewControl: false, mapTypeControl: false });
      marker.current = new g.maps.Marker({ position: pos, map: map.current, draggable: true });
      marker.current.addListener("dragend", () => { const p = marker.current.getPosition(); lookup(p.lat(), p.lng()); });
    } else { map.current.setCenter(pos); marker.current.setPosition(pos); }
  }

  useEffect(() => { if (found && open) loadMaps().then(() => place(found.lat, found.lng)).catch(() => {}); }, [found, open]);

  function useCurrent() {
    setErr(null);
    if (!navigator.geolocation) { setErr(L("Location isn't available on this device. Please type your address.", "এই ডিভাইসে লোকেশন নেই। ঠিকানা লিখুন।")); return; }
    setOpen(true); setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => lookup(p.coords.latitude, p.coords.longitude),
      () => { setBusy(false); setErr(L("Location permission was denied or unavailable. You can search or type your address.", "লোকেশন অনুমতি পাওয়া যায়নি। ঠিকানা খুঁজুন বা লিখুন।")); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function doSearch() {
    if (q.trim().length < 3) return;
    setOpen(true); setBusy(true); setErr(null);
    try { const a = await find({ data: { q } }); if (a) setFound(a); else setErr(L("No match found.", "কিছু পাওয়া যায়নি।")); }
    catch { setErr(L("Search failed. Please type your address.", "খোঁজা ব্যর্থ। ঠিকানা লিখুন।")); }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={useCurrent} disabled={busy} className={`btn-secondary px-4 py-2 text-sm ${bn ? "font-bengali" : ""}`}>
          <MapPin className="mr-1 inline h-4 w-4" />{L("Use my current location", "আমার বর্তমান লোকেশন ব্যবহার করুন")}
        </button>
        <div className="flex min-w-[200px] flex-1 gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); } }}
            placeholder={L("Search address", "ঠিকানা খুঁজুন")} className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
          <button type="button" onClick={doSearch} disabled={busy} className="btn-secondary px-3 py-2 text-sm" aria-label="Search"><Search className="h-4 w-4" /></button>
        </div>
      </div>
      {err && <p className={`text-sm text-error-600 ${bn ? "font-bengali" : ""}`}>{err}</p>}
      {open && (
        <div className="space-y-2 rounded-xl bg-neutral-50 p-3">
          <div ref={mapEl} className="h-56 w-full rounded-lg bg-neutral-100" />
          {busy && <p className="text-sm text-neutral-500">{L("Finding address…", "ঠিকানা খোঁজা হচ্ছে…")}</p>}
          {found && !busy && (
            <>
              <p className={`text-sm text-neutral-700 ${bn ? "font-bengali" : ""}`}>{found.formatted || L("Address not found — please type it.", "ঠিকানা পাওয়া যায়নি — লিখুন।")}</p>
              <p className={`text-xs text-neutral-500 ${bn ? "font-bengali" : ""}`}>{L("Drag the pin to adjust. Please check the PIN code and post office after filling — they may need correcting.", "পিন সরিয়ে ঠিক করুন। পূরণের পর পিন কোড ও পোস্ট অফিস যাচাই করুন।")}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => { onConfirm(found); setOpen(false); }} className={`btn-primary px-4 py-2 text-sm ${bn ? "font-bengali" : ""}`}>{L("Confirm location", "লোকেশন নিশ্চিত করুন")}</button>
                <button type="button" onClick={() => setOpen(false)} className={`btn-secondary px-4 py-2 text-sm ${bn ? "font-bengali" : ""}`}>{L("Cancel", "বাতিল")}</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
