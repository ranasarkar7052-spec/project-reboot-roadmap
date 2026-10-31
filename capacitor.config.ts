import type { CapacitorConfig } from "@capacitor/cli";

// Two Android apps from one codebase. Pick one with LOCALFIX_APP=customer|provider.
// Both load the published LocalFix site, so they always match the website exactly.
const flavor = process.env.LOCALFIX_APP === "provider" ? "provider" : "customer";
const site = (process.env.LOCALFIX_URL ?? "https://REPLACE-WITH-PUBLISHED-URL").replace(/\/+$/, "");

const config: CapacitorConfig =
  flavor === "provider"
    ? {
        appId: "com.localfix.provider",
        appName: "LocalFix Provider",
        webDir: "capacitor-shell",
        android: { path: "android-provider" },
        server: { url: `${site}/provider/dashboard`, androidScheme: "https" },
      }
    : {
        appId: "com.localfix.customer",
        appName: "LocalFix",
        webDir: "capacitor-shell",
        android: { path: "android-customer" },
        server: { url: `${site}/`, androidScheme: "https" },
      };

export default config;
