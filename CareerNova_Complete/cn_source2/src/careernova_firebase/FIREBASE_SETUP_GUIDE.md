# 🔥 CareerNova — Real Google Login Setup Guide
## Using Firebase Authentication (Free, Industry Standard)

---

## ✅ What you'll get after this setup
- Real Google Sign-In (the actual Google popup — like Gmail, YouTube, etc.)
- Real Email + Password login with Firebase
- Password reset via email (Firebase sends it automatically)
- Sessions persist across page refresh
- Works on localhost AND after deployment

---

## ⏱ Time needed: ~15 minutes

---

# STEP 1 — Create a Firebase Project

1. Open your browser and go to:
   👉 **https://console.firebase.google.com**

2. Sign in with your Google account

3. Click **"Add project"** (the big + card)

4. Enter a project name:
   - Type: `careernova` (or anything you like)

5. **Google Analytics** — click "Disable" (not needed for auth)

6. Click **"Create project"**

7. Wait ~10 seconds, then click **"Continue"**

---

# STEP 2 — Enable Google & Email Sign-In

1. In the left sidebar, click **"Authentication"**
   (Look for the shield icon 🛡)

2. Click **"Get started"**

3. You'll see a list of "Sign-in providers". Click **"Google"**

4. Toggle the **Enable** switch to ON (blue)

5. In the **"Project support email"** dropdown → select your Gmail

6. Click **"Save"**

7. Go back to Sign-in providers list (click the ← arrow)

8. Click **"Email/Password"**

9. Toggle the **first switch** (Email/Password) to ON

10. Leave "Email link (passwordless)" OFF

11. Click **"Save"**

---

# STEP 3 — Register your Web App

1. Click the **gear icon** ⚙ next to "Project Overview" in the left sidebar

2. Click **"Project settings"**

3. Scroll down to **"Your apps"** section

4. Click the **Web icon** `</>`

5. In "App nickname" type: `CareerNova Web`

6. Leave "Also set up Firebase Hosting" **unchecked**

7. Click **"Register app"**

8. You will see a code block like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "careernova-xxxxx.firebaseapp.com",
  projectId: "careernova-xxxxx",
  storageBucket: "careernova-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

9. **Copy this entire object** — you need it in the next step

10. Click **"Continue to console"**

---

# STEP 4 — Add Your Config to the Project

1. Open your project folder in VS Code (or any editor)

2. Navigate to: `src/firebase.js`

3. Find this section near the top:

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  ...
};
```

4. **Replace it** with the config you copied from Firebase:

```javascript
const firebaseConfig = {
  apiKey:            "AIzaSy...",           // ← your real value
  authDomain:        "careernova-xxx.firebaseapp.com",
  projectId:         "careernova-xxx",
  storageBucket:     "careernova-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef",
};
```

5. **Save the file** (Ctrl+S)

---

# STEP 5 — Add Authorized Domain (for Google popup)

Google will only show the sign-in popup on domains you whitelist.

1. In Firebase Console → **Authentication** → **Settings** tab (top)

2. Scroll to **"Authorized domains"**

3. You should see `localhost` already listed ✅

4. If you deploy later (e.g. to Vercel / Netlify), add your domain here too:
   - Click **"Add domain"**
   - Type: `your-app.vercel.app`
   - Click **"Add"**

---

# STEP 6 — Run the App

Open a terminal in the project folder and run:

```bash
npm install
npm run dev
```

Open: **http://localhost:5173**

---

# STEP 7 — Test Everything

### Test Google Sign-In
1. Click **"Sign Up"** or **"Log In"**
2. Click **"Continue with Google"**
3. A real Google account picker popup appears
4. Select your account
5. You're logged in ✅

### Test Email Sign-Up
1. Click **"Sign Up"**
2. Enter name, email, password
3. Click **"Create Account"**
4. Firebase creates the account instantly ✅

### Test Email Login
1. Click **"Log In"**
2. Enter the email & password you just used
3. Click **"Sign In"** ✅

### Test Password Reset
1. Click **"Log In"** → **"Forgot password?"**
2. Enter your email
3. Click **"Send Reset Link"**
4. Check your inbox — you'll get a real email from Firebase
5. Click the link → set new password ✅

---

# STEP 8 — View Users in Firebase Console

1. Go to Firebase Console → **Authentication** → **Users** tab
2. You'll see every account that has signed up
3. You can delete, disable, or reset passwords from here

---

# 🚀 Deploy to the Internet (Optional)

### Option A — Vercel (Recommended, free)
```bash
npm install -g vercel
vercel
```
Follow the prompts. Your site will be live at `https://your-app.vercel.app`

Then go back to Firebase → Authentication → Settings → Authorized domains → Add `your-app.vercel.app`

### Option B — Netlify
1. Run `npm run build`
2. Go to https://netlify.com → drag & drop the `dist/` folder
3. Add your Netlify domain to Firebase authorized domains

---

# ❓ Common Problems & Fixes

| Problem | Fix |
|---|---|
| "Popup blocked" | Allow popups in your browser for localhost |
| "auth/unauthorized-domain" | Add your domain to Firebase → Auth → Settings → Authorized domains |
| "auth/configuration-not-found" | Double-check you pasted the firebaseConfig correctly |
| Google button does nothing | Make sure Google sign-in is enabled in Firebase console |
| "auth/email-already-in-use" | That email already has an account — use Log In instead |
| "auth/wrong-password" | Wrong password — use Forgot Password to reset |
| Firebase config values say "YOUR_API_KEY" | You forgot Step 4 — paste your real config |

---

# 📁 Files Changed in This Update

```
src/
├── firebase.js          ← NEW — Firebase config & auth helpers
└── App.jsx              ← Updated — all auth calls now use Firebase
```

The `server.js` (OTP email server) is no longer needed for auth.
Firebase handles everything — no backend required!

---

# 🔐 Security Notes

- Your `apiKey` in firebase.js is safe to expose — it only identifies your project
- Firebase security rules protect your data
- Never share your Firebase **Admin SDK** credentials (those are different)
- Enable **App Check** in Firebase console for extra security in production

---

*Built with Firebase Authentication v10 + React 19 + Vite 6*
