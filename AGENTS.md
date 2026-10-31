<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
## Project rules
- Roles live only in `public.user_roles` (checked via `has_role`); never store roles on profiles — prevents privilege escalation.
- Booking status changes, price proposals/confirmations, contact-number release and provider approval go through SECURITY DEFINER RPCs (`update_booking_status`, `set_booking_amount`, `confirm_booking_amount`, `get_booking_contact`, `admin_review_provider`); clients have no UPDATE grant on bookings — keeps transitions and authorization server-enforced.
- Duplicate bookings are blocked by a partial unique index (customer, category, date) over active statuses; the form also pre-checks — DB is the source of truth.
- UI strings live in `src/lib/i18n.tsx` (original) plus `src/lib/i18n-extra.ts` (newer screens); every new key needs EN and BN.
- Brand colour scales (primary/accent/success/warning/error/neutral) are defined in `src/styles.css` @theme to keep the original Bolt design; reuse `btn-*`/`card` utilities.
- Own form primitives are in `src/components/ui/app-form.tsx` (not `form.tsx`, which is shadcn) — avoids a case-only filename clash.
- tsconfig has `exactOptionalPropertyTypes` and `noPropertyAccessFromIndexSignature` off because the imported code was written for standard strict mode.
- Returning/imported users set a new password via `/forgot-password` → `/reset-password` (Cloud Auth recovery link); old passwords never carry over between backends.
- Home page category cards, worker cards, hero stats and the home booking section read live data (`useHomeData` in `HomePage.tsx`); `src/lib/data.ts` only supplies icons/colours per slug — never show demo workers or hard-coded counts to customers.
- The home booking section never saves; it hands category/provider/date/time/note to `/booking` via search params, where the real insert happens.
- Completion requires a customer-confirmed agreed price, enforced in `update_booking_status`; commission is written once per booking from the active policy and snapshots the rate.
- Re-verification compares phones by last 10 digits (`normalize_phone`) so formatting changes never trigger it.
- When driving the dev preview in a browser, wait until React has hydrated (the server-rendered HTML accepts no input on its own) before clicking anything — otherwise a submit button performs a native GET navigation instead of running the app's handler.
- Customer site (`/`, `/customer/*`, shared `/notifications`, `/bookings/$id`) and provider portal (`/provider/*`, own `/provider/notifications`, `/provider/bookings/$id`) share page components (`NotificationsView`, `BookingDetailsView`) with a `side` prop; `src/lib/portal.ts` decides which side a page or notification belongs to — never show provider options in the customer header or vice versa.
- Each side has its own web app manifest (picked by URL in `__root.tsx`) and its own Capacitor flavour (`capacitor.config.ts`, `LOCALFIX_APP`) that loads the published site, so the Android apps stay pixel-identical to the website.
