# Production deployment — custom lead dashboard

This build requires a Node.js web service and PostgreSQL. A static-only deployment cannot run the API.

1. Provision managed PostgreSQL and a Node.js 20+ web service.
2. Deploy the repository/project root and run `npm install`; start command: `npm start`.
3. Set `DATABASE_URL`, `DATABASE_SSL=true` (if required), `JWT_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD_HASH` in the host's environment settings.
4. Configure SMTP environment variables for email notifications.
5. Configure Meta WhatsApp Cloud API credentials and an approved template for notifications outside the 24-hour customer-service window.
6. Enable HTTPS. Set `NODE_ENV=production` and `TRUST_PROXY=true` only if the service is behind the platform's trusted reverse proxy.
7. Open `/admin`, sign in, and submit a test enquiry through the public contact form.
8. Verify that the lead appears in the dashboard and that both email and WhatsApp arrive. Check each notification status in the dashboard and server logs if one fails.
9. Configure database backups, privacy notice, retention, domain DNS and monitoring before public launch.

Do not use the old Netlify Forms configuration for this version. The contact form now posts to `/api/leads`.
