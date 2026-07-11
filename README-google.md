# Google sign-in — Cloud Console checklist (~5 minutes)

1. console.cloud.google.com → create/select a project ("Vakilim").
2. APIs & Services → OAuth consent screen:
   - User type: External → app name "Vakilim.az", your support email,
     authorized domain: vakilim.az → Save. (Publishing status "Testing"
     works for you + listed test users; "Publish app" when ready for
     everyone — basic scopes need no Google review.)
3. APIs & Services → Credentials → Create credentials → OAuth client ID:
   - Type: Web application, name "Vakilim web"
   - Authorized redirect URIs — add BOTH, exactly:
       http://localhost:3000/api/auth/google/callback
       https://vakilim.az/api/auth/google/callback
4. Copy the Client ID and Client secret. Add locally to .env AND on
   Vercel (then Redeploy):

       GOOGLE_CLIENT_ID=....apps.googleusercontent.com
       GOOGLE_CLIENT_SECRET=GOCSPX-...
       NEXT_PUBLIC_GOOGLE_LOGIN=1

   The third variable is what makes the buttons appear.
5. Test on /az/login → "Google ilə davam et" → pick your account →
   you land signed in; /az/settings shows "Google bağlıdır ✓".

Linking rules (already enforced by the code):
- Same Google account always signs into the same Vakilim user.
- A Google email matching an existing account LINKS to it (and marks
  the email verified) — never a duplicate.
- Linking while logged in attaches Google to the current account;
  a Google identity already attached elsewhere is refused ("inuse").
