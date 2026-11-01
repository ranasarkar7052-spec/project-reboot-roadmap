import { createFileRoute } from "@tanstack/react-router";
import { SupportChatView } from "@/components/SupportChatView";

export const Route = createFileRoute("/_authenticated/chats_/support")({
  head: () => ({
    meta: [
      { title: "Customer Care — LocalFix" },
      { name: "description", content: "Chat with LocalFix customer care." },
      { property: "og:title", content: "Customer Care — LocalFix" },
      { property: "og:description", content: "Chat with LocalFix customer care." },
    ],
  }),
  component: SupportChatView,
});
