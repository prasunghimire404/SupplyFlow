# SupplyFlow

> **Mobile-first business management for Nepali small businesses**

SupplyFlow helps shop owners, suppliers, and traders manage inventory, billing, khata (credit/debit tracking), and business analytics — all synced in real-time with Firebase.

---

## ✨ Features

### Core Modules
- **📊 Dashboard** — Sales overview, KPI cards, weekly performance chart, recent transactions
- **📦 Inventory** — Product catalog with categories, stock levels, low-stock alerts, search
- **🧾 Billing** — Create bills with auto VAT (13%), line-item builder, save/print/share
- **📒 Khata** — Customer & supplier ledger with credit/debit entries, balance tracking
- **🔔 Notifications** — Payment alerts, low stock, team updates, system messages
- **👤 Profile** — Business details, stats, personal info from Firestore
- **⚙️ Settings** — Workspaces, theme (dark/light), date system (BS/AD), language, currency

### Auth Flow
- **Splash** — Animated logo with progress bar
- **Login** — Email/password with Google sign-in placeholder
- **Signup** — Single-page form: owner name, business name, email, address, phone, password
- **No OTP in v1** — Accounts are active immediately after signup

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo SDK | ~56.0.12 |
| Runtime | React Native | 0.85.3 |
| React | React | 19.2.3 |
| Navigation | Expo Router | ~56.2.11 (file-based) |
| Styling | NativeWind v4 | ^4.0.0 (Tailwind for RN) |
| State | Zustand | ^5.0.0 |
| Backend | Firebase | ^11.0.0 |
| Auth | Firebase Auth | Email/password |
| Database | Cloud Firestore | Real-time sync |
| Storage | Firebase Storage | Product images, avatars |
| Icons | lucide-react-native | ^0.509.0 |
| Charts | react-native-gifted-charts | ^1.4.0 |
| Bottom Sheets | @gorhom/bottom-sheet | ^5.0.0 |
| Animations | react-native-reanimated | 4.3.1 |
| Gestures | react-native-gesture-handler | ~2.31.1 |
| Fonts | DM Sans (Google Fonts) | @expo-google-fonts/dm-sans |

---

## 📁 Project Structure

```
supplyflow/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout: fonts, auth guard, theme provider
│   ├── +not-found.tsx            # 404 error page
│   ├── (auth)/                   # Auth group (no tab bar)
│   │   ├── _layout.tsx           # Auth stack navigator
│   │   ├── splash.tsx            # Animated splash screen
│   │   ├── login.tsx             # Email/password login
│   │   └── signup.tsx            # Business account creation
│   ├── (tabs)/                   # Main app (with tab bar)
│   │   ├── _layout.tsx           # Tab shell: TopBar + BottomNav
│   │   ├── index.tsx             # Dashboard
│   │   ├── inventory.tsx         # Product catalog
│   │   ├── billing.tsx           # Bill builder + records
│   │   └── khata/
│   │       ├── index.tsx         # Customer list
│   │       ├── [customerId].tsx # Ledger detail
│   │       ├── pending-payments.tsx
│   │       └── pending-collection.tsx
│   ├── notifications.tsx         # Notification center
│   ├── profile.tsx               # User profile (reads Firestore)
│   └── settings.tsx              # App settings
├── src/
│   ├── components/
│   │   ├── ui/                   # Reusable UI primitives
│   │   │   └── Button.tsx
│   │   ├── TopBar.tsx            # Header with workspace switcher
│   │   ├── BottomNav.tsx         # Tab navigation bar
│   │   ├── KpiCard.tsx           # Metric card component
│   │   └── TransactionRow.tsx    # Transaction list item
│   ├── services/
│   │   ├── firebase.ts           # Firebase initialization
│   │   └── auth.service.ts       # Auth + Firestore user creation
│   ├── stores/
│   │   ├── auth-store.ts         # Auth state (Zustand)
│   │   ├── theme-store.ts        # Dark/light mode (persisted)
│   │   └── notifications-store.ts # Notification data
│   ├── lib/
│   │   ├── utils.ts              # cn() helper
│   │   └── format.ts             # NPR currency formatting
│   ├── types/
│   │   └── firebase-auth.d.ts    # Type augmentation
│   └── global.css                # Tailwind + CSS variables
├── assets/
│   └── images/                   # App icons, splash, logos
├── .env                          # Firebase keys (gitignored)
├── app.config.ts                 # Expo config (reads .env)
├── tailwind.config.js            # Tailwind + design tokens
├── metro.config.js               # Metro + NativeWind
├── babel.config.js               # Babel preset
├── tsconfig.json                 # TypeScript paths (@/*)
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- Android Studio (for Android emulator) or Xcode (for iOS simulator)
- Firebase project (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/supplyflow.git
cd supplyflow
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> **Note:** `--legacy-peer-deps` is required because `lucide-react-native` declares React 18 as a peer dependency, but Expo SDK 56 uses React 19. The package works fine with React 19 in practice.

### 3. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Add a Web app to your project
4. Copy the Firebase config values

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyCXJ-BPzD7QIhNmBrddETK7zOLKC8wk8J8
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=supplyflow-988a7.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=supplyflow-988a7
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=supplyflow-988a7.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=216366513233
EXPO_PUBLIC_FIREBASE_APP_ID=1:216366513233:web:8872c99f0888b40978cc70
```

