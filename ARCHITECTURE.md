# Architecture

Short overview of how the booking prototype is put together.

## Shape

One Next.js App Router app. Pages render on the server, mutations go through server actions, Postgres is reached via Prisma. There's no API layer; the only route handler in the app serves the `.ics` file, because a download isn't a page.

```
Browser
  query string  →  service, level, year, subject, slot
  cookie        →  contact details (httpOnly, 30 min)

Next.js
  src/app/book/     funnel pages + server actions
  src/app/admin/    bookings list
  src/lib/          booking, funnel, validation, payment, email, calendar
  src/components/   UI
  tests/            Postgres-backed, no mocks

Postgres
  Service, Slot, Booking
  Booking.slotId is UNIQUE
```

`src/lib/booking.ts` is the domain. It doesn't import `next/headers`, so the tests can call `createBooking` directly, and it could sit behind an HTTP API later without being rewritten.

## Funnel

1. **Service** - `/book` lists active services from the database.
2. **Level** - `/book/level` captures school level, year and subject from `src/lib/catalog.ts`. Those fields are stored on the booking. They don't change which times you see.
3. **Time** - `/book/slots` lists future slots with no booking attached.
4. **Details** - form posts to `saveDetails`, which validates, re-checks the slot, and writes an httpOnly cookie.
5. **Review** - server component reads the cookie and prices from the `Service` row.
6. **Payment** - `payAndBook` charges, then inserts. Decline writes nothing. Success creates a `PAID` row.
7. **Confirmation** - `/book/confirmation/[reference]`. Email is logged (not sent). Calendar is a Google link plus an `.ics` download, both built from the stored booking.

From details onward, every page runs the same preamble through `resolveFunnelStep`: re-parse the query string, reload the service and slot, re-price, and pick up the contact details. So if the time goes while a parent is filling in the form, they get a normal "that time is gone" message, not a 500. The contact details come back nullable rather than guaranteed, which is what stops a later step using them without deciding what to do when they're missing.

Selection lives in the URL so refresh works and pages stay server-rendered. Names, email and phone stay in the cookie so they don't leak into history or logs. The price is never in the request.

## Double-booking

Checking availability is a read. Any read-then-write leaves a gap, so the application does not try to win that race.

`Booking.slotId` is unique. Two rows for the same hour cannot be stored. `createBooking` treats a unique-constraint violation on `slotId` as `{ ok: false, reason: "taken" }` - an expected outcome, not an exception. A collision on the reference code is retried with a new code.

`tests/double-booking.test.ts` fires ten inserts at the same slot against real Postgres. Exactly one succeeds. A second test books twenty different slots at once and expects all twenty, because a constraint that rejected everything after the first booking would pass the first test just as happily.

There are no holds. A booking row exists only after payment. Abandoned forms don't occupy slots. The cost is that two people can reach Pay for the same time; the constraint decides.

## Integrations

Payment, email and calendar are local functions with the shape of a real vendor, not the vendor itself.

- `chargeCard` takes success or failure as an argument, so a decline is demonstrable on purpose.
- `sendEmail` logs the message. The request looks like Resend's `emails.send`.
- Calendar is a Google Calendar template URL and an RFC 5545 `.ics` file.

A declined charge writes nothing. Mail is sent after the row is committed; if it fails, the booking still stands.

## Admin

`/admin` lists every booking, split into upcoming and past, with a running total. It is unauthenticated in this prototype. The page is `force-dynamic` so it never serves a cached snapshot.

The upcoming-versus-past split sits in `src/lib/admin.ts` rather than in the page. Reading the clock during render is the kind of impurity a component shouldn't have, and moving it out made the boundary injectable, so "a session starting this instant counts as upcoming" is a test rather than a hope.
