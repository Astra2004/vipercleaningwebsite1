import nodemailer from "nodemailer";
import { extraLabels, frequencyLabels, serviceLabels } from "./pricing.mjs";

const ownerEmail = process.env.OWNER_EMAIL || "shane.vipercleaningservices@gmail.com";
const resendApiKey = process.env.RESEND_API_KEY || "";
const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const mailFrom = process.env.MAIL_FROM || process.env.RESEND_FROM || ownerEmail;

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
  return Boolean(resendApiKey || transporter);
}

async function sendEmail(message) {
  if (resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: message.from,
        to: Array.isArray(message.to) ? message.to : [message.to],
        reply_to: message.replyTo ? [message.replyTo] : undefined,
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  if (!transporter) {
    throw new Error("No email provider is configured.");
  }

  return transporter.sendMail(message);
}

export async function sendQuoteEmails({ quoteId, contact, computed, notes, spinClaim }) {
  if (!resendApiKey && !transporter) {
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

  await sendEmail(ownerMessage);

  if (customerMessage) {
    await sendEmail(customerMessage);
  }

  return { ownerSent: true, customerSent: Boolean(customerMessage), skipped: false };
}

export async function sendContactEmail({ name, phone, email, service, message }) {
  if (!resendApiKey && !transporter) {
    return { ownerSent: false, customerSent: false, skipped: true };
  }

  const summaryLines = [
    line("Name", name),
    line("Phone", phone),
    line("Email", email),
    line("Service interest", service),
    line("Message", message),
  ];

  const text = summaryLines.join("\n");
  const htmlRows = summaryLines
    .map((item) => {
      const [labelText, ...rest] = item.split(": ");
      return `<tr><th align="left" style="padding:8px;border-bottom:1px solid #dbe3ef;">${labelText}</th><td style="padding:8px;border-bottom:1px solid #dbe3ef;">${rest.join(": ")}</td></tr>`;
    })
    .join("");

  const ownerMessage = {
    from: mailFrom,
    to: ownerEmail,
    replyTo: email || undefined,
    subject: `New Viper contact form message from ${name}`,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
        <h2 style="margin:0 0 12px;">Viper Cleaning Services Contact Request</h2>
        <p style="margin:0 0 16px;">A customer submitted the website contact form.</p>
        <table style="border-collapse:collapse;width:100%;max-width:680px;">${htmlRows}</table>
      </div>
    `,
  };

  const customerMessage = email
    ? {
        from: mailFrom,
        to: email,
        subject: "We received your message | Viper Cleaning Services",
        text: `Thanks for contacting Viper Cleaning Services.\n\n${text}\n\nWe will follow up with you soon.`,
        html: `
          <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
            <h2 style="margin:0 0 12px;">Thanks for contacting Viper Cleaning Services</h2>
            <p style="margin:0 0 16px;">We received your message and will follow up with you soon.</p>
            <table style="border-collapse:collapse;width:100%;max-width:680px;">${htmlRows}</table>
          </div>
        `,
      }
    : null;

  await sendEmail(ownerMessage);

  if (customerMessage) {
    await sendEmail(customerMessage);
  }

  return { ownerSent: true, customerSent: Boolean(customerMessage), skipped: false };
}
