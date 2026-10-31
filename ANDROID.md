# LocalFix Android apps

Two apps are built from this one project. Both open the published LocalFix site, so they look exactly like the website.

| App | Opens | Package |
| --- | --- | --- |
| LocalFix (customers) | `/` | `com.localfix.customer` |
| LocalFix Provider | `/provider/dashboard` | `com.localfix.provider` |

## Build (on a computer with Android Studio)

1. Publish the app in Lovable and note its URL (or custom domain).
2. Download the code (GitHub export) and run `bun install`.
3. Customer app:
   ```
   LOCALFIX_APP=customer LOCALFIX_URL=https://your-site npx cap add android
   LOCALFIX_APP=customer LOCALFIX_URL=https://your-site npx cap sync android
   LOCALFIX_APP=customer npx cap open android
   ```
4. Provider app: same commands with `LOCALFIX_APP=provider`.
5. In Android Studio: set icons (use `public/icons/icon-512.png`), then **Build → Generate Signed Bundle** and upload to Google Play.

No Play Store needed for quick use: open the site in Chrome on Android → menu → **Install app**. Open `/provider/login` first to install the provider app instead.
