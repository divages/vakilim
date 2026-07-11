# Sign in with Apple — readiness note

The black button is already in the code, hidden behind
NEXT_PUBLIC_APPLE_LOGIN. Apple's flow needs four values that only an
Apple Developer Program membership ($99/yr) can produce:

1. developer.apple.com → enroll (company or individual).
2. Certificates, IDs & Profiles → Identifiers → App ID (e.g.
   az.vakilim.web) with "Sign in with Apple" capability.
3. Identifiers → Services ID (this is the web client_id), enable
   Sign in with Apple → configure: domain vakilim.az + return URL
   https://vakilim.az/api/auth/apple/callback (Apple requires HTTPS —
   no localhost; production-only testing).
4. Keys → create a key with "Sign in with Apple" → download the .p8
   once, note the Key ID and your Team ID.

When you have: TEAM_ID, KEY_ID, the .p8 contents, and the Services ID —
say the word and the L4-apple sprint builds the routes (Apple signs its
client secret as an ES256 JWT and posts back via form_post, so the
callback differs from Google's). Until then the button stays hidden and
nothing references Apple at build time.
