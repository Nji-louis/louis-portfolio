# Louis Portfolio — Lead Management Platform

Responsive portfolio website plus a custom PostgreSQL-backed lead system, private admin dashboard, email notifications, and WhatsApp Cloud API notifications.

## What is included

- Existing portfolio pages, services/pricing, images and assets.
- Public enquiry form that sends validated JSON to `POST /api/leads`.
- PostgreSQL schema for leads, status pipeline, quote values, follow-up dates, notes and notification delivery states.
- Private dashboard at `/admin` with username/password authentication, summary metrics, search/status filters, editable lead status, quote amount, follow-up date and notes.
- Email notifications over SMTP and WhatsApp notifications through Meta's Cloud API. Notification failures are logged and recorded; the lead is saved first and is not lost if a provider is unavailable.
- Basic request rate limits, input limits, security headers, parameterized SQL and HttpOnly/SameSite admin cookie.
- Existing Excel lead CRM retained as a manual/offline backup.

## Run locally

Requires Node.js 20+ and a PostgreSQL database.

1. Copy `.env.example` to `.env` and fill the required values.
2. Generate a password hash: `node -e "require('bcryptjs').hash('YOUR_LONG_PASSWORD', 12).then(console.log)"`; paste the result into `ADMIN_PASSWORD_HASH`. Do not use the example password literally.
3. Generate a JWT secret with `openssl rand -base64 48`.
4. Install and start:

   ```sh
   npm install
   npm run check
   npm start
   ```

5. Open `http://localhost:3000` for the website and `http://localhost:3000/admin` for the dashboard.

The server creates the tables in `server/schema.sql` at startup. The database user needs permission to create tables and indexes. Use a dedicated production database and backup policy.

## Production deployment

Deploy as a Node web service (for example, Render or Railway) with a managed PostgreSQL database. Do **not** deploy this version as a static-only Netlify site: the `/api` endpoints require the Node server. Set the environment variables from `.env.example` in the hosting provider's secret/environment settings; never commit `.env`.

Required: `DATABASE_URL`, `JWT_SECRET` (random, 32+ characters), `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`. Set `NODE_ENV=production`, `DATABASE_SSL=true` when required by the managed DB, and configure trusted proxy only when the host is behind its proxy. Enable HTTPS and confirm cookies are Secure.

### Email

Configure valid SMTP host, port, username, password, sender, and `NOTIFY_EMAIL`. Send a real test enquiry and verify the admin inbox and spam folder. Use a sender/domain authenticated with SPF/DKIM where possible. `SEND_LEAD_ACK=true` sends a separate acknowledgement to the prospect.

### WhatsApp

1. Configure a Meta business app and WhatsApp Cloud API sender.
2. Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_NOTIFY_TO` (international format, digits only).
3. For reliable business-initiated alerts, create and get approval for a WhatsApp message template in Meta, then set `WHATSAPP_TEMPLATE_NAME` and `WHATSAPP_TEMPLATE_LANG`. The template must have five body text parameters in this order: lead name, service, budget, timeline, lead ID. Ensure the approved template's placeholder count and order match.
4. Send a test enquiry and check the dashboard's notification states and server logs. Meta may reject free-form text messages outside the 24-hour customer-service window; an approved template is recommended.

Email and WhatsApp notifications are independent. A provider failure does not delete the lead. The dashboard exposes each notification's state. Do not paste access tokens into chat, source code, screenshots, or the repository.

## Admin dashboard

- Sign in at `/admin`.
- Lead statuses: new, contacted, qualified, quoted, negotiation, won, lost, not_fit.
- Set quote amount in XAF and a next follow-up date; add internal notes.
- Leads are searchable by name, email, service or message. The list endpoint is capped at 500 newest records.
- The dashboard is an initial single-admin implementation. For a team, add role-based access, audit logs, pagination, MFA and explicit backup/retention policies before broad rollout.

## Security and privacy checklist before going live

- Use HTTPS; set strong unique credentials and a long random JWT secret.
- Keep SMTP and Meta secrets only in hosting environment variables.
- Configure database backups and restrict database network access.
- Publish a privacy notice that identifies the data collected, purpose, retention period, and service providers. Limit staff access and delete data when no longer needed.
- Configure a suitable CAPTCHA/anti-bot provider if spam appears. Rate limiting and the hidden honeypot are basic protections, not complete abuse prevention.
- Test login, logout, invalid credentials, lead creation, database outage behavior, and both notification channels before launch.

## Existing files

`Louis-Portfolio-Lead-CRM.xlsx` remains included as an offline spreadsheet backup. The live dashboard uses PostgreSQL and does not currently import that workbook automatically.
# louis-portfolio
