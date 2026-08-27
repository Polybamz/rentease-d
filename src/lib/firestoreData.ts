/**
 * Client-side data hooks.
 *
 * These hooks are thin wrappers around the server functions in `data.ts`.
 * They preserve the same return types and signatures as the original Firestore
 * hooks so that route components don't need to change.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getListingsFn,
  getListingByIdFn,
  getListingByLandlordFn,
  getLandlordsFn,
  getLandlordByIdFn,
  getReviewsFn,
  getConversationsByUidFn,
  getMessagesByConversationFn,
  markConversationReadFn,
  getTenantsFn,
  getPaymentsFn,
  getReportsFn,
  reportListingFn,
  deleteReportFn,
  createListingFn,
  updateListingStatusFn,
  upsertLandlordProfileFn,
  sendMessageFn,
  findOrCreateConversationFn,
  getUserRoleFn,
  setUserRoleFn,
} from "@/lib/data";
import type { Listing, Landlord, Review, Conversation, Message } from "@/lib/mockData";

const isBrowser = typeof window !== "undefined";

// ---------------------------------------------------------------------------
// Listings invalidation
// ---------------------------------------------------------------------------
// Lets the client re-fetch listings whenever an admin mutation happens, so an
// Approve/Reject click takes effect on screen immediately instead of the panel
// showing stale data until a manual refresh.
let listingsVersion = 0;
const listingsListeners = new Set<() => void>();

function subscribeListings(cb: () => void) {
  listingsListeners.add(cb);
  return () => {
    listingsListeners.delete(cb);
  };
}

function getListingsVersion(): number {
  return listingsVersion;
}

// Bump locally and notify all open tabs that data changed. A mutation in one
// tab (e.g. an admin approving a listing) must refresh a student's already-open
// /browse tab too, otherwise the newly-approved listing stays hidden until they
// manually reload.
function bumpListingsVersion(source: "local" | "remote" = "local") {
  listingsVersion += 1;
  listingsListeners.forEach((l) => l());
  // Only broadcast on the tab that actually performed the write — echo it back
  // and the other tabs would re-broadcast in an endless loop.
  if (source === "local" && listingsChannel) {
    listingsChannel.postMessage("changed");
  }
}

const listingsChannel =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("rentease:listings") : null;

if (listingsChannel) {
  listingsChannel.onmessage = () => bumpListingsVersion("remote");
}

function useListingsVersion(): number {
  return useSyncExternalStore(subscribeListings, getListingsVersion);
}

// ---------------------------------------------------------------------------
// Reports invalidation
// ---------------------------------------------------------------------------
// Mirrors the listings store: a report created/removed bumps this version so
// every open admin tab (and the in-flight stats) refreshes via useSyncExternalStore
// instead of waiting for a manual reload. Cross-tab sync uses a BroadcastChannel
// so an admin dismissing a report in one tab sees it gone in another.
let reportsVersion = 0;
const reportsListeners = new Set<() => void>();

function subscribeReports(cb: () => void) {
  reportsListeners.add(cb);
  return () => {
    reportsListeners.delete(cb);
  };
}

function getReportsVersion(): number {
  return reportsVersion;
}

function bumpReportsVersion(source: "local" | "remote" = "local") {
  reportsVersion += 1;
  reportsListeners.forEach((l) => l());
  if (source === "local" && reportsChannel) {
    reportsChannel.postMessage("changed");
  }
}

const reportsChannel =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("rentease:reports") : null;

if (reportsChannel) {
  reportsChannel.onmessage = () => bumpReportsVersion("remote");
}

function useReportsVersion(): number {
  return useSyncExternalStore(subscribeReports, getReportsVersion);
}

// ---------------------------------------------------------------------------
// Messages / conversations invalidation
// ---------------------------------------------------------------------------
// Lets the client re-fetch messages whenever a message is sent, so a sent
// message appears immediately (and on the other party's open tab too) instead
// of only after a manual refresh. Mirrors the listings store above: a local
// mutation bumps this realm and broadcasts; other open tabs (the recipient)
// receive the broadcast and re-fetch.
let messagesVersion = 0;
const messageListeners = new Set<() => void>();

function subscribeMessages(cb: () => void) {
  messageListeners.add(cb);
  return () => {
    messageListeners.delete(cb);
  };
}

function getMessagesVersion(): number {
  return messagesVersion;
}

function bumpMessagesVersion(source: "local" | "remote" = "local") {
  messagesVersion += 1;
  messageListeners.forEach((l) => l());
  if (source === "local" && messagesChannel) {
    messagesChannel.postMessage("changed");
  }
}

const messagesChannel =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("rentease:messages") : null;

if (messagesChannel) {
  messagesChannel.onmessage = () => bumpMessagesVersion("remote");
}

function useMessagesVersion(): number {
  return useSyncExternalStore(subscribeMessages, getMessagesVersion);
}

// ---------- Seeding (now a no-op; SQL is seeded server-side) ----------
export async function seedFirestoreIfEmpty(): Promise<void> {
  // Firestore seeding has been replaced by SQL seeding in data.ts.
  // This function is kept for backwards compatibility but does nothing.
  if (!isBrowser) return;
  if (!import.meta.env.DEV) return;
}

// ---------- Generic fetch hook ----------
function useAsyncList<T>(
  fn: () => Promise<T[]>,
  fallback: T[],
  deps: unknown[] = [],
  enabled = true,
): T[] {
  const [data, setData] = useState<T[]>(fallback);

  useEffect(() => {
    if (!isBrowser || !enabled) {
      setData(fallback);
      return;
    }
    fn()
      .then(setData)
      .catch((err) => console.error("data fetch error", err));
  }, [...deps, enabled]);

  return data;
}

// ---------- Hooks ----------

export function useListings(): Listing[] {
  // Always read from the SQLite DB via the server function — never fall back to
  // the in-code seed array, so a listing a landlord creates (then an admin
  // approves) is what actually shows for students.
  return useAsyncList(getListingsFn, [], [useListingsVersion()]);
}

export function useListing(id: string | undefined): Listing | undefined {
  const [data, setData] = useState<Listing | undefined>(undefined);

  useEffect(() => {
    if (!isBrowser || !id) {
      setData(undefined);
      return;
    }
    getListingByIdFn({ data: { id } })
      .then(setData)
      .catch((err) => console.error("listing fetch error", err));
  }, [id]);

  return data;
}

export function useListingsByLandlord(landlordId: string): Listing[] {
  return useAsyncList(
    () => getListingByLandlordFn({ data: { landlordId } }),
    [],
    [landlordId, useListingsVersion()],
  );
}

export function useLandlords(): Landlord[] {
  return useAsyncList(getLandlordsFn, []);
}

export function useLandlord(id: string | undefined): Landlord | undefined {
  const [data, setData] = useState<Landlord | undefined>(undefined);

  useEffect(() => {
    if (!isBrowser || !id) {
      setData(undefined);
      return;
    }
    getLandlordByIdFn({ data: { id } })
      .then(setData)
      .catch((err) => console.error("landlord fetch error", err));
  }, [id]);

  return data;
}

export function useReviews(): Review[] {
  return useAsyncList(getReviewsFn, []);
}

export function useConversations(uid: string | undefined): Conversation[] {
  return useAsyncList(
    uid
      ? async () => {
          const list = await getConversationsByUidFn({ data: { uid } });
          // Conversations don't carry their messages (loaded separately via
          // useMessages), so satisfy the Conversation shape with an empty list.
          return list.map((c) => ({ ...c, messages: [] }));
        }
      : () => Promise.resolve([]),
    [],
    [uid, useMessagesVersion()],
    !!uid,
  );
}

export function useMessages(conversationId: string | undefined): Message[] {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const version = useMessagesVersion();

  useEffect(() => {
    if (!isBrowser || !conversationId) {
      setMsgs([]);
      return;
    }
    getMessagesByConversationFn({ data: { conversationId } })
      .then(setMsgs)
      .catch((err) => console.error("messages fetch error", err));
  }, [conversationId, version]);

  return msgs;
}

export function useTenants() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    if (!isBrowser) return;
    getTenantsFn()
      .then(setData)
      .catch((err) => console.error("tenants fetch error", err));
  }, []);
  return data;
}

export function usePayments() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    if (!isBrowser) return;
    getPaymentsFn()
      .then(setData)
      .catch((err) => console.error("payments fetch error", err));
  }, []);
  return data;
}

export function useReports() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    if (!isBrowser) return;
    getReportsFn()
      .then(setData)
      .catch((err) => console.error("reports fetch error", err));
  }, [useReportsVersion()]);
  return data;
}

// ---------- Mutations ----------

/**
 * Submit a report for a listing (student -> admin). The report is stored with
 * the listing id so the admin dashboard can link back to the reported listing.
 */
