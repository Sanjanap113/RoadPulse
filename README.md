# RoadPulse — Supabase-connected community road safety app

## 1. Configure Supabase

1. Open `supabase-config.js`.
2. Replace `PASTE_YOUR_SB_PUBLISHABLE_KEY_HERE` with the Publishable Key copied from Supabase → Project Settings → API Keys.
3. Keep the project URL as supplied. Do not put a `sb_secret_` key or service-role key in this file.
4. In Supabase → SQL Editor, open and run `supabase-setup.sql`.
5. Confirm the Storage bucket `road-photos` exists and is Public. Its file limit should be 5 MB and allowed MIME types should be JPEG, PNG and WebP.
6. In Authentication → URL Configuration, set Site URL to `http://127.0.0.1:5500` and allow both `http://127.0.0.1:5500/**` and `http://localhost:5500/**`.

## 2. Run locally

1. Extract this folder.
2. Open the `RoadPulse` folder in VS Code.
3. Open `index.html` with Live Server.
4. Use the URL shown by Live Server. The Supabase redirect URLs above assume port `5500`; if Live Server uses another port, add that exact localhost URL to Supabase URL Configuration.

## 3. First user and administrator

- Create a resident account through the Register page.
- Confirm the email using the message Supabase sends, then sign in.
- To create the administrator, register a separate account using the email you want as the admin and confirm it.
- In Supabase SQL Editor, run the final `UPDATE public.profiles` statement shown at the bottom of `supabase-setup.sql`, replacing `YOUR_ADMIN_EMAIL` with that account's email. Then sign out and sign in again. The Admin panel will appear for that account.
- Never use a hard-coded admin password in browser JavaScript. Admin privileges are stored in `profiles.role` and enforced by Row Level Security.

## Included connected features

- Supabase email/password registration, confirmation and login.
- Supabase session-based sign-out and user profile.
- Public report feed and per-user dashboard.
- Authenticated report submission with optional photograph upload to `road-photos`.
- Community confirmations stored per user (one per report).
- Admin-only status updates and admin/owner report deletion.
- Priority ordering based on severity, confirmations, recency and unresolved status.
- Existing RoadPulse design, slides, responsive layout and light/dark themes retained.

## Notes

- The browser uses only the Supabase Publishable Key. Never expose a Secret Key or service-role key.
- If email confirmation is enabled, registration displays a message asking the user to check their inbox. The user must confirm the address before signing in.
- This frontend loads all community reports and confirmation rows for the project. For a larger production deployment, add pagination and server-side aggregation.
- Existing demo reports in the old browser localStorage are intentionally not migrated; the live feed reads the shared Supabase database.
