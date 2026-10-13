# Authentication audit — 13 October 2026

## Existing implementation

The project is buildless HTML/CSS/JavaScript served by a custom Node HTTP server. It does not use Firebase, Supabase, a CMS or a frontend routing framework. Fonts, brand assets and car images are local. `auth.cjs` created accounts in `.private/accounts.json` with salted scrypt passwords, and kept cookie-backed sessions in a process-local Map. Refresh preserved a session but restarting Node invalidated every session. The header always showed Sign Up and Find a car regardless of authentication. `signup.html` combined registration/sign-in; no distinct login route existed. The fleet only prepared WhatsApp text. No bookings were stored, no customer dashboard/profile/admin APIs existed, and email verification and password recovery were explicitly unavailable. No SMTP environment settings or provider dependencies were configured. One legacy account was present; its personal details were not printed during the audit.

## Enhancement

The custom backend and HTML stack are retained. Private SQLite storage replaces JSON as the single active account database, with a one-time, transactional legacy-account migration. The old JSON file is retained as a private recovery copy. Existing scrypt hashes remain usable and are upgraded after successful sign-in. Sessions persist as hashed cookie tokens, with seven-day absolute and two-hour idle limits. Private HTML pages and customer/admin APIs enforce server-side authentication and ownership. Customer-submitted identity, rate, quote, status and role fields cannot grant authority or alter prices.

Shared header behavior lives in assets/account-auth.js; no localStorage value proves identity. Login, signup, recovery, verification, customer dashboard/profile/bookings/settings and owner review use the same backend. Counts are derived from the signed-in customer's stored booking rows. Car cards and original branding/images/content are preserved. Booking drafts use short-lived sessionStorage only to resume a form after login; drafts never authorize a request.

## Email boundary

SMTP delivery uses Nodemailer with TLS certificate validation and environment configuration. No credentials, verification links or reset tokens are hardcoded or returned to browsers. Tokens are random, stored hashed, expire and are single-use. Email change requires password re-authentication and verification of the new address. The current address remains until verification; sessions are then revoked. A missing provider is explicitly reported. Live SMTP delivery cannot be verified until the owner configures a provider. Tests use an isolated capture transport to check link contents and token endpoints; this is not production email delivery.

## Tests

`verify-auth.cjs` exercises an isolated database and generated test accounts. `verify-site.cjs` checks page links and assets. `verify-hero.cjs` preserves hero/car assets. See ACCOUNT_SETUP.md for external setup, owner access and deployment boundaries. No production security certification is claimed.
