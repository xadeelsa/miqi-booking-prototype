# Architecture

How the booking prototype is put together. Setup and limitations are in [README.md](./README.md).

## Shape

One Next.js App Router application. Pages render on the server, mutations go through server actions, and Prisma talks to Postgres. There is no API tier; the only route handler serves the `.ics` download.

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

`src/lib/booking.ts` is the domain. It doesn't import `next/headers`, so the tests call `createBooking` directly, and it could sit behind an HTTP API later without being rewritten.

## Funnel

1. **Service.** `/book` lists the active services from the database.
2. **Level.** `/book/level` collects school level, year and subject from `src/lib/catalog.ts`. These are recorded on the booking; they don't affect which hours are free.
3. **Time.** `/book/slots` shows future slots that nobody has booked.
4. **Details.** `saveDetails` validates the form, re-checks that the slot is still there, and puts the contact details in an httpOnly cookie.
5. **Review.** A Server Component reads the cookie and prices the session from the `Service` row.
6. **Payment.** `payAndBook` charges first. A decline writes nothing; a success inserts a `PAID` booking.
7. **Confirmation.** `/book/confirmation/[reference]` shows the booking with a Google Calendar link and an `.ics` download, both built from the stored row.

From the details step onward, `resolveFunnelStep` runs first on every page load. It parses the query string, re-fetches the service and slot, re-prices, and reloads the cookie. A parent whose slot went while they were typing gets the ordinary "slot taken" screen rather than an error. `details` comes back nullable, so a page cannot use it without first deciding what to do when it's missing.

The selection lives in the URL, which keeps every step refreshable and server-rendered. Contact details do not, because a name, an email and a phone number in a query string end up in browser history, `Referer` headers and access logs. The price is in neither. It is read from the `Service` row every time it is needed.

## Double-booking

`Booking.slotId` is UNIQUE, and that constraint is the entire guarantee.

Availability is checked before every write, but a check and an insert are two separate statements, so two parents can both pass the check for the same hour. Nothing closes that window. A hold would only move the problem, since a hold is itself a row somebody has to expire. So the write is allowed to race, and Postgres refuses the second one.

`createBooking` treats that refusal as an expected outcome rather than an exception. A `slotId` violation returns `{ ok: false, reason: "taken" }` and the caller shows the slot-taken screen. A collision on the reference code is different: nothing is wrong with the booking, so it retries with a new code.

`tests/double-booking.test.ts` fires ten concurrent bookings at one slot against real Postgres and asserts that exactly one wins and the other nine come back with a reason. A second test books twenty different slots concurrently and asserts all twenty succeed, which catches the opposite failure: a constraint that rejected everything would pass the first test just as well.

## Integrations

Payment, email and calendar are local functions shaped like the real thing.

- `chargeCard` takes the outcome as an argument, so the decline path is repeatable rather than random.
- `sendEmail` mirrors `resend.emails.send` and writes the message to the server log.
- The calendar hand-off is a Google Calendar template URL and an RFC 5545 `.ics` file, both generated from the stored booking.

A declined charge writes nothing. The email goes out after the row is committed, so a mail failure leaves the booking intact.

## Admin

`/admin` lists every booking, split into upcoming and past with a count. There is no login. The page is `force-dynamic`, because a booking list is worth nothing if it is a snapshot from build time.

The split lives in `src/lib/admin.ts` rather than in the component, and takes `now` as an argument. One clock read means both halves are measured against the same instant, and a session starting this second lands in exactly one of them. It also makes the boundary testable, which is how `tests/happy-path.test.ts` pins it down.
