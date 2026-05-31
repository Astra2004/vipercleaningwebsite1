import nodemailer from "nodemailer";
import { extraLabels, frequencyLabels, serviceLabels } from "./pricing.mjs";

const ownerEmail = process.env.OWNER_EMAIL || "shane.vipercleaningservices@gmail.com";
const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const mailFrom = process.env.MAIL_FROM || ownerEmail;

const transporter =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

function line(label, value) {
  return `${label}: ${value || "Not provided"}`;
}

function formatExtras(extras) {
  return extras?.length ? extras.map((extra) => extraLabels[extra] || extra).join(", ") : "None";
}

export function emailEnabled() {
  return Boolean(transporter);
}

export async function sendQuoteEmails({ quoteId, contact, computed, notes, spinClaim }) {
  if (!transporter) {
    return { ownerSent: false, customerSent: false, skipped: true };
  }

  const summaryLines = [
    line("Quote ID", quoteId),
    line("Name", contact.name),
    line("Phone", contact.phone),
    line("Email", contact.email),
    line("Address", contact.address),
    line("Preferred date", contact.preferredDate),
    line("Service", serviceLabels[computed.service]),
    line("Square feet", computed.sqft.toLocaleString("en-US")),
    line("Bedrooms", computed.bedrooms),
    line("Bathrooms", computed.bathrooms),
    line("Frequency", frequencyLabels[computed.frequency]),
    line("Add-ons checked", formatExtras(computed.extras)),
    line("Estimate", `$${computed.total} (${`range $${computed.low} - $${computed.high}`})`),
    line("Spin prize", spinClaim ? `${spinClaim.prize} (${spinClaim.code})` : "None"),
    line("Notes", notes),
  ];

  const text = summaryLines.join("\n");
  const htmlRows = summaryLines
    .map((item) => {
      const [labelText, ...rest] = item.split(": ");
      return `<tr><th align="left" style="padding:8px;border-bottom:1px solid #dbe3ef;">${labelText}</th><td style="padding:8px;border-bottom:1px solid #dbe3ef;">${rest.join(": ")}</td></tr>`;
    })
    .join("");
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 12px;">Viper Cleaning Services Quote Request</h2>
      <p style="margin:0 0 16px;">A quote request was submitted from vipercleaningservices.com.</p>
      <table style="border-collapse:collapse;width:100%;max-width:680px;">${htmlRows}</table>
      <p style="margin-top:18px;color:#5d6677;">Final pricing is confirmed after property condition, photos, schedule, and service address are reviewed.</p>
    </div>
  `;

  const ownerMessage = {
    from: mailFrom,
    to: ownerEmail,
    replyTo: contact.email || undefined,
    subject: `New Viper quote request from ${contact.name}`,
    text,
    html,
  };

  const customerMessage = contact.email
    ? {
        from: mailFrom,
        to: contact.email,
        subject: "Your Viper Cleaning Services quote request",
        text: `Thanks for requesting a quote from Viper Cleaning Services.\n\n${text}\n\nWe will follow up to confirm the final price and schedule.`,
        html: `
          <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
            <h2 style="margin:0 0 12px;">Thanks for requesting a quote</h2>
            <p style="margin:0 0 16px;">We received your Viper Cleaning Services request and will follow up to confirm final pricing and schedule.</p>
            <table style="border-collapse:collapse;width:100%;max-width:680px;">${htmlRows}</table>
          </div>
        `,
      }
    : null;

  await transporter.sendMail(ownerMessage);

  if (customerMessage) {
    await transporter.sendMail(customerMessage);
  }

  return { ownerSent: true, customerSent: Boolean(customerMessage), skipped: false };
}
