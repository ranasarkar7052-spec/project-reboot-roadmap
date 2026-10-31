import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/HomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LocalFix — Book trusted local repair workers" },
      { name: "description", content: "Find verified electricians, plumbers, pump and appliance repair workers in your village. English and বাংলা." },
      { property: "og:title", content: "LocalFix — Book trusted local repair workers" },
      { property: "og:description", content: "Find verified electricians, plumbers, pump and appliance repair workers in your village." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});
