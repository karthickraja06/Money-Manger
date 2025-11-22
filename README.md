# 💰 Money Manager - Personal Finance App
## Phase 1: Project Setup & Initialization (COMPLETE ✅)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install & Setup
```bash
git clone https://github.com/karthickraja06/Money-Manager.git
cd Money-Manager/MoneyManager
npm install
```

### Step 2: Configure
Create `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 3: Database
1. Go to Supabase Dashboard → SQL Editor
2. New Query
3. Copy contents of `DATABASE_SCHEMA_CORRECTED.sql`
4. Run

### Step 4: Start App
```bash
npx expo start --clear
# Press 'a' for Android or scan QR code
```

### Step 5: Verify
Check terminal for:
```
🚀 Initializing Money Manager app...
✅ User initialized: [UUID] (device: [device-id])
✅ App ready. User ID: [UUID]
```

---

## 📋 What's Included

✅ **React Native + Expo** - Cross-platform mobile app  
✅ **TypeScript** - Full type safety (40+ interfaces, zero `any` types)  
✅ **Supabase** - Cloud database (8 tables, 10 indexes)  
✅ **Device-based Auth** - No passwords, unique device ID  
✅ **User Initialization** - Automatic on app startup  
✅ **Zustand State** - Global state management  
✅ **Services Layer** - Clean architecture with CRUD operations  
✅ **AsyncStorage** - Local caching for performance  
✅ **Helper Functions** - 15+ utility functions  
✅ **App Constants** - 100+ predefined values  
✅ **Console Logging** - Visibility into what's happening  

---

## 📁 Project Structure

```
src/
├── services/
│   ├── auth.ts              # User authentication
│   ├── database.ts          # CRUD operations
│   └── supabase.ts          # Client configuration
├── store/
│   └── appStore.ts          # Zustand store
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   └── helpers.ts           # Utility functions
└── constants/
    └── index.ts             # App constants

app/
├── _layout.tsx              # Root layout with initialization
└── (tabs)/
    ├── index.tsx            # Home screen
    └── explore.tsx          # Explore screen
```

---

## 🔧 Architecture

### 3-Layer Design
```
UI (React Native)
    ↓
Services (Business Logic)
    ↓
Database (Supabase + AsyncStorage)
```

### Key Services

**AuthService**
```typescript
const user = await AuthService.initializeUser();
const user = await AuthService.getCurrentUser();
```

**DatabaseService**
```typescript
const accounts = await DatabaseService.getAccounts(userId);
const transactions = await DatabaseService.getTransactions(userId);
// 20+ CRUD methods available
```

---

## 🗄️ Database

### 8 Tables
- `users` - User accounts
- `accounts` - Bank/payment accounts
- `transactions` - Financial transactions
- `categories` - Transaction categories
- `budgets` - Budget tracking
- `dues` - Money owed
- `merchant_mapping` - Auto-categorization
- `refund_links` - Expense-refund links

### 10 Indexes
All frequently queried columns indexed for performance

---

## 🔐 Security

- **Device-based** - No email/password needed
- **User isolation** - Each user only sees their data
- **Type-safe** - Compile-time error detection
- **Encrypted** - HTTPS + at-rest encryption
- **Application-level** - Filtering in TypeScript code

---

## ✅ Verification

Check these to confirm it's working:

- [ ] `npx tsc --noEmit` - No TypeScript errors
- [ ] Console shows "✅ User initialized: [UUID]"
- [ ] Supabase users table shows new row
- [ ] Reopening app shows same User ID
- [ ] No app crashes
- [ ] Can navigate tabs

---

## 🐛 Troubleshooting

### Problem: No console logs
**Solution:** Check terminal where `npx expo start` is running (not device logs). Scroll up.

### Problem: UUID error
**Solution:** Already fixed! Uses timestamp + random. If persists: `rm -r node_modules && npm install`

### Problem: Supabase empty
**Solution:** Verify DATABASE_SCHEMA_CORRECTED.sql was run. Check .env.local credentials.

### Problem: App crashes
**Solution:** Run `npx tsc --noEmit` to check for TypeScript errors.

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | TypeScript interfaces (40+) |
| `src/services/auth.ts` | Authentication |
| `src/services/database.ts` | CRUD operations |
| `app/_layout.tsx` | User initialization |
| `DATABASE_SCHEMA_CORRECTED.sql` | Database schema |
| `SETUP_CHECKLIST.md` | Installation steps |
| `ARCHITECTURE.md` | System design |

---

## 🚀 Next: Phase 2

Coming soon:
- SMS reading
- Transaction parsing
- Auto-account creation
- Smart categorization

---

## 📞 Help

Stuck? Check documentation files in project root for detailed guides.

---

**Status**: Phase 1 Complete ✅  
**Ready For**: Phase 2 Development  
**Updated**: November 23, 2025
