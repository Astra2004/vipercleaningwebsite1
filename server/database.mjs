import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.env.DATA_DIR || "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.resolve(process.env.DATABASE_PATH || path.join(dataDir, "viper-cleaning.sqlite"));
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS estimates (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    service TEXT NOT NULL,
    sqft INTEGER NOT NULL,
    bedrooms REAL NOT NULL,
    bathrooms REAL NOT NULL,
    frequency TEXT NOT NULL,
    extras_json TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    total INTEGER NOT NULL,
    low INTEGER NOT NULL,
    high INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'New',
    created_at TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'owner'
  );

  CREATE TABLE IF NOT EXISTS public_quote_requests (
    id TEXT PRIMARY KEY,
    estimate_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    preferred_date TEXT NOT NULL DEFAULT '',
    service TEXT NOT NULL,
    sqft INTEGER NOT NULL,
    bedrooms REAL NOT NULL,
    bathrooms REAL NOT NULL,
    frequency TEXT NOT NULL,
    extras_json TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    total INTEGER NOT NULL,
    low INTEGER NOT NULL,
    high INTEGER NOT NULL,
    spin_code TEXT NOT NULL DEFAULT '',
    spin_prize TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS spin_claims (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone_norm TEXT NOT NULL DEFAULT '',
    email_norm TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    service TEXT NOT NULL,
    estimate_total INTEGER NOT NULL,
    prize TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_spin_claims_phone_norm ON spin_claims(phone_norm);
  CREATE INDEX IF NOT EXISTS idx_spin_claims_email_norm ON spin_claims(email_norm);

  CREATE TABLE IF NOT EXISTS spin_codes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    redeemed_at TEXT NOT NULL DEFAULT '',
    redeemed_claim_id TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_spin_codes_created_at ON spin_codes(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_spin_codes_redeemed_at ON spin_codes(redeemed_at DESC);

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL,
    frequency TEXT NOT NULL,
    next_service TEXT NOT NULL DEFAULT '',
    lifetime_value INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS flyers (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    neighborhood TEXT NOT NULL DEFAULT '',
    property_type TEXT NOT NULL,
    status TEXT NOT NULL,
    gps TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    visited_at TEXT NOT NULL
  );
`);

export const nowIso = () => new Date().toISOString();

export function rowToEstimate(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    service: row.service,
    sqft: row.sqft,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    frequency: row.frequency,
    extras: JSON.parse(row.extras_json || "[]"),
    notes: row.notes,
    total: row.total,
    low: row.low,
    high: row.high,
    status: row.status,
    createdAt: row.created_at.slice(0, 10),
  };
}

export function rowToClient(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    type: row.type,
    frequency: row.frequency,
    nextService: row.next_service,
    lifetimeValue: row.lifetime_value,
    notes: row.notes,
  };
}

export function rowToFlyer(row) {
  return {
    id: row.id,
    address: row.address,
    neighborhood: row.neighborhood,
    propertyType: row.property_type,
    status: row.status,
    gps: row.gps,
    notes: row.notes,
    visitedAt: row.visited_at.slice(0, 10),
  };
}

export function getAdminData() {
  return {
    estimates: db.prepare("SELECT * FROM estimates ORDER BY created_at DESC").all().map(rowToEstimate),
    clients: db.prepare("SELECT * FROM clients ORDER BY name COLLATE NOCASE").all().map(rowToClient),
    flyers: db.prepare("SELECT * FROM flyers ORDER BY visited_at DESC").all().map(rowToFlyer),
    spinCodes: db
      .prepare(
        `SELECT
          code,
          customer_name AS customerName,
          phone,
          email,
          notes,
          created_at AS createdAt,
          redeemed_at AS redeemedAt,
          redeemed_claim_id AS redeemedClaimId
        FROM spin_codes
        ORDER BY created_at DESC`,
      )
      .all(),
    spinClaims: db
      .prepare("SELECT code, customer_name AS customerName, phone, email, service, estimate_total AS estimateTotal, prize, created_at AS createdAt FROM spin_claims ORDER BY created_at DESC")
      .all(),
  };
}

export function replaceAdminData({ estimates = [], clients = [], flyers = [] }) {
  const replace = db.transaction(() => {
    const incomingEstimateIds = estimates.map((estimate) => estimate.id).filter(Boolean);
    if (incomingEstimateIds.length) {
      const placeholders = incomingEstimateIds.map(() => "?").join(",");
      db.prepare(`DELETE FROM estimates WHERE source = 'owner' AND id NOT IN (${placeholders})`).run(...incomingEstimateIds);
    } else {
      db.prepare("DELETE FROM estimates WHERE source = 'owner'").run();
    }
    db.prepare("DELETE FROM clients").run();
    db.prepare("DELETE FROM flyers").run();

    const upsertEstimate = db.prepare(`
      INSERT INTO estimates (
        id, customer_name, service, sqft, bedrooms, bathrooms, frequency, extras_json,
        notes, total, low, high, status, created_at, source
      ) VALUES (
        @id, @customer_name, @service, @sqft, @bedrooms, @bathrooms, @frequency, @extras_json,
        @notes, @total, @low, @high, @status, @created_at, @source
      )
      ON CONFLICT(id) DO UPDATE SET
        customer_name = excluded.customer_name,
        service = excluded.service,
        sqft = excluded.sqft,
        bedrooms = excluded.bedrooms,
        bathrooms = excluded.bathrooms,
        frequency = excluded.frequency,
        extras_json = excluded.extras_json,
        notes = excluded.notes,
        total = excluded.total,
        low = excluded.low,
        high = excluded.high,
        status = excluded.status
    `);

    for (const estimate of estimates) {
      const existing = db.prepare("SELECT source, created_at FROM estimates WHERE id = ?").get(estimate.id);
      upsertEstimate.run({
        id: estimate.id,
        customer_name: estimate.customerName || "Untitled estimate",
        service: estimate.service,
        sqft: Number(estimate.sqft) || 0,
        bedrooms: Number(estimate.bedrooms) || 0,
        bathrooms: Number(estimate.bathrooms) || 0,
        frequency: estimate.frequency,
        extras_json: JSON.stringify(estimate.extras || []),
        notes: estimate.notes || "",
        total: Number(estimate.total) || 0,
        low: Number(estimate.low) || 0,
        high: Number(estimate.high) || 0,
        status: estimate.status || "New",
        created_at: existing?.created_at || estimate.createdAt || nowIso(),
        source: existing?.source || "owner",
      });
    }

    const insertClient = db.prepare(`
      INSERT INTO clients (id, name, phone, email, address, type, frequency, next_service, lifetime_value, notes)
      VALUES (@id, @name, @phone, @email, @address, @type, @frequency, @next_service, @lifetime_value, @notes)
    `);

    for (const client of clients) {
      insertClient.run({
        id: client.id,
        name: client.name || "Untitled client",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        type: client.type || "Residential",
        frequency: client.frequency || "one-time",
        next_service: client.nextService || "",
        lifetime_value: Number(client.lifetimeValue) || 0,
        notes: client.notes || "",
      });
    }

    const insertFlyer = db.prepare(`
      INSERT INTO flyers (id, address, neighborhood, property_type, status, gps, notes, visited_at)
      VALUES (@id, @address, @neighborhood, @property_type, @status, @gps, @notes, @visited_at)
    `);

    for (const flyer of flyers) {
      insertFlyer.run({
        id: flyer.id,
        address: flyer.address || "Untitled stop",
        neighborhood: flyer.neighborhood || "",
        property_type: flyer.propertyType || "Residential",
        status: flyer.status || "Flyer left",
        gps: flyer.gps || "",
        notes: flyer.notes || "",
        visited_at: flyer.visitedAt || nowIso(),
      });
    }
  });

  replace();
  return getAdminData();
}
