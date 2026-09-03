# AI usage statement

I planned this app with **Claude Code** before writing any of it. I followed a normal SDLC rather than jumping straight to code.

Scope first: a parent-facing booking funnel, with payment, email and calendar mocked, on made-up data. Then the technical approach: one Next.js app, Postgres, and the unique constraint as the double-booking guarantee. Then an order to build it in, so each commit left something that worked: data model, read steps, write path, payment, confirmation, admin, tests, docs. The concurrency test was planned alongside the booking write, so the mechanism and the proof of it landed together rather than the proof arriving weeks later.

I also used AI to exercise the flow: a successful booking, a declined payment, a slot that was already taken, and the automated suite against Postgres.

It earned its keep on the tedious, checkable work. RFC 5545 line folding is fiddly and the spec counts octets rather than characters, which matters the moment a Dutch name brings an accent with it; that got written quickly and then verified by round-tripping a deliberately awkward subject through Mozilla's `ical.js`. Zod schemas and the shape of a Resend request were the same kind of job.

What I didn't do was take it at its word. Anywhere it told me something worked, I went and looked: the concurrency test was confirmed by deleting the constraint handling and watching a real Postgres error come back, and the rest of the suite by breaking the code on purpose, ten different ways, to check the tests actually went red. A test that has never failed hasn't been tested. It was also wrong at least once in a way that mattered less than it looked: an assertion about a blank phone number turned out to describe my expectation rather than the schema, and the database settled it.

The design calls are mine. Create the booking only after payment, keep the price on the server, put contact details in a cookie instead of the URL, and let the database refuse a double booking rather than asking application code to prevent one. AI was a planning and verification partner, not a substitute for reading the code or deciding how the thing should work.
