Sentry (optional error monitoring) — enable in 4 steps:
1) Create a free project at sentry.io (platform: Next.js), copy its DSN.
2) In the project folder:  npm install @sentry/nextjs
3) Move the two files from this folder into the project ROOT and
   RENAME them to drop the .txt suffix:
     instrumentation.ts.txt        -> instrumentation.ts
     instrumentation-client.ts.txt -> instrumentation-client.ts
4) Add to .env and to Vercel env:
     SENTRY_DSN=...
     NEXT_PUBLIC_SENTRY_DSN=...
The .txt suffix keeps TypeScript from compiling these files before the
package is installed — do not skip the rename.
