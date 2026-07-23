import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { z } from "zod";
import { RequireRole } from "@/lib/RequireRole";
import {
  useConversations,
  useLandlords,
  useListings,
  useMessages,
  sendMessage,
} from "@/lib/firestoreData";
import type { Conversation } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  // Set by the "Message Landlord" flow on a listing page, so it can land
  // directly on the conversation it just created/found.
  conversation: z.string().optional(),
});

export const Route = createFileRoute("/messages")({
  component: MessagesPage,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Messages — RentEase" }] }),
});

function MessagesPage() {
  return (
    <RequireRole roles={["student", "landlord"]}>
      {({ uid }) => <MessagesInner uid={uid} />}
    </RequireRole>
  );
}

function MessagesInner({ uid }: { uid: string }) {
  const { conversation: preselect } = Route.useSearch();
  const convos = useConversations(uid);
  const landlordsList = useLandlords();
  const listingsList = useListings();
  const [activeId, setActiveId] = useState("");
  const effectiveActiveId = activeId || preselect || convos[0]?.id || "";
  const active = convos.find((c) => c.id === effectiveActiveId);
  const messages = useMessages(effectiveActiveId || undefined);
  const [draft, setDraft] = useState("");

  const send = async () => {
    if (!draft.trim() || !active) return;
    const text = draft;
    setDraft("");
    try {
      await sendMessage(active.id, { from: uid, text });
    } catch (err) {
      console.error(err);
    }
  };

  // The other side of the conversation, from this user's point of view.
  // There's no student profile directory yet, so a landlord viewing a
  // conversation with a student only sees a generic label — landlords do
  // have real profiles (see role.tsx), so students always see a name.
  const otherParty = (c: Conversation) => {
    const otherId = c.participants?.find((p) => p !== uid) ?? c.landlordId;
    return landlordsList.find((l) => l.id === otherId);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Messages</h1>
      <div className="grid h-[70vh] overflow-hidden rounded-2xl border bg-card md:grid-cols-[320px_1fr]">
        <aside className="overflow-y-auto border-r">
          {convos.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No conversations yet.</div>
          )}
          {convos.map((c) => {
            const other = otherParty(c);
            const li = listingsList.find((x) => x.id === c.listingId);
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-start gap-3 border-b p-4 text-left transition hover:bg-muted ${effectiveActiveId === c.id ? "bg-muted" : ""}`}
              >
                <Avatar>
                  <AvatarImage src={other?.avatar} />
                  <AvatarFallback>{(other?.name ?? "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium">{other?.name ?? "Conversation"}</span>
                    {c.unread > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        {c.unread}
                      </span>
                    )}
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
                <div className="font-medium">{otherParty(active)?.name ?? "Conversation"}</div>
                <div className="text-xs text-muted-foreground">
                  {listingsList.find((l) => l.id === active.listingId)?.title}
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => {
                  // "me" only ever appears in dev seed/demo data.
                  const mine = m.from === uid || m.from === "me";
                  const time =
                    m.time ??
                    (m.createdAtMs
                      ? new Date(m.createdAtMs).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "");
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        {m.text}
                        <div
                          className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                        >
                          {time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2 border-t p-3"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" size="icon" className="rounded-full">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-muted-foreground">
              Select a conversation
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
