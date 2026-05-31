import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateEstimate, extraLabels, frequencyLabels, serviceLabels, wheelPrizes } from "./pricing.mjs";
import { db, getAdminData, nowIso, replaceAdminData } from "./database.mjs";
import { sendQuoteEmails } from "./mailer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const app = express();

const port = Number(process.env.PORT || 8787);
const ownerPassword = process.env.OWNER_PASSWORD || "viper2026";
const tokenSecret = process.env.SESSION_SECRET || "dev-viper-cleaning-session-secret";

app.use(express.json({ limit: "1mb" }));

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone = "") {
  return String(phone).replace(/\D/g, "");
}

function makePromoCode() {
  return `VIPER-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function makeUniqueSpinCode() {
  let code = makePromoCode();
  while (db.prepare("SELECT 1 FROM spin_codes WHERE code = ?").get(code) || db.prepare("SELECT 1 FROM spin_claims WHERE code = ?").get(code)) {
    code = makePromoCode();
  }
  return code;
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", tokenSecret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token) {
  try {
    const [body, sig] = String(token || "").split(".");
    if (!body || !sig) return null;
    const expected = crypto.createHmac("sha256", tokenSecret).update(body).digest("base64url");
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const payload = verifyToken(token);
  if (!payload?.owner) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "viper-cleaning-api" });
});

app.get("/api/config", (req, res) => {
  res.json({
    serviceLabels,
    frequencyLabels,
    extraLabels,
    spinMinimum: 150,
  });
});

app.post("/api/admin/login", (req, res) => {
  if (String(req.body?.password || "") !== ownerPassword) {
    return res.status(401).json({ error: "Invalid password" });
  }

  res.json({
    token: signToken({ owner: true, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
  });
});

app.get("/api/admin/data", requireAdmin, (req, res) => {
  res.json(getAdminData());
});

app.put("/api/admin/data", requireAdmin, (req, res) => {
  res.json(replaceAdminData(req.body || {}));
});

app.post("/api/admin/spin-codes", requireAdmin, (req, res) => {
  const customerName = String(req.body?.customerName || "").trim();
  const phone = String(req.body?.phone || "").trim();
  const email = String(req.body?.email || "").trim();
  const notes = String(req.body?.notes || "").trim();
  const code = makeUniqueSpinCode();

  db.prepare(
    `INSERT INTO spin_codes (
      id, code, customer_name, phone, email, notes, created_at
    ) VALUES (
      @id, @code, @customer_name, @phone, @email, @notes, @created_at
    )`,
  ).run({
    id: makeId("spin-code"),
    code,
    customer_name: customerName,
    phone,
    email,
    notes,
    created_at: nowIso(),
  });

  res.status(201).json({
    code,
    customerName,
    phone,
    email,
    notes,
  });
});

app.post("/api/public/spin", (req, res) => {
  const contact = req.body?.contact || {};
  const estimateInput = req.body?.estimateInput || {};
  const computed = calculateEstimate(estimateInput);
  const submittedCode = String(req.body?.code || "").trim().toUpperCase();
  const emailNorm = normalizeEmail(contact.email);
  const phoneNorm = normalizePhone(contact.phone);
  const providedName = String(contact.name || "").trim();

  if (!submittedCode) {
    return res.status(400).json({ error: "Enter a valid spin code from Viper Cleaning Services." });
  }

  const storedCode = db.prepare("SELECT * FROM spin_codes WHERE code = ?").get(submittedCode);
  if (!storedCode) {
    return res.status(404).json({ error: "That spin code was not found." });
  }

  if (storedCode.redeemed_claim_id) {
    const existing = db.prepare("SELECT * FROM spin_claims WHERE id = ?").get(storedCode.redeemed_claim_id);
    if (existing) {
      return res.json({
        alreadyClaimed: true,
        claim: {
          prize: existing.prize,
          code: existing.code,
          estimateTotal: existing.estimate_total,
          spunAt: existing.created_at,
        },
      });
    }
    return res.status(409).json({ error: "That spin code has already been used." });
  }

  const prize = wheelPrizes[Math.floor(Math.random() * wheelPrizes.length)];
  const createdAt = nowIso();
  const claimId = makeId("spin");
  const claim = {
    id: claimId,
    code: submittedCode,
    customer_name: providedName || storedCode.customer_name || "Viper customer",
    phone: String(contact.phone || storedCode.phone || "").trim(),
    email: String(contact.email || storedCode.email || "").trim(),
    phone_norm: phoneNorm || normalizePhone(storedCode.phone),
    email_norm: emailNorm || normalizeEmail(storedCode.email),
    address: String(contact.address || "").trim(),
    service: computed.service,
    estimate_total: computed.total,
    prize,
    created_at: createdAt,
  };

  const claimSpin = db.transaction(() => {
    db.prepare(
      `INSERT INTO spin_claims (
        id, code, customer_name, phone, email, phone_norm, email_norm,
        address, service, estimate_total, prize, created_at
      ) VALUES (
        @id, @code, @customer_name, @phone, @email, @phone_norm, @email_norm,
        @address, @service, @estimate_total, @prize, @created_at
      )`,
    ).run(claim);

    db.prepare(
      `UPDATE spin_codes
       SET redeemed_at = @redeemed_at,
           redeemed_claim_id = @redeemed_claim_id
       WHERE code = @code`,
    ).run({
      redeemed_at: createdAt,
      redeemed_claim_id: claimId,
      code: submittedCode,
    });
  });

  claimSpin();

  res.status(201).json({
    alreadyClaimed: false,
    claim: {
      prize,
      code: submittedCode,
      estimateTotal: claim.estimate_total,
      spunAt: createdAt,
    },
  });
});

app.post("/api/public/quote", async (req, res) => {
  const contact = req.body?.contact || {};
  const estimateInput = req.body?.estimateInput || {};
  const computed = calculateEstimate(estimateInput);
  const name = String(contact.name || "").trim();
  const phone = String(contact.phone || "").trim();
  const email = String(contact.email || "").trim();
  const address = String(contact.address || "").trim();
  const preferredDate = String(contact.preferredDate || "").trim();
  const notes = String(req.body?.notes || "").trim();
  const spinCode = String(req.body?.spinCode || "").trim().toUpperCase();

  if (!name || (!phone && !email)) {
    return res.status(400).json({ error: "Name and either phone or email are required." });
  }

  const spinClaim = spinCode ? db.prepare("SELECT * FROM spin_claims WHERE code = ?").get(spinCode) : null;
  const estimateId = makeId("estimate");
  const quoteId = makeId("quote");
  const createdAt = nowIso();
  const quoteNotes = [
    "Website quote request.",
    address ? `Address: ${address}` : "",
    preferredDate ? `Preferred date: ${preferredDate}` : "",
    notes ? `Customer notes: ${notes}` : "",
    spinClaim ? `Spin prize: ${spinClaim.prize} (${spinClaim.code})` : "",
    `IP: ${clientIp(req)}`,
  ]
    .filter(Boolean)
    .join(" ");

  const insert = db.transaction(() => {
    db.prepare(
      `INSERT INTO estimates (
        id, customer_name, service, sqft, bedrooms, bathrooms, frequency, extras_json,
        notes, total, low, high, status, created_at, source
      ) VALUES (
        @id, @customer_name, @service, @sqft, @bedrooms, @bathrooms, @frequency, @extras_json,
        @notes, @total, @low, @high, @status, @created_at, @source
      )`,
    ).run({
      id: estimateId,
      customer_name: name,
      service: computed.service,
      sqft: computed.sqft,
      bedrooms: computed.bedrooms,
      bathrooms: computed.bathrooms,
      frequency: computed.frequency,
      extras_json: JSON.stringify(computed.extras),
      notes: quoteNotes,
      total: computed.total,
      low: computed.low,
      high: computed.high,
      status: "New",
      created_at: createdAt,
      source: "public",
    });

    db.prepare(
      `INSERT INTO public_quote_requests (
        id, estimate_id, customer_name, phone, email, address, preferred_date,
        service, sqft, bedrooms, bathrooms, frequency, extras_json, notes,
        total, low, high, spin_code, spin_prize, created_at
      ) VALUES (
        @id, @estimate_id, @customer_name, @phone, @email, @address, @preferred_date,
        @service, @sqft, @bedrooms, @bathrooms, @frequency, @extras_json, @notes,
        @total, @low, @high, @spin_code, @spin_prize, @created_at
      )`,
    ).run({
      id: quoteId,
      estimate_id: estimateId,
      customer_name: name,
      phone,
      email,
      address,
      preferred_date: preferredDate,
      service: computed.service,
      sqft: computed.sqft,
      bedrooms: computed.bedrooms,
      bathrooms: computed.bathrooms,
      frequency: computed.frequency,
      extras_json: JSON.stringify(computed.extras),
      notes,
      total: computed.total,
      low: computed.low,
      high: computed.high,
      spin_code: spinClaim?.code || "",
      spin_prize: spinClaim?.prize || "",
      created_at: createdAt,
    });
  });

  insert();

  let emailStatus = { ownerSent: false, customerSent: false, skipped: true };

  try {
    emailStatus = await sendQuoteEmails({
      quoteId,
      contact: { name, phone, email, address, preferredDate },
      computed,
      notes,
      spinClaim,
    });
  } catch (error) {
    console.error("Quote email failed", error);
    emailStatus = { ownerSent: false, customerSent: false, skipped: false, error: "Quote saved, but email delivery failed." };
  }

  res.status(201).json({
    ok: true,
    quoteId,
    estimateId,
    emailStatus,
  });
});

app.use(express.static(path.join(rootDir, "dist")));

app.use((req, res) => {
  res.sendFile(path.join(rootDir, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Viper Cleaning Services running on http://127.0.0.1:${port}`);
});
