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
http://127.0.0.1:5173/owner
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
MAIL_FROM=Viper Cleaning Services <onboarding@resend.dev>
RESEND_FROM=Viper Cleaning Services <onboarding@resend.dev>
RESEND_API_KEY=your-resend-api-key
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
   - `RESEND_API_KEY`
4. Deploy the service.
5. Wait until Render gives you a live URL like `https://your-service.onrender.com`.
6. Open:
   - `/`
   - `/owner`
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

## Resend Email Setup

Recommended for Render:

1. Create a Resend account.
2. Create an API key.
3. In Render, set:
   - `RESEND_API_KEY`
   - `MAIL_FROM`
   - `RESEND_FROM`
4. For first testing, `onboarding@resend.dev` works as a sender. For production customer emails, verify your own sending domain in Resend and then change `MAIL_FROM` / `RESEND_FROM` to that address.

Example:

```bash
MAIL_FROM=Viper Cleaning Services <onboarding@resend.dev>
RESEND_FROM=Viper Cleaning Services <onboarding@resend.dev>
```

If you still want SMTP as a fallback, keep:

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

Quote and contact emails now support Resend first, with SMTP left as a fallback. On Render, Resend is the recommended provider because SMTP connections may time out depending on the hosting plan.

SQLite is good for launch and a small local service business. If traffic grows or multiple staff members use the dashboard heavily, move the database to managed Postgres.

## Facebook Page Posting Helper

There is a simple Python helper at [scripts/facebook_page_poster.py](</C:/Users/shane/Documents/viper cleaning/scripts/facebook_page_poster.py>) that can post the next queued update to a Facebook business Page.

Important:

- This is for a Facebook Page, not a personal profile.
- You need a Page access token from Meta.
- The safest way to keep it posting regularly is to run it on a schedule with Windows Task Scheduler.

Required environment variables:

```bash
FACEBOOK_PAGE_ID=your-facebook-page-id
FACEBOOK_PAGE_ACCESS_TOKEN=your-facebook-page-access-token
```

Queue example:

[marketing/facebook_queue.example.json](</C:/Users/shane/Documents/viper cleaning/marketing/facebook_queue.example.json>)

Example dry run:

```bash
python scripts/facebook_page_poster.py --queue marketing/facebook_queue.json --dry-run
```

Example live run:

```bash
python scripts/facebook_page_poster.py --queue marketing/facebook_queue.json
```

The script posts the next item with `status: "pending"` whose `publish_after` time has arrived, then marks it as `posted`.

## Cloudflare Worker Scheduler For Facebook

If you want the posting to run without your computer being on, use the Cloudflare Worker version:

- [workers/facebook-scheduler/src/index.js](</C:/Users/shane/Documents/viper cleaning/workers/facebook-scheduler/src/index.js>)
- [workers/facebook-scheduler/wrangler.jsonc](</C:/Users/shane/Documents/viper cleaning/workers/facebook-scheduler/wrangler.jsonc>)
- [workers/facebook-scheduler/posts.example.json](</C:/Users/shane/Documents/viper cleaning/workers/facebook-scheduler/posts.example.json>)

What it does:

- runs on a Cloudflare Cron Trigger every day
- posts the next message in your rotation
- stores the last-used post index in Workers KV
- gives you a manual trigger URL for testing

Secrets to set in Cloudflare:

- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `FACEBOOK_POSTS_JSON`
- `MANUAL_TRIGGER_KEY`

The example cron in `wrangler.jsonc` is:

```text
0 14 * * *
```

Cloudflare Cron Triggers run on UTC time, so change that if you want a different local posting hour. Cloudflare’s docs confirm Cron Triggers use a `scheduled()` handler and are configured in Wrangler, and that secrets should be stored as Worker secrets: [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/), [Workers KV](https://developers.cloudflare.com/kv/get-started/).

## Flyer Concepts

Starter flyer concepts are saved here:

[marketing/flyer-ideas.md](</C:/Users/shane/Documents/viper cleaning/marketing/flyer-ideas.md>)
