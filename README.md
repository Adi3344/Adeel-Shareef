# Adeel Shareef Portfolio Website

This is a one-page portfolio website built for deployment on Vercel.

## Contact form setup

The contact form stores submissions in Supabase and sends a notification email to `adeelshareef09@gmail.com` through Resend.

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
2. Create a Resend API key. For production, verify the sending domain and set `RESEND_FROM_EMAIL` to an address on that domain. The default `onboarding@resend.dev` sender is suitable for initial testing.
3. Add the variables from [`.env.example`](.env.example) to the Vercel project settings. Keep the Supabase service-role key server-side only.
4. Redeploy the Vercel project and submit a test inquiry from the live site.

Submissions remain in Supabase even if the email provider later has an outage, so they can be reviewed from the `contact_submissions` table.

## Portfolio assistant

The chat widget answers common portfolio questions with built-in responses. For natural-language AI replies, create a `.env` file from `.env.example` and add your `OPENAI_API_KEY`. `OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`.

```bash
copy .env.example .env
```

Then set:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

For Vercel, add the same variables in the project environment settings and redeploy. Keep the API key server-side; never add it to browser JavaScript.

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

This local server also serves the `/api/chat` endpoint so the portfolio assistant works during development.

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables from [`.env.example`](.env.example).
4. Deploy and test the contact form.
