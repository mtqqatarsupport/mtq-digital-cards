# MechaTronics Digital Business Cards

A portal for creating and managing NFC / QR digital business cards.

- **Public card** at `https://<your-domain>/<name>`: portrait, name, role, **Save my contact** (vCard with photo), Share, QR code with logo, Call / WhatsApp / Website / Directions.
- **Admin portal** at `/admin`: add, edit, switch off or delete cards, upload photos, live phone preview, print-ready QR codes (PNG/SVG), company branding, activity log.
- **Sign-in:** Google only, limited to **christianmarana@gmail.com** and **mtqqatarsupport@gmail.com**.
- **Stack:** Next.js 15 on **Vercel**, with **Firebase** (Firestore database + Google sign-in). Everything fits in Firebase's free *Spark* plan.

---

## Part A: Set up Firebase (≈10 minutes)

1. **Create the project.** Go to [console.firebase.google.com](https://console.firebase.google.com) → **Create a project**, name it e.g. *mtq-digital-cards*. Google Analytics is optional (you can turn it off).

2. **Create the database.** Go to **Build → Firestore Database → Create database**.
   - Edition: **Standard**
   - Location: **europe-west3 (Frankfurt)**. This matches the Vercel region in `vercel.json`, and it can't be changed later.
   - Start in **production mode**.
   Then open the **Rules** tab, replace everything with the contents of `firestore.rules` from this project, and click **Publish**. This blocks all direct browser access. Only the website's server can read or write.

3. **Turn on Google sign-in.** Go to **Build → Authentication → Get started → Sign-in method → Google → Enable**, choose your support email, and **Save**.
   Then open **Settings → Authorized domains → Add domain** and add your Vercel address (e.g. `mtq-cards.vercel.app`), plus your own domain later if you use one.

4. **Register a web app.** Go to **Project settings (⚙) → General → Your apps → `</>` (Web)**. Give it a nickname and register it. **Don't** tick Firebase Hosting. From the config it shows, copy `apiKey`, `authDomain`, `projectId` and `appId`.

5. **Create the server key.** Go to **Project settings → Service accounts → Generate new private key**, which downloads a `.json` file.
   ⚠️ This file is a master key to your database. Don't email it, don't commit it to GitHub, and delete it from your Downloads once it's in Vercel.

## Part B: Deploy on Vercel

1. Push this folder to a **private** GitHub repository:
   ```bash
   git init && git add . && git commit -m "Initial commit"   # (already done if you used the zip)
   git branch -M main
   git remote add origin https://github.com/<you>/mtq-digital-cards.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import the repo.
3. Before deploying, open **Environment Variables** and add:

| Name | Where to find it |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | open the downloaded .json file in Notepad, copy **everything** (`{` to `}`), paste as the value |
| `FIREBASE_WEB_API_KEY` | `apiKey` from step A4 |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` from step A4 (e.g. `mtq-digital-cards.firebaseapp.com`) |
| `FIREBASE_WEB_APP_ID` | `appId` from step A4 |
| `APP_URL` | your site address without a trailing slash, e.g. `https://mtq-cards.vercel.app` |

4. Click **Deploy**. Then open `https://<your-domain>/api/health`. It should say `"ok": true`. If not, it names the setting that's missing or wrong (it never shows secret values). After changing any variable, **redeploy**: Vercel only picks up new values on a new deployment.
5.  When it's live, make sure that exact domain is in Firebase's **Authorized domains** (step A3).
6. Open `https://<your-domain>/admin/login`, click **Continue with Google**, and pick one of the two approved accounts.

## Part C: Use it

- **Branding:** the MechaTronics logo is built in. Check the company name, office phone, address and button colour here.
- **Cards → New card:** add the photo, name, position, department badge (e.g. *IT*) and mobile. WhatsApp, email and LinkedIn are optional.
- Each card's page shows its **link and QR** (PNG/SVG downloads, with the logo).
- **NFC tag:** in **NFC Tools** (iOS/Android) go to *Write → Add a record → URL*, paste the card link, then *Write*. Test it before you **lock** the tag, because locking is permanent. Editing a card never changes its link, so tags keep working. Only changing a card's *link name* breaks tags already written.
- **Custom domain (optional):** add it in Vercel → Settings → Domains, add it to Firebase **Authorized domains**, update `APP_URL`, and redeploy.

### Changing who can sign in
Edit `src/lib/admins.ts`, then commit and push. Vercel redeploys automatically. The list lives in the code on purpose, so nobody can give themselves access from inside the portal.

---

## Security built in

| Area | What's done |
|---|---|
| Sign-in | Google only, through Firebase Auth. The server verifies Google's token signature, requires a **verified** email on the **allow-list** and a sign-in less than 5 minutes old, then issues its own session |
| Allow-list | Checked at sign-in **and on every admin request**. Anyone else is refused, logged in Activity, and their Firebase user record is deleted |
| Sessions | Firebase session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefix, 8-hour expiry, checked against Firebase for revocation on each request. **Sign out** revokes every device |
| Browser | Firebase is kept in memory only (no login token left in browser storage) |
| CSRF | Session endpoint accepts only same-origin JSON POSTs. Server Actions are same-origin only |
| Database | Firestore rules deny all client access. Only the server's service account can read or write, and its key lives only in Vercel |
| XSS / clickjacking | Strict nonce-based Content-Security-Policy (Google domains allowed on the login page only), only `http(s)` links accepted, hex-validated colours, admin pages can't be framed |
| Uploads | 4 MB cap, type allow-list, every image **decoded and re-encoded** (strips EXIF/GPS, SVG scripts, hidden payloads) |
| Headers | HSTS (preload), `nosniff`, strict Referrer-Policy, Permissions-Policy, COOP |
| Privacy | Staff list never public, cards `noindex`, `robots.txt` disallows all, switched-off cards return 404 |
| Audit | `/admin/activity` logs sign-ins, **blocked attempts**, sign-outs and every change, with IP |
| Dependencies | `npm audit --omit=dev` → 0 known vulnerabilities at build time |

**Recommended:** turn on 2-Step Verification for both Google accounts, and for your GitHub and Vercel accounts. Those accounts are the keys to everything.

## Run locally (optional)
```bash
npm install
cp .env.example .env.local   # fill in the values (localhost is already an authorized domain in Firebase)
npm run dev                  # http://localhost:3000/admin/login
```
