# AI usage statement

I used **Claude Code** to help plan the app before writing it, and I followed a normal SDLC instead of jumping straight to code.

That meant agreeing the scope first (a parent-facing booking funnel, mocked payment/email/calendar, mock data), then the technical approach (one Next.js app, Postgres, the unique constraint as the double-booking guarantee), then an implementation sequence: data model, read steps, write path, payment, confirmation, and only then polish and docs. The concurrency test was planned alongside the booking write, so the mechanism and the proof of it landed together.

I also used Claude to help run the flow end to end: a successful booking, a declined payment, and a slot that was already taken, plus the automated concurrency suite against Postgres.

The design calls and logic stayed mine. Claude was a planning and verification partner, not a substitute for reading the code or deciding how the system should work.