export async function reportListing(params: {
  listingId: string;
  reason: string;
  reporter: string;
}): Promise<void> {
  await reportListingFn({ data: params });
  bumpReportsVersion();
}

/** Dismiss a reported listing (admin action). Resolves the report immediately. */
export async function deleteReport(reportId: string): Promise<void> {
  await deleteReportFn({ data: { reportId } });
  bumpReportsVersion();
}

export async function createListing(l: Listing): Promise<void> {
  await createListingFn({ data: l });
  // Invalidate so the new listing shows up immediately anywhere useListings()
  // is mounted (e.g. the admin approval panel) without a manual refresh.
  bumpListingsVersion();
}

export async function updateListingStatus(id: string, status: Listing["status"]): Promise<void> {
  await updateListingStatusFn({ data: { id, status } });
  // Invalidate so any mounted useListings() re-fetches and the admin panel
  // reflects the new status without a manual page refresh.
  bumpListingsVersion();
}

export async function upsertLandlordProfile(l: Landlord): Promise<void> {
  await upsertLandlordProfileFn({ data: l });
}

export async function sendMessage(
  conversationId: string,
  msg: { from: string; text: string },
): Promise<void> {
  await sendMessageFn({ data: { conversationId, from: msg.from, text: msg.text } });
  // Invalidate so the sender's thread, the conversation list (last preview),
  // and the recipient's open tab all re-fetch and show the new message.
  bumpMessagesVersion();
}

export async function findOrCreateConversation(params: {
  studentId: string;
  landlordId: string;
  listingId: string;
}): Promise<string> {
  const id = await findOrCreateConversationFn({ data: params });
  // If a new conversation was created, refresh inboxes so it appears in both
  // parties' conversation lists right away.
  bumpMessagesVersion();
  return id;
}

/** Clear the unread badge for a conversation the user just opened. */
export async function markConversationRead(conversationId: string): Promise<void> {
  await markConversationReadFn({ data: { conversationId } });
  bumpMessagesVersion();
}

export async function getUserRole(uid: string): Promise<string | null> {
  return getUserRoleFn({ data: { uid } });
}

export async function setUserRole(
  uid: string,
  role: "student" | "landlord" | "admin" | null,
  email: string | null,
): Promise<void> {
  await setUserRoleFn({ data: { uid, role, email } });
}
