import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  addDoc,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  listings as seedListings,
  landlords as seedLandlords,
  reviews as seedReviews,
  conversations as seedConversations,
  tenants as seedTenants,
  paymentLog as seedPayments,
  reportedListings as seedReports,
  type Listing,
  type Landlord,
  type Review,
  type Conversation,
  type Message,
} from "@/lib/mockData";

const isBrowser = typeof window !== "undefined";

// ---------- Seeding ----------
let seedPromise: Promise<void> | null = null;

export async function seedFirestoreIfEmpty(): Promise<void> {
  if (!isBrowser) return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      const listingsSnap = await getDocs(query(collection(db, "listings")));
      if (!listingsSnap.empty) return;

      const batch = writeBatch(db);
      seedLandlords.forEach((l) => batch.set(doc(db, "landlords", l.id), l));
      seedListings.forEach((l) => batch.set(doc(db, "listings", l.id), l));
      seedReviews.forEach((r) => batch.set(doc(db, "reviews", r.id), r));
      seedTenants.forEach((t) => batch.set(doc(db, "tenants", t.id), t));
      seedPayments.forEach((p) => batch.set(doc(db, "payments", p.id), p));
      seedReports.forEach((r) => batch.set(doc(db, "reports", r.id), r));
      await batch.commit();

      // Conversations with nested messages subcollection
      for (const c of seedConversations) {
        const { messages, ...rest } = c;
        await setDoc(doc(db, "conversations", c.id), rest);
        const mBatch = writeBatch(db);
        messages.forEach((m, i) => {
          mBatch.set(doc(db, "conversations", c.id, "messages", m.id), {
            ...m,
            order: i,
          });
        });
        await mBatch.commit();
      }
    } catch (err) {
      console.error("Firestore seed failed", err);
    }
  })();

  return seedPromise;
}

// ---------- Generic subscribe hook ----------
function useCollection<T>(
  path: string,
  fallback: T[],
  constraints: QueryConstraint[] = [],
  deps: unknown[] = [],
): T[] {
  const [data, setData] = useState<T[]>(fallback);

  useEffect(() => {
    if (!isBrowser) return;
    const q = query(collection(db, path), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T);
        setData(rows);
      },
      (err) => console.error(`onSnapshot ${path}`, err),
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}

// ---------- Hooks ----------
export function useListings(): Listing[] {
  return useCollection<Listing>("listings", seedListings);
}

export function useListing(id: string | undefined): Listing | undefined {
  const all = useListings();
  return all.find((l) => l.id === id);
}

export function useListingsByLandlord(landlordId: string): Listing[] {
  const seed = seedListings.filter((l) => l.landlordId === landlordId);
  return useCollection<Listing>("listings", seed, [where("landlordId", "==", landlordId)], [landlordId]);
}

export function useLandlords(): Landlord[] {
  return useCollection<Landlord>("landlords", seedLandlords);
}

export function useLandlord(id: string | undefined): Landlord | undefined {
  return useLandlords().find((l) => l.id === id);
}

export function useReviews(): Review[] {
  return useCollection<Review>("reviews", seedReviews);
}

export function useConversations(): Conversation[] {
  // Read conversation docs (without messages) then merge messages via useMessages per active
  const rows = useCollection<Omit<Conversation, "messages">>("conversations", seedConversations);
  return rows.map((r) => ({
    ...(r as Conversation),
    messages: (r as any).messages ?? [],
  }));
}

export function useMessages(conversationId: string | undefined): Message[] {
  const [msgs, setMsgs] = useState<Message[]>([]);
  useEffect(() => {
    if (!isBrowser || !conversationId) return;
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("order", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setMsgs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Message)),
      (err) => console.error("messages snapshot", err),
    );
    return () => unsub();
  }, [conversationId]);
  return msgs;
}

export function useTenants() {
  return useCollection<{ id: string; name: string; listing: string; moveIn: string; rent: number; status: string }>(
    "tenants",
    seedTenants,
  );
}

export function usePayments() {
  return useCollection<{ id: string; tenant: string; month: string; amount: number; status: string; date: string }>(
    "payments",
    seedPayments,
  );
}

export function useReports() {
  return useCollection<{ id: string; listing: string; reason: string; reporter: string; date: string }>(
    "reports",
    seedReports,
  );
}

// ---------- Mutations ----------
export async function createListing(l: Listing): Promise<void> {
  await setDoc(doc(db, "listings", l.id), l);
}

export async function updateListingStatus(id: string, status: Listing["status"]): Promise<void> {
  await updateDoc(doc(db, "listings", id), { status });
}

export async function sendMessage(
  conversationId: string,
  msg: Omit<Message, "id">,
  order: number,
): Promise<void> {
  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    ...msg,
    order,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "conversations", conversationId), {
    lastPreview: msg.text,
  });
}
