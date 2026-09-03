# MIQI Booking

Prototype booking flow for **MIQI Huiswerkbegeleiding**. A parent chooses a service, tells us the school level and subject, picks a time, pays, and gets a confirmation they can add to their calendar.

It's one Next.js app talking to Postgres. The data is made up. Payment, email and calendar are mocked, nothing is charged and nothing is actually sent.

You can walk the full funnel today: service → level → time → details → review → payment → confirmation. There's also an admin bookings list at `/admin` (no login in this prototype).

How it's put together: [ARCHITECTURE.md](./ARCHITECTURE.md). How I used AI: [AI.md](./AI.md).

## Setup

You need **Node 22** and **Postgres**. That's what CI runs, on Postgres 16.

### Database

Create an empty database, copy `.env.example` to `.env`, and set `DATABASE_URL`.

With Docker:

```bash
docker run --name miqi-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=miqi_booking \
  -p 5432:5432 -d postgres:16
```

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/miqi_booking?schema=public"
```

On a Mac with Homebrew Postgres, the superuser is usually your macOS username and there's no password:

```bash
createdb miqi_booking
```

```
DATABASE_URL="postgresql://YOUR_MACOS_USER@localhost:5432/miqi_booking?schema=public"
```

### Install and run

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev                 # http://localhost:3000
```

The seed can be run more than once. It adds three services (Bijles 1-op-1, Huiswerkbegeleiding, Examentraining), weekday afternoon slots for the next couple of weeks, and two example bookings so a few times already look taken.

### Click through it

1. Open [http://localhost:3000](http://localhost:3000) and start a booking.
2. Pick a service, level / year / subject, and a time.
3. Fill in contact details. On the payment page, **Simulate a declined payment** leaves the slot free; **Pay** actually creates the booking.
4. From confirmation you can add it to Google Calendar or download an `.ics` file. The email is printed in the **terminal**, not delivered.
5. Open [/admin](http://localhost:3000/admin) to see the booking on the list.

### Tests

```bash
npm test
```

Four files: the validation boundary, what counts as a bookable slot, the double-booking guarantee, and one booking walked from query string to admin list.

They use the same `DATABASE_URL` as the app, which on your machine is probably the database you've been clicking through by hand. Fixtures keep out of the way by living in windows the seed never touches: slots beyond 2098, history before 2000, and service slugs with a reserved prefix. They're cleared before each test rather than after, so a run that dies half way through can't poison the next one.

CI runs lint, typecheck and the suite against a fresh Postgres on every push and pull request.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Full test suite (needs Postgres) |
| `npm run db:migrate` | Apply migrations (dev) |
| `npm run db:deploy` | Apply migrations (CI / production) |
| `npm run db:seed` | Seed services, slots and example bookings |
| `npm run db:reset` | Drop, migrate, re-seed |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |

## Technical choices

I kept this as **one Next.js app** instead of Laravel with a separate frontend, or FastAPI with a SPA. The product is a short wizard and one careful write to the database. Splitting into two services here would mostly add CORS, two deploys, and a type contract to keep in sync. Laravel would be a fair default in a PHP shop, but the UI is React and App Router already gives you server-rendered pages and server actions. The booking logic lives in `src/lib/` and doesn't import `next/headers`, so it could sit behind an API later if that ever became necessary.

**Postgres + Prisma.** The important rule is in the schema: `Booking.slotId` is unique. The database will not store two bookings for the same hour. App-level locks still come down to hoping the application serialises something Postgres can just refuse.

**Create the booking only after payment.** If someone abandons the form, the slot stays free. There's no hold, no expiry job, no "reserved" state. The trade-off is that two people can reach the pay button for the same time; the unique constraint decides who gets it.

**The price always comes from the `Service` row**, including on the insert. It never travels in the URL or the form, so it can't be edited in the browser.

**Most of the funnel is in the query string** (service, level, year, subject, slot). Refreshing a step works, and the pages stay server-rendered. Names, email and phone go in an httpOnly cookie instead, putting those in the URL would leak them into history, `Referer` headers and logs. Zod checks everything that hits the server, including values the dropdowns offered.

**Tests run against real Postgres.** The thing we're proving is a unique constraint. Mocking Prisma would only prove the mock.

The UI is Tailwind. Payment is a fake charge with Mollie/Stripe in mind (iDEAL, given a Dutch customer base). Email is shaped like Resend's `emails.send`, so replacing the mock should be an import and an API key, not a rewrite.

## Limitations

This is a prototype, and it shows:

- Payment, email and calendar are fake. The charge is instant, so you never hit the awkward real-world case of "paid, but the slot was taken, now refund them."
- One tutor, one calendar. Slots are a seeded grid. Level, year and subject are stored, but they don't affect price or who can take the hour.
- No holds. Two people can sit on Pay for the same time; one of them loses when the row is written.
- No login, no cancel or reschedule. Anyone with the confirmation URL can see the booking. `/admin` lists every booking, including parent contact details, and is not gated.
- `PENDING` and `FAILED` payment statuses exist on the model but nothing writes them. We only insert `PAID`. Failed attempts would need their own table so they don't occupy a slot.
- Contact details live in a 30-minute cookie until pay. If it's gone or looks wrong, we send you back to the form.
- The tests stop at the server. Validation, availability, the concurrency guarantee and a whole booking are covered, but nothing drives a browser, so clicking, the details cookie and the redirect after payment are only ever checked by hand.

## Next steps

If this went further, I'd do these in roughly this order:

1. Real payments (Mollie or Stripe, iDEAL), with an idempotency key, and a refund if we charge someone and then lose the slot.
2. Real email through the existing `sendEmail` shape, on a queue rather than awaited in the request.
3. Put `/admin` behind a login, and add cancel / move.
4. Signed confirmation links, or a parent account, so the reference isn't the only key.
5. Multiple tutors and real availability, so subject actually matters.
6. A log of payment attempts that doesn't hold a slot, if we need to see failed charges.
7. A browser test, probably Playwright, for the parts only a browser exercises: the cookie, the redirect, the back button.
