import { createFileRoute } from "@tanstack/react-router";
import { ChatsView } from "@/components/ChatsView";

export const Route = createFileRoute("/_authenticated/chats")({
  head: () => ({
    meta: [
      { title: "Chats — LocalFix" },
      { name: "description", content: "Your LocalFix conversations and customer care." },
      { property: "og:title", content: "Chats — LocalFix" },
      { property: "og:description", content: "Your LocalFix conversations and customer care." },
    ],
  }),
  component: ChatsView,
});
