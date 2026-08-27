/**
 * Server-side data layer backed by SQLite (Node.js built-in `node:sqlite`).
 *
 * Each `createServerFn` below runs exclusively on the server. The client imports
 * these functions as callables – the framework serialises the call over HTTP.
 * The SQLite module is loaded lazily so it never touches the client bundle.
 */
import { createServerFn } from "@tanstack/react-start";
import { join } from "node:path";
import { z } from "zod";
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

// ---------------------------------------------------------------------------
// Seed versioning
// ---------------------------------------------------------------------------
// Bump SEED_VERSION whenever the seed dataset in mockData.ts changes shape.
// getDb() reseeds whenever the stored version differs, so a stale/corrupt DB
// file (created by an older build) self-heals instead of silently serving
// outdated dummy rows forever. Seed inserts use INSERT OR REPLACE, so
// user-created rows (which use random UUIDs, not seed ids) are preserved.
const SEED_VERSION = 2;

// ---------------------------------------------------------------------------
// SQLite singleton. Persists to a real file so admin decisions and user data
// survive restarts (an in-memory DB would wipe everything on every boot and
// make admin actions look like they "didn't stick").
//
// The file lives at the project root (where the app is started from) and can
// be overridden with the REASQ_DB env var for tests/CI. Use ":memory:" if you
// want an ephemeral database on purpose.
// ---------------------------------------------------------------------------
type Db = {
  prepare: (sql: string) => {
    all: (...args: any[]) => any[];
    get: (...args: any[]) => any | undefined;
    run: (...args: any[]) => void;
  };
  exec: (sql: string) => void;
};

// Cache the in-flight init promise, not the raw handle: concurrent callers then
// share one seed, and a failed seed is retried instead of leaving a half-seeded
// database cached for the rest of the process.
let dbPromise: Promise<Db> | null = null;

function dbPath(): string {
  if (process.env.REASQ_DB) return process.env.REASQ_DB;
  try {
    return join(process.cwd(), "rentease.db");
  } catch {
    return ":memory:";
  }
}

