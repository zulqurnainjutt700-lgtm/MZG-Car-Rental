# MZG accounts, bookings and owner setup

## Run locally

Requires Node 24+ (built-in SQLite), npm dependencies and persistent private storage.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` in this project.
3. Leave PUBLIC_ORIGIN=http://127.0.0.1:3000 and SECURE_AUTH_COOKIES=false for local HTTP.
4. Run `npm start` and visit http://127.0.0.1:3000/.

Accounts, hashed sessions, hashed verification/reset tokens, booking requests and history are in `.private/mzg.sqlite`. The first start migrates the existing `.private/accounts.json` once; IDs and passwords are retained. Do not delete or publish `.private`. The JSON recovery file is no longer written. Back up the database with a SQLite-aware backup or while the server is stopped (include any WAL/SHM files if copying an active database). Use one Node instance with this local SQLite deployment.

## Enable actual email delivery

Set these only in your local `.env` or hosting secret manager:

- SMTP_HOST: your provider's SMTP hostname.
- SMTP_PORT: 587 for STARTTLS, or 465 for implicit TLS.
- SMTP_SECURE: false for 587, true for 465.
- SMTP_USER and SMTP_PASS: provider credentials/app password.
- SMTP_FROM: verified sender address, for example `MZG Car Rental <your-verified-address@example.com>`.
- PUBLIC_ORIGIN: exact website origin used by customers. For local tests, links point to this computer's localhost and cannot be opened from another device.

TLS certificate validation remains enabled. Do not paste credentials into chat, source files or Git. The `.env` file is ignored. Restart after configuration, then run `npm run check:smtp` to check the connection. Verify your sending identity/DNS with the chosen provider, and perform a real signup/resend/reset test using an email address you control. Connection verification alone does not prove inbox delivery.

With no SMTP configuration, accounts and Pending rental requests work, but emails are not sent. The UI reports that setup is required. It never marks email as verified or presents a fabricated delivery success. Forgot-password responses do not reveal whether an account exists; reset delivery is attempted asynchronously.

Verification links expire after 24 hours, reset links after 30 minutes. New links replace previous links of the same purpose. Password reset/change revokes all sessions. Email changes keep the existing address until the new address is verified and then require sign-in again. Sessions also expire after seven days absolute / two hours idle. A restart preserves unexpired sessions.

## Owner / administrator

1. Create your own account through Sign Up.
2. In the trusted project terminal, run `node manage-admin.cjs promote YOUR-ACCOUNT-EMAIL`.
3. Sign in again. Use Owner Review in your account menu or `/admin.html`.
4. To remove access: `node manage-admin.cjs demote YOUR-ACCOUNT-EMAIL`.

There are no default admin credentials and no public role-assignment API. Registering an account never grants administrator access. The role command revokes that account's existing sessions.

Owner Review supports a customer-visible quotation, recorded prepaid amount, rental terms and state transitions: Pending → Confirmed/Cancelled, Confirmed → Active/Cancelled, Active → Completed. Confirmation requires a final quotation and notes explaining availability, deposit, insurance/excess and terms. Overlapping confirmed/active rentals of the same car entry are blocked. Multiple physical vehicles of one model would require separate inventory entries in a future inventory expansion. Past/terminal states cannot be arbitrarily reopened.

Payments are not collected online. Prepaid amounts are owner-entered records of rental money already received. MZG must process payments/refunds directly. Pending requests can be cancelled free; Confirmed requests can be cancelled online before pickup, with the configured 24-hour rule and fee capped at recorded prepaid rent. Active/Completed rentals require contacting MZG. Every cancellation and owner change has an event history. Customer IDs and quotes/statuses cannot be changed through customer APIs.

## Public hosting requirements

Use a persistent Node service, HTTPS, a public domain and PUBLIC_ORIGIN=https://your-domain. Set SECURE_AUTH_COOKIES=true. Terminate TLS at a trusted reverse proxy and keep the Node service private. Do not use static-only hosting for account/booking APIs. Protect the private database and backups at the OS/hosting level. Add provider monitoring, backups and abuse protection appropriate to your hosting. The application does not trust client-supplied forwarding IP headers. Review existing rental prices, availability, insurance and business terms before accepting confirmed rentals.

## Checks

- `npm test`: account/booking integration, site links, preserved assets.
- `npm run check:smtp`: actual configured SMTP connection check; never prints credentials or sends an email.
- `npm audit --omit=dev`: dependency advisory check.

Integration tests create temporary test storage and use a capture transport for verification/reset links. They do not send real email or change customer accounts. They cover migration, role/ownership protection, booking data, cancellations, photos, session persistence, token expiry/replay and sensitive account changes. Browser checks are reported separately in the delivery message.
