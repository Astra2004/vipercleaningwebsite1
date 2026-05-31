# Viper Cleaning Services

Full-stack website and owner dashboard for Viper Cleaning Services.

## What Is Included

- Customer website with SEO metadata and LocalBusiness-style structured data.
- Quote calculator with server-side quote request saving.
- Spin wheel promotion with server-issued prize codes.
- Owner dashboard for estimates, flyer routes, clients, and revenue tracking.
- SQLite database stored on the server.
- Owner login protected by `OWNER_PASSWORD`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the API/database server:

```bash
npm run server
```

In another terminal, start the website:

```bash
npm run dev
```

Public site:

```text
http://127.0.0.1:5173/
```

Owner app:

```text
http://127.0.0.1:5173/#/ops
```

Default local owner password:

```text
viper2026
```

Change this before launch.

## Production Launch

For this project, the simplest live setup is one Render web service. The same Node server already serves:

- the customer website
- the owner app
- the API
- the SQLite database

That means you do not need separate frontend and backend hosts unless you want them later.

Create a `.env` file on the server based on `.env.example`:

```bash
PORT=8787
DATABASE_PATH=./data/viper-cleaning.sqlite
OWNER_PASSWORD=use-a-strong-private-password
SESSION_SECRET=use-a-long-random-secret
OWNER_EMAIL=shane.vipercleaningservices@gmail.com
MAIL_FROM=shane.vipercleaningservices@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=shane.vipercleaningservices@gmail.com
SMTP_PASS=your-gmail-app-password
```

Build the website:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

Point the domain to the hosting provider running this Node server. The same server handles the public website, API routes, owner login, and SQLite database.

## Recommended Live Setup

- Host: Render
- Domain DNS: Squarespace Domains
- Main domain: `yourdomain.com`
- Optional redirect or alias: `www.yourdomain.com`

## Render Setup

This repo includes [render.yaml](</C:/Users/shane/Documents/viper cleaning/render.yaml>) for a one-service deploy with:

- build command
- start command
- health check
- persistent disk for SQLite

In Render:

1. Create a new Web Service from this repo.
2. Let Render detect `render.yaml`.
3. Set these secret environment variables:
   - `OWNER_PASSWORD`
   - `SESSION_SECRET`
   - `SMTP_USER`
   - `SMTP_PASS`
4. Deploy the service.
5. Wait until Render gives you a live URL like `https://your-service.onrender.com`.
6. Open:
   - `/`
   - `/#/ops`
   - `/api/health`

## Squarespace DNS Setup

After Render is live:

1. In Render, add your custom domain:
   - apex/root domain: `yourdomain.com`
   - optional `www` domain: `www.yourdomain.com`
2. Render will show the exact DNS records it wants.
3. In Squarespace Domains, open your domain DNS settings and add those records.

Typical setup:

- `www` -> `CNAME` to the Render target
- root/apex domain -> `A` record or `ALIAS/ANAME` style target if Render provides one

Use the exact values Render shows for your service.

Squarespace domain help:

- [Squarespace domain pointing](https://support.squarespace.com/hc/en-us/articles/215744668-Pointing-a-Squarespace-domain)
- [Squarespace domains FAQ](https://support.squarespace.com/hc/en-us/articles/205812208-Squarespace-domains-FAQ)

Render custom domain help:

- [Render custom domains](https://render.com/docs/custom-domains/)

## Launch Checklist

1. Push this repo to GitHub.
2. Create the Render web service from the repo.
3. Add the secret env vars in Render.
4. Confirm `https://your-render-url/api/health` returns `ok: true`.
5. Add your domain in Render.
6. Copy the DNS records Render gives you into Squarespace.
7. Wait for SSL and DNS to finish provisioning.
8. Test:
   - homepage
   - quote form
   - owner login
   - spin code generation
   - one-time spin redemption
   - quote email delivery

## Gmail Email Setup

If you use Gmail for sending quote emails:

1. Turn on 2-Step Verification for the Gmail account.
2. Create a Google App Password.
3. Put that app password in `SMTP_PASS`.
4. Set:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=shane.vipercleaningservices@gmail.com`

Do not use your normal Gmail password.

## Important

The spin wheel is now code-backed. Generate a one-time code from the owner dashboard after a booking, then the customer can redeem that code for exactly one spin.

Quote emails are SMTP-backed. For Gmail, create a Google app password and put it in `SMTP_PASS`; do not use your normal Gmail password.

SQLite is good for launch and a small local service business. If traffic grows or multiple staff members use the dashboard heavily, move the database to managed Postgres.
