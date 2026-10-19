# SpeakDaily

Two minutes of English speaking practice, every day. Pick the daily topic,
record yourself, and get instant feedback on pace, filler words, vocabulary
variety and fluency — plus a replay of your recording and your recent history.

## Stack

- Vite + React
- Supabase (auth + Postgres + row-level security)
- Web Speech API (in-browser transcription) + MediaRecorder (audio capture)

## Feedback

Analysis runs entirely on-device from the transcript: words-per-minute pace,
filler-word detection (um, uh, like, "you know"), vocabulary diversity, sentence
length and talk time combine into a 0–100 score with specific tips. No audio or
transcript leaves the browser except the summary metrics saved to your account.

## Setup

1. `npm install`
2. Run `db/schema.sql` once in your Supabase SQL Editor (creates `profiles` and
   `sessions`, RLS policies, and a signup trigger).
3. Create `.env`:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-publishable-key
   ```
4. `npm run dev` (use Chrome or Edge — speech recognition requires them).

## Deploy

The included GitHub Actions workflow builds and publishes to GitHub Pages.
Set the two `VITE_SUPABASE_*` env values in the workflow (or repo secrets).
