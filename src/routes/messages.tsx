import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { landlords, listings } from "@/lib/mockData";
import { useConversations, useMessages, sendMessage } from "@/lib/firestoreData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/messages")({
  component: MessagesPage,
  head: () => ({ meta: [{ title: "Messages — RentEase" }] }),
});

function MessagesPage() {
  const convos = useConversations();
  const [activeId, setActiveId] = useState("");
  const effectiveActiveId = activeId || convos[0]?.id || "";
  const active = convos.find((c) => c.id === effectiveActiveId);
  const messages = useMessages(effectiveActiveId || undefined);
  const [draft, setDraft] = useState("");

  const send = async () => {
    if (!draft.trim() || !active) return;
    const text = draft;
    setDraft("");
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    try {
      await sendMessage(active.id, { from: "me", text, time: now }, messages.length);
      setTimeout(() => {
        sendMessage(
          active.id,
          { from: "them", text: "Thanks for your message — I'll get back to you shortly!", time: "now" },
          messages.length + 1,
        ).catch(() => {});
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Messages</h1>
      <div className="grid h-[70vh] overflow-hidden rounded-2xl border bg-card md:grid-cols-[320px_1fr]">
        <aside className="overflow-y-auto border-r">
          {convos.map((c) => {
            const l = landlords.find((x) => x.id === c.landlordId)!;
            const li = listings.find((x) => x.id === c.listingId);
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-start gap-3 border-b p-4 text-left transition hover:bg-muted ${effectiveActiveId === c.id ? "bg-muted" : ""}`}
              >
                <Avatar><AvatarImage src={l.avatar} /><AvatarFallback>{l.name[0]}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium">{l.name}</span>
                    {c.unread > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{c.unread}</span>}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{li?.title}</div>
                  <div className="truncate text-sm text-muted-foreground">{c.lastPreview}</div>
                </div>
              </button>
            );
          })}
        </aside>
        <section className="flex flex-col">
          {active ? (
            <>
              <div className="border-b p-4">
                <div className="font-medium">{landlords.find((l) => l.id === active.landlordId)?.name}</div>
                <div className="text-xs text-muted-foreground">{listings.find((l) => l.id === active.listingId)?.title}</div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.from === "me" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {m.text}
                      <div className={`mt-1 text-[10px] ${m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.time}</div>
                    </div>
                  </div>
                ))}

              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-center gap-2 border-t p-3"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" size="icon" className="rounded-full"><Send className="h-4 w-4" /></Button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-muted-foreground">Select a conversation</div>
          )}
        </section>
      </div>
    </div>
  );
}
