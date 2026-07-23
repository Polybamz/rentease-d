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
  // Only auto-seed in local dev. In production this requires an open-write
  // Firestore ruleset, which we don't ship (see firestore.rules) — seed a
  // real project with `firebase emulators` or a trusted backend script instead.
  if (!import.meta.env.DEV) return;
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
            createdAtMs: m.createdAtMs ?? i,
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

// ---------- Generic subscribe hooks ----------
function useCollection<T>(
  path: string,
  fallback: T[],
  constraints: QueryConstraint[] = [],
  deps: unknown[] = [],
  enabled = true,
): T[] {
  const [data, setData] = useState<T[]>(fallback);

  useEffect(() => {
    if (!isBrowser || !enabled) {
      setData(fallback);
      return;
    }
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
  }, [...deps, enabled]);

  return data;
}

/** Subscribes to a single document directly, instead of filtering a whole collection client-side. */
function useDoc<T>(path: string, id: string | undefined, fallback: T | undefined): T | undefined {
  const [data, setData] = useState<T | undefined>(fallback);

  useEffect(() => {
    if (!isBrowser || !id) {
      setData(fallback);
      return;
    }
    const unsub = onSnapshot(
      doc(db, path, id),
      (snap) =>
        setData(snap.exists() ? ({ id: snap.id, ...(snap.data() as object) } as T) : undefined),
      (err) => console.error(`onSnapshot ${path}/${id}`, err),
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, id]);

  return data;
}

// ---------- Hooks ----------
export function useListings(): Listing[] {
  return useCollection<Listing>("listings", seedListings);
}

export function useListing(id: string | undefined): Listing | undefined {
  const seed = seedListings.find((l) => l.id === id);
  return useDoc<Listing>("listings", id, seed);
}

export function useListingsByLandlord(landlordId: string): Listing[] {
  const seed = seedListings.filter((l) => l.landlordId === landlordId);
  return useCollection<Listing>(
    "listings",
    seed,
    [where("landlordId", "==", landlordId)],
    [landlordId],
  );
}

export function useLandlords(): Landlord[] {
  return useCollection<Landlord>("landlords", seedLandlords);
}

export function useLandlord(id: string | undefined): Landlord | undefined {
  const seed = seedLandlords.find((l) => l.id === id);
  return useDoc<Landlord>("landlords", id, seed);
}

export function useReviews(): Review[] {
  return useCollection<Review>("reviews", seedReviews);
}

/**
 * Conversations the given uid actually participates in. Pass the signed-in
 * user's uid — with no uid, returns nothing (rather than every conversation
 * in the database, which the security rules would reject anyway).
 */
export function useConversations(uid: string | undefined): Conversation[] {
  const rows = useCollection<Omit<Conversation, "messages">>(
    "conversations",
    [],
    uid ? [where("participants", "array-contains", uid)] : [],
    [uid],
    !!uid,
  );
  return rows.map((r) => ({ ...(r as Conversation), messages: [] }));
}

export function useMessages(conversationId: string | undefined): Message[] {
  const [msgs, setMsgs] = useState<Message[]>([]);
  useEffect(() => {
    if (!isBrowser || !conversationId) {
      setMsgs([]);
      return;
    }
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAtMs", "asc"),
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
  return useCollection<{
    id: string;
    name: string;
    listing: string;
    moveIn: string;
    rent: number;
    status: string;
  }>("tenants", seedTenants);
}

export function usePayments() {
  return useCollection<{
    id: string;
    tenant: string;
    month: string;
    amount: number;
    status: string;
    date: string;
  }>("payments", seedPayments);
}

export function useReports() {
  return useCollection<{
    id: string;
    listing: string;
    reason: string;
    reporter: string;
    date: string;
  }>("reports", seedReports);
}

// ---------- Mutations ----------
export async function createListing(l: Listing): Promise<void> {
  await setDoc(doc(db, "listings", l.id), l);
}

export async function updateListingStatus(id: string, status: Listing["status"]): Promise<void> {
  await updateDoc(doc(db, "listings", id), { status });
}

export async function upsertLandlordProfile(l: Landlord): Promise<void> {
  await setDoc(doc(db, "landlords", l.id), l, { merge: true });
}

export async function sendMessage(
  conversationId: string,
  msg: { from: string; text: string },
): Promise<void> {
  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    ...msg,
    createdAt: serverTimestamp(),
    // serverTimestamp() resolves to null in the local echo until the write is
    // acknowledged, which would make ordering flap on send; a client clock
    // value gives immediate, stable ordering.
    createdAtMs: Date.now(),
  });
  await updateDoc(doc(db, "conversations", conversationId), {
    lastPreview: msg.text,
    lastMessageAt: serverTimestamp(),
  });
}

/**
 * Finds the existing conversation between this student and landlord about
 * this listing, or creates one. Returns the conversation id.
 */
export async function findOrCreateConversation(params: {
  studentId: string;
  landlordId: string;
  listingId: string;
}): Promise<string> {
  const { studentId, landlordId, listingId } = params;
  const snap = await getDocs(
    query(
      collection(db, "conversations"),
      where("participants", "array-contains", studentId),
      where("listingId", "==", listingId),
    ),
  );
  const existing = snap.docs.find((d) =>
    (d.data().participants as string[] | undefined)?.includes(landlordId),
  );
  if (existing) return existing.id;

  const ref = await addDoc(collection(db, "conversations"), {
    participants: [studentId, landlordId],
    studentId,
    landlordId,
    listingId,
    lastPreview: "",
    unread: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