> **Security:** Never commit `.env` to version control. It's already in `.gitignore`.

### 4. Set up Firebase Security Rules

In Firebase Console → Firestore Database → Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Workspaces: members can read, owners/admins can write
    match /workspaces/{workspaceId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.collaborators;
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }

    // Products under workspace
    match /workspaces/{workspaceId}/products/{productId} {
      allow read, write: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.collaborators;
    }
  }
}
```

### 5. Run the app

```bash
# Start Metro bundler
npx expo start -c

# Then press:
#   a  → open on Android emulator
#   i  → open on iOS simulator
#   w  → open in web browser
```

---

## 📱 Building for Production

### Development Build (required for native modules)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure builds
eas build:configure

# Build for Android (internal testing)
eas build --profile development --platform android

# Build for iOS (requires Apple Developer account)
eas build --profile development --platform ios
```

### Production Build

```bash
# Android APK/AAB
eas build --profile production --platform android

# iOS
eas build --profile production --platform ios
```

### Submit to Stores

```bash
# Google Play Store
eas submit --platform android

# Apple App Store
eas submit --platform ios
```

---

## 🔧 Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start Metro dev server |
| `npm run android` | Start + open Android |
| `npm run ios` | Start + open iOS |
| `npm run web` | Start + open web |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npx expo start -c` | Start with cache clear |
| `npx expo install --fix` | Fix dependency versions |

---

## 🎨 Design System

### Colors (Dark Mode Default)
- **Background**: `#1e1b2e` (deep purple-black)
- **Card**: `#272440` (elevated surface)
- **Primary**: `#a78bfa` (lavender purple)
- **Success/Credit**: `#4ade80` (green)
- **Debit/Warning**: `#fb923c` (orange)
- **Destructive**: `#f87060` (coral red)
- **Muted**: `#a8a5c2` (gray-purple)

### Typography
- **Font**: DM Sans (400, 500, 700)
- **Scale**: xs (12px) → 3xl (30px)

### Spacing
- Page padding: 16px
- Card padding: 16px
- Card gap: 12px
- Section gap: 20px
- Border radius (cards): 18px
- Border radius (buttons): 10px

---

## 🔐 Authentication Flow

```
Splash (2.5s) ──► Login ──► Dashboard
              │
              └──► Signup ──► Dashboard (no OTP in v1)
```

### User Data Stored in Firestore
```typescript
interface UserDoc {
  uid: string;
  email: string;
  displayName: string;      // owner name
  businessName: string;
  address: string;            // location
  phone: string;
  photoURL: string;           // avatar (if uploaded)
  createdAt: string;        // ISO timestamp
  activeWorkspaceId: string | null;
}
```

---

## 🧪 Troubleshooting

### `Cannot find module 'react-native'`
```bash
# Clear everything and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install --legacy-peer-deps
```

### `auth/already-initialized` error
Already handled in `firebase.ts` with try/catch around `initializeAuth`.

### `npm audit fix --force` breaks the app
**Never use `--force`**. It downgrades Expo to incompatible versions. The audit warnings are in dev dependencies and don't affect runtime.

### Metro bundler cache issues
```bash
npx expo start -c
```

### TypeScript can't find module declarations
Make sure `expo-env.d.ts` exists at project root and `tsconfig.json` includes it.

---

## 🗺 Roadmap

- [x] Auth (email/password) + Firestore user sync
- [x] Dashboard with KPIs and transactions
- [x] Inventory with categories and stock alerts
- [x] Billing with VAT auto-calculation
- [x] Khata (ledger) with credit/debit
- [x] Notifications with filters
- [x] Profile + Settings
- [ ] Push notifications (FCM)
- [ ] Offline support (Firestore persistence)
- [ ] Multi-workspace switching
- [ ] Team collaboration (roles)
- [ ] Product image upload (Firebase Storage)
- [ ] PDF invoice generation (expo-print)
- [ ] OTP verification (v2)
- [ ] Nepali date (Bikram Sambat) picker
- [ ] Biometric login

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 👤 Author

**Your Name** — [GitHub](https://github.com/prasunghimire404) · [Email](prasunghimire05@gmail.com)

---

<p align="center">
  Built with ❤️ in Nepal for Nepali businesses
</p>
