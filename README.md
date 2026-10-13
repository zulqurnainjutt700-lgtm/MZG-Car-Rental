# MZG Car Rental

A responsive website for MZG Car Rental in Lahore, using DM Sans, orange accents, white layouts and dark feature sections.

## Preview

Run `npm start`, then open `http://127.0.0.1:3000/`.

There is no build step. HTML, CSS, JavaScript, fonts and images are served locally. The dedicated catalogue is `/fleet.html`.

## Pages

- Home: `index.html`
- 24-car catalogue with filters, model search, sorting and estimates: `fleet.html`
- About MZG: `about.html`
- Contact form with an editable message preview before opening WhatsApp: `contact.html`
- Daily, weekly, monthly, airport and delivery information: `rental-plans.html`
- Privacy notice: `privacy-policy.html`
- Website and rental information terms: `terms-and-conditions.html`
- Photo creators, source files and licences: `image-credits.html`

## Content

Phone and WhatsApp: +92 302 5184681. Email: contact.zulqurnain@gmail.com. Service location: Lahore, Punjab, Pakistan. An exact office address and business hours have not been supplied.

`fleet.json` contains 24 model options with indicative PKR daily rates. Every fleet card uses an AI-generated black-car illustration on white with soft ground shadows. These are not photographs of confirmed stock. Visitors choose a car, dates, pickup/return times or any whole number of days. Estimates round each started 24-hour period up to one rental day. The review shows rental, refundable deposit and pooled mileage separately. Actual availability and final itemised price require MZG confirmation.

`rental-policy.json` defines MZG's chosen category deposits, 200 km/day allowance and extra-km charges. The rental policy page includes cancellation, refunds, fuel, eligibility and vehicle-specific insurance disclosure requirements. Insurance cover/excess must be checked against the actual vehicle's policy before payment.

The enquiry form does not submit to a backend or store personal information. It first shows a review, then lets the visitor open WhatsApp and send the prepared message themselves. The site does not collect payments or automatically confirm reservations.

The homepage hero uses the owner-supplied Lahore skyline and car image across the full hero, with readable text over it. It does not load the previous Three.js renderer. Booking/contact previews display animated request-ready feedback; hero CTA and form focus use restrained orange highlights with reduced-motion support. Its photographic category row opens filtered views of the separate fleet page.

## Checks

Run `node verify-site.cjs` to validate page links, contact details, images and the separate fleet structure. Browser checks cover mobile layout, full image loading, filtering, estimates and enquiry previews.

The public pages can be hosted statically, but account registration/sign-in require the Node server and private storage. Do not expose auth.cjs, test scripts, or the .private directory as public files. Verify actual fleet availability, insurance and prices before confirming rentals.

## Customer accounts and rental requests

The existing custom Node backend now uses private SQLite storage, with one-time migration of legacy JSON users. Shared authentication powers login, signup, dashboard, profile, bookings, settings and owner review. Sessions survive refresh and server restart. New rental requests are always Pending; quotations and status updates belong to authorised owners. The contact-only enquiry form still prepares a WhatsApp message.

Read [AUTH_AUDIT.md](AUTH_AUDIT.md) for the original-code audit and [ACCOUNT_SETUP.md](ACCOUNT_SETUP.md) for SMTP, admin-role setup, local running instructions, production requirements and tests. Run `npm test`. No default administrator or fabricated email delivery is provided.