async function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { DatabaseSync } = await import("node:sqlite");
      const raw = new DatabaseSync(dbPath());

      const handle: Db = {
        prepare: (sql: string) => raw.prepare(sql),
        exec: (sql: string) => raw.exec(sql),
      };

      await ensureSchema(handle);
      // Seed whenever the stored seed version doesn't match the current one.
      // This lets a stale or partial DB file (e.g. created by an old build)
      // rebuild itself with the current dataset, while still preserving rows a
      // user created (those use random UUIDs and aren't overwritten by the
      // seed's INSERT OR REPLACE).
      const metaRow: any = handle.prepare(`SELECT value FROM meta WHERE key = 'seedVersion'`).get();
      const storedVersion = metaRow?.value === undefined ? 0 : Number(metaRow.value);

      const anyRows: any = handle.prepare("SELECT COUNT(*) AS n FROM listings").get();
      const hasListings = Number(anyRows?.n ?? 0) > 0;

      if (!hasListings || storedVersion !== SEED_VERSION) {
        await seedDatabase(handle);
        handle
          .prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('seedVersion', ?)`)
          .run(String(SEED_VERSION));
      }
      return handle;
    })().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
async function ensureSchema(db: Db): Promise<void> {
  db.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id           TEXT PRIMARY KEY,
      title        TEXT,
      photos       TEXT,
      price        REAL,
      deposit      REAL,
      distance_km  REAL,
      campus       TEXT,
      room_type    TEXT,
      occupants    INTEGER,
      amenities    TEXT,
      landlord_id  TEXT,
      rating       REAL,
      review_count INTEGER,
      status       TEXT,
      available_from TEXT,
      address      TEXT,
      lat          REAL,
      lng          REAL,
      description  TEXT
    );
    CREATE TABLE IF NOT EXISTS landlords (
      id          TEXT PRIMARY KEY,
      name        TEXT,
      avatar      TEXT,
      verified    INTEGER,
      rating      REAL,
      review_count INTEGER,
      joined      TEXT,
      bio         TEXT
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id          TEXT PRIMARY KEY,
      listing_id  TEXT,
      landlord_id TEXT,
      author      TEXT,
      avatar      TEXT,
      rating      REAL,
      date        TEXT,
      text        TEXT
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id            TEXT PRIMARY KEY,
      landlord_id   TEXT,
      student_id    TEXT,
      participants  TEXT,
      listing_id    TEXT,
      last_preview  TEXT,
      unread        INTEGER,
      created_at    REAL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id               TEXT PRIMARY KEY,
      conversation_id  TEXT,
      sender           TEXT,
      text             TEXT,
      created_at_ms    REAL,
      time             TEXT
    );
    CREATE TABLE IF NOT EXISTS tenants (
      id      TEXT PRIMARY KEY,
      name    TEXT,
      listing TEXT,
      move_in TEXT,
      rent    REAL,
      status  TEXT
    );
    CREATE TABLE IF NOT EXISTS payments (
      id       TEXT PRIMARY KEY,
      tenant   TEXT,
      month    TEXT,
      amount   REAL,
      status   TEXT,
      date     TEXT
    );
    CREATE TABLE IF NOT EXISTS reports (
      id       TEXT PRIMARY KEY,
      listing  TEXT,
      reason   TEXT,
      reporter TEXT,
      date     TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      uid       TEXT PRIMARY KEY,
      role      TEXT,
      email     TEXT,
      updated_at REAL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

// ---------------------------------------------------------------------------
// Seeding (seed data only: sqlite file is created & seeded on first run)
// ---------------------------------------------------------------------------
async function seedDatabase(db: Db): Promise<void> {
  // Seed listings
  for (const l of seedListings) {
    db.prepare(
      `INSERT OR REPLACE INTO listings
        (id, title, photos, price, deposit, distance_km, campus, room_type,
         occupants, amenities, landlord_id, rating, review_count, status,
         available_from, address, lat, lng, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      l.id,
      l.title,
      JSON.stringify(l.photos),
      l.price,
      l.deposit,
      l.distanceKm,
      l.campus,
      l.roomType,
      l.occupants,
      JSON.stringify(l.amenities),
      l.landlordId,
      l.rating,
      l.reviewCount,
      l.status,
      l.availableFrom,
      l.address,
      l.lat,
      l.lng,
      l.description,
    );
  }

  // Seed landlords
  for (const l of seedLandlords) {
    db.prepare(
      `INSERT OR REPLACE INTO landlords
        (id, name, avatar, verified, rating, review_count, joined, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(l.id, l.name, l.avatar, l.verified ? 1 : 0, l.rating, l.reviewCount, l.joined, l.bio);
  }

  // Seed reviews
  for (const r of seedReviews) {
    db.prepare(
      `INSERT OR REPLACE INTO reviews
        (id, listing_id, landlord_id, author, avatar, rating, date, text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(r.id, r.listingId, r.landlordId, r.author, r.avatar, r.rating, r.date, r.text);
  }

  // Seed tenants
  for (const t of seedTenants as any[]) {
    db.prepare(
      `INSERT OR REPLACE INTO tenants (id, name, listing, move_in, rent, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(t.id, t.name, t.listing, t.moveIn, t.rent, t.status);
  }

  // Seed payments
  for (const p of seedPayments as any[]) {
    db.prepare(
      `INSERT OR REPLACE INTO payments (id, tenant, month, amount, status, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(p.id, p.tenant, p.month, p.amount, p.status, p.date);
  }

  // Seed reports
  for (const r of seedReports as any[]) {
    db.prepare(
      `INSERT OR REPLACE INTO reports (id, listing, reason, reporter, date)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(r.id, r.listing, r.reason, r.reporter, r.date);
  }

  // Seed conversations + messages
  for (const c of seedConversations) {
    const { messages, ...rest } = c;
    db.prepare(
      `INSERT OR REPLACE INTO conversations
        (id, landlord_id, student_id, participants, listing_id,
         last_preview, unread, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      rest.id,
      rest.landlordId,
      rest.studentId ?? null,
      JSON.stringify(rest.participants ?? []),
      rest.listingId,
      rest.lastPreview,
      rest.unread,
      Date.now(),
    );
    for (const m of messages) {
      db.prepare(
        `INSERT OR REPLACE INTO messages
          (id, conversation_id, sender, text, created_at_ms, time)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(m.id, c.id, m.from, m.text, m.createdAtMs ?? 0, m.time ?? null);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseJsonField(value: string | null): any[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Server functions — listings
// ---------------------------------------------------------------------------

export const getListingsFn = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  const rows = db.prepare("SELECT * FROM listings").all();
  return rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    photos: parseJsonField(r.photos),
    price: r.price,
    deposit: r.deposit,
    distanceKm: r.distance_km,
    campus: r.campus,
    roomType: r.room_type,
    occupants: r.occupants,
    amenities: parseJsonField(r.amenities),
    landlordId: r.landlord_id,
    rating: r.rating,
    reviewCount: r.review_count,
    status: r.status,
    availableFrom: r.available_from,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    description: r.description,
  })) as Listing[];
});

export const getListingByIdFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    const r: any = db.prepare("SELECT * FROM listings WHERE id = ?").get(data.id);
    if (!r) return undefined;
    return {
      id: r.id,
      title: r.title,
      photos: parseJsonField(r.photos),
      price: r.price,
      deposit: r.deposit,
      distanceKm: r.distance_km,
      campus: r.campus,
      roomType: r.room_type,
      occupants: r.occupants,
      amenities: parseJsonField(r.amenities),
      landlordId: r.landlord_id,
      rating: r.rating,
      reviewCount: r.review_count,
      status: r.status,
      availableFrom: r.available_from,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      description: r.description,
    } as Listing;
  });

export const getListingByLandlordFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ landlordId: z.string() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    const rows = db.prepare("SELECT * FROM listings WHERE landlord_id = ?").all(data.landlordId);
    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      photos: parseJsonField(r.photos),
      price: r.price,
      deposit: r.deposit,
      distanceKm: r.distance_km,
      campus: r.campus,
      roomType: r.room_type,
      occupants: r.occupants,
      amenities: parseJsonField(r.amenities),
      landlordId: r.landlord_id,
      rating: r.rating,
      reviewCount: r.review_count,
      status: r.status,
      availableFrom: r.available_from,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      description: r.description,
    })) as Listing[];
  });

// ---------------------------------------------------------------------------
// Server functions — landlords
// ---------------------------------------------------------------------------

export const getLandlordsFn = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  const rows = db.prepare("SELECT * FROM landlords").all();
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    verified: !!r.verified,
    rating: r.rating,
    reviewCount: r.review_count,
    joined: r.joined,
    bio: r.bio,
  })) as Landlord[];
});

export const getLandlordByIdFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    const r: any = db.prepare("SELECT * FROM landlords WHERE id = ?").get(data.id);
    if (!r) return undefined;
    return {
      id: r.id,
      name: r.name,
      avatar: r.avatar,
      verified: !!r.verified,
      rating: r.rating,
      reviewCount: r.review_count,
      joined: r.joined,
      bio: r.bio,
    } as Landlord;
  });

// ---------------------------------------------------------------------------
// Server functions — reviews
// ---------------------------------------------------------------------------

export const getReviewsFn = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  const rows = db.prepare("SELECT * FROM reviews").all();
  return rows as Review[];
});

// ---------------------------------------------------------------------------
// Server functions — conversations & messages
// ---------------------------------------------------------------------------

export const getConversationsByUidFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ uid: z.string() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    const rows: any[] = db.prepare("SELECT * FROM conversations").all();
    return rows
      .filter((r) => {
        const participants = parseJsonField(r.participants);
        return participants.includes(data.uid);
      })
      .map((r: any) => ({
        id: r.id,
        landlordId: r.landlord_id,
        studentId: r.student_id,
        participants: parseJsonField(r.participants),
        listingId: r.listing_id,
        lastPreview: r.last_preview,
        unread: r.unread,
        messages: [] as Message[],
      })) as Omit<Conversation, "messages">[];
  });

export const getMessagesByConversationFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ conversationId: z.string() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    const rows = db
      .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at_ms ASC")
      .all(data.conversationId);
    return rows.map((r: any) => ({
      id: r.id,
      from: r.sender,
      text: r.text,
      createdAtMs: r.created_at_ms,
      time: r.time,
    })) as Message[];
  });

export const markConversationReadFn = createServerFn({
  method: "POST",
})
  .validator(z.object({ conversationId: z.string() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    db.prepare(`UPDATE conversations SET unread = 0 WHERE id = ?`).run(data.conversationId);
  });

// ---------------------------------------------------------------------------
// Server functions — tenants, payments, reports
// ---------------------------------------------------------------------------

export const getTenantsFn = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  return db.prepare("SELECT * FROM tenants").all() as any[];
});

export const getPaymentsFn = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  return db.prepare("SELECT * FROM payments").all() as any[];
});

export const getReportsFn = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  // Join to listings so the admin panel can show the reported listing's title
  // and link straight to it. `listing` on the report row stores the listing id.
  const rows = db
    .prepare(
      `SELECT r.id AS id,
                r.listing AS listingId,
                l.title AS listing,
                r.reason AS reason,
                r.reporter AS reporter,
                r.date AS date
         FROM reports r
         LEFT JOIN listings l ON l.id = r.listing
         ORDER BY r.date DESC, r.id DESC`,
    )
    .all();
  return rows as any[];
});

export const reportListingFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      listingId: z.string(),
      reason: z.string().min(1),
      reporter: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const id = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const date = new Date().toISOString().slice(0, 10);
    db.prepare(
      `INSERT INTO reports (id, listing, reason, reporter, date)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, data.listingId, data.reason, data.reporter, date);
    return id;
  });

export const deleteReportFn = createServerFn({ method: "POST" })
  .validator(z.object({ reportId: z.string() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    db.prepare(`DELETE FROM reports WHERE id = ?`).run(data.reportId);
  });

// ---------------------------------------------------------------------------
// Server functions — mutations
// ---------------------------------------------------------------------------

export const createListingFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      id: z.string(),
      title: z.string(),
      photos: z.array(z.string()),
      price: z.number(),
      deposit: z.number(),
      distanceKm: z.number(),
      campus: z.string(),
      roomType: z.string(),
      occupants: z.number(),
      amenities: z.array(z.string()),
      landlordId: z.string(),
      rating: z.number(),
      reviewCount: z.number(),
      status: z.string(),
      availableFrom: z.string(),
      address: z.string(),
      lat: z.number(),
      lng: z.number(),
      description: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    db.prepare(
      `INSERT OR REPLACE INTO listings
        (id, title, photos, price, deposit, distance_km, campus, room_type,
         occupants, amenities, landlord_id, rating, review_count, status,
         available_from, address, lat, lng, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      data.id,
      data.title,
      JSON.stringify(data.photos),
      data.price,
      data.deposit,
      data.distanceKm,
      data.campus,
      data.roomType,
      data.occupants,
      JSON.stringify(data.amenities),
      data.landlordId,
      data.rating,
      data.reviewCount,
      data.status,
      data.availableFrom,
      data.address,
      data.lat,
      data.lng,
      data.description,
    );
  });

export const updateListingStatusFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      id: z.string(),
      status: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    db.prepare("UPDATE listings SET status = ? WHERE id = ?").run(data.status, data.id);
  });

export const upsertLandlordProfileFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string(),
      verified: z.boolean(),
      rating: z.number(),
      reviewCount: z.number(),
      joined: z.string(),
      bio: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    db.prepare(
      `INSERT OR REPLACE INTO landlords
        (id, name, avatar, verified, rating, review_count, joined, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      data.id,
      data.name,
      data.avatar,
      data.verified ? 1 : 0,
      data.rating,
      data.reviewCount,
      data.joined,
      data.bio,
    );
  });

export const sendMessageFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      conversationId: z.string(),
      from: z.string(),
      text: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const now = Date.now();
    db.prepare(
      `INSERT INTO messages (id, conversation_id, sender, text, created_at_ms, time)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(`msg_${now}`, data.conversationId, data.from, data.text, now, null);

    db.prepare(`UPDATE conversations SET last_preview = ?, unread = unread + 1 WHERE id = ?`).run(
      data.text,
      data.conversationId,
    );
  });

export const findOrCreateConversationFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      studentId: z.string(),
      landlordId: z.string(),
      listingId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const { studentId, landlordId, listingId } = data;

    const rows: any[] = db.prepare("SELECT * FROM conversations").all();
    const existing = rows.find((r) => {
      const participants = parseJsonField(r.participants);
      return (
        participants.includes(studentId) &&
        participants.includes(landlordId) &&
        r.listing_id === listingId
      );
    });

    if (existing) return existing.id;

    const id = `conv_${Date.now()}`;
    db.prepare(
      `INSERT INTO conversations
        (id, landlord_id, student_id, participants, listing_id,
         last_preview, unread, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      landlordId,
      studentId,
      JSON.stringify([studentId, landlordId]),
      listingId,
      "",
      0,
      Date.now(),
    );

    return id;
  });

// ---------------------------------------------------------------------------
// Server functions — user roles
// ---------------------------------------------------------------------------

export const getUserRoleFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ uid: z.string() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    const r: any = db.prepare("SELECT * FROM users WHERE uid = ?").get(data.uid);
    return (r?.role ?? null) as string | null;
  });

export const setUserRoleFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      uid: z.string(),
      role: z.union([z.literal("student"), z.literal("landlord"), z.literal("admin"), z.null()]),
      email: z.string().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    db.prepare(
      `INSERT INTO users (uid, role, email, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(uid) DO UPDATE SET role = excluded.role, email = excluded.email, updated_at = excluded.updated_at`,
    ).run(data.uid, data.role, data.email, Date.now());
  });
