# Money Manager App - Phase 1: Project Setup & Database

A personal finance management app built with React Native (Expo) and Supabase, designed to automatically read SMS transaction messages, categorize spending, track accounts, manage budgets, and analyze financial trends.

## 📱 Project Overview

This app is divided into **8 phases** for manageable development:

- **Phase 1** (Current): Project Setup & Database ✅
- **Phase 2**: SMS Parser & Account Auto-Creation
- **Phase 3**: Transactions UI & Categorization
- **Phase 4**: Refund Linking System
- **Phase 5**: Filters & Search
- **Phase 6**: Budgets & Analytics
- **Phase 7**: Dues, Reminders & Notes
- **Phase 8**: Testing, Polish & Dark Mode

## 🔧 Phase 1: What's Been Built

### ✅ Project Structure
```
MoneyManager/
├── src/
│   ├── types/              # TypeScript interfaces & types
│   ├── services/           # API & database services
│   ├── store/              # Zustand state management
│   ├── screens/            # React Native screens (next phase)
│   ├── components/         # Reusable UI components (next phase)
│   ├── utils/              # Helper functions
│   └── constants/          # App constants (next phase)
├── .env.example            # Environment variables template
├── package.json
├── tsconfig.json
└── app.json
```

### ✅ Installed Dependencies

#### Core Framework
- **expo**: React Native framework for cross-platform mobile apps
- **react-native**: Mobile app framework
- **typescript**: Type safety

#### Backend & Database
- **@supabase/supabase-js**: PostgreSQL backend with real-time support

#### Navigation & UI
- **@react-navigation/native**: Screen navigation
- **@react-navigation/bottom-tabs**: Tab-based navigation
- **@react-navigation/stack**: Stack navigation
- **react-native-screens**: Native screen management
- **react-native-safe-area-context**: Safe area handling

#### State Management
- **zustand**: Lightweight state management

#### Utilities
- **@react-native-async-storage/async-storage**: Local device storage
- **axios**: HTTP client (if needed for APIs)
- **react-native-gesture-handler**: Touch handling

### ✅ Database Schema (6 Tables)

All tables are set up in Supabase with:
- ✅ UUID primary keys
- ✅ Timestamps (created_at, updated_at)
- ✅ User-based row-level security (RLS)
- ✅ Proper indexes for performance

#### 1. **users** Table
```sql
id (UUID, PK) | device_id (UNIQUE) | email | created_at | updated_at
```
- Device-based authentication
- Optional email field

#### 2. **accounts** Table
```sql
id | user_id | bank_name | account_number | balance | created_from_sms | is_active | timestamps
```
- Auto-created from SMS
- Supports: HDFC, ICICI, SBI, Indian Bank, Paytm, PhonePe, Cash
- Unique constraint on (user_id, bank_name, account_number)

#### 3. **categories** Table
```sql
id | user_id | name | color | icon | created_at
```
- Pre-defined categories: Food, Entertainment, Travel, Shopping, etc.
- Customizable colors and icons

#### 4. **transactions** Table
```sql
id | user_id | account_id | amount | type | merchant | category_id | tags | date
| is_income | is_expense | original_amount | net_amount | linked_to_expense_id
| is_linked | notes | timestamps
```
- Transaction types: debit, credit, atm, cash, upi
- Refund linking support
- Tags for custom categorization

#### 5. **budgets** Table
```sql
id | user_id | category_id | month | year | amount | thresholds (JSON) | timestamps
```
- Monthly budgets per category
- Thresholds for 80% and 100% alerts

#### 6. **dues** Table
```sql
id | user_id | transaction_id (nullable) | contact_name | contact_phone | amount
| due_date | due_type | status | reminder_days_before | notes | timestamps
```
- Track money to pay or receive
- Reminder notifications

#### 7. **merchant_mapping** Table
```sql
id | user_id | merchant_name | category_id | tags | visit_count | last_assigned_at | created_at
```
- Auto-categorization learning
- Tracks merchant visit count

#### 8. **refund_links** Table
```sql
id | user_id | expense_txn_id | refund_txn_id | amount_linked | created_at
```
- Links refund transactions to original expenses
- Supports partial & multiple refunds

### ✅ TypeScript Types (`src/types/index.ts`)

All data models with full type safety:
- User, Account, Transaction, Category, Budget, Due, MerchantMapping
- FilterOptions, DashboardStats, TrendData
- SMS parsing types

### ✅ Services

#### `auth.ts` - Authentication Service
- Device-based user creation
- Optional email registration
- User persistence with AsyncStorage

#### `supabase.ts` - Supabase Configuration
- Client initialization
- Complete SQL schema for manual setup

#### `database.ts` - Database Operations
- Complete CRUD operations for all tables
- Typed methods for safety
- Error handling

### ✅ State Management (`src/store/appStore.ts`)

Global Zustand store with:
- User state
- Transactions, Accounts, Categories, Budgets, Dues
- Active filters
- Dashboard statistics
- Loading & error handling

### ✅ Utilities (`src/utils/helpers.ts`)

Helper functions:
- Date formatting & range calculations
- Currency formatting & parsing
- Filter application logic
- Statistics calculations
- Email & phone validation
- Merchant name normalization

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
cd d:\karthick\projects\MoneyManager
# Already created with Expo
cd MoneyManager
```

### 2. Create Supabase Project
1. Go to https://supabase.com and sign up
2. Create a new project
3. Wait for it to initialize
4. Go to **Settings** → **API**
5. Copy `Project URL` and `anon key`

### 3. Setup Environment Variables
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Initialize Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy the entire SQL from `src/services/supabase.ts` (DATABASE_SCHEMA_SQL)
4. Run it
5. Enable RLS policies (see supabase.ts for policy examples)

### 5. Install Dependencies (Already Done)
```bash
npm install
```

### 6. Start Development Server
```bash
npm run android  # For Android emulator
# or
npx expo start   # For Expo Go app
```

## 📁 File Structure

```
src/
├── types/
│   └── index.ts                 # All TypeScript interfaces
├── services/
│   ├── supabase.ts             # Supabase config & schema SQL
│   ├── auth.ts                 # Authentication service
│   └── database.ts             # Database CRUD operations
├── store/
│   └── appStore.ts             # Zustand global state
├── utils/
│   └── helpers.ts              # Date, currency, filter utilities
└── constants/                  # App constants (next phase)
```

## 🔐 Security Considerations

### Row-Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies enforce user_id isolation

### Authentication
- Device-based by default (anonymous)
- Optional email registration
- No password storage needed

### Data Privacy
- SMS raw text not stored unless opted in
- All transactions encrypted in transit (HTTPS)
- Supabase handles data encryption at rest

## 🔄 Data Flow Architecture

```
┌─────────────┐
│ React Native│
│   (Expo)    │
└──────┬──────┘
       │
       ├─► Authentication Service ──► Device ID / Email
       │
       ├─► State Management (Zustand)
       │   ├─ User
       │   ├─ Transactions
       │   ├─ Accounts
       │   └─ Filters
       │
       └─► Database Service ──► Supabase
           └─ CRUD Operations
               ├─ Transactions
               ├─ Accounts
               ├─ Categories
               ├─ Budgets
               ├─ Dues
               └─ Merchant Mappings
```

## 🧪 Testing Phase 1 Setup

### 1. Verify Installation
```bash
npm run android  # Should start without errors
```

### 2. Check Database Connection
- If you see "Supabase initialized successfully", DB is connected
- Create a test account in Supabase users table

### 3. Verify Types Compilation
```bash
npx tsc --noEmit  # Should have no type errors
```

## 📊 Phase 1 Summary

| Component | Status | Details |
|-----------|--------|---------|
| Project Setup | ✅ Complete | Expo + TypeScript configured |
| Dependencies | ✅ Installed | All core packages installed |
| Database Schema | ✅ Ready | 8 tables with indexes & RLS |
| Type Definitions | ✅ Complete | Full TypeScript support |
| Services | ✅ Implemented | Auth, DB, Supabase |
| State Management | ✅ Setup | Zustand store configured |
| Utilities | ✅ Ready | Helpers for dates, currency, filters |
| UI Screens | ⏳ Next Phase | Screens will be built in Phase 2 |

## 🎯 Phase 2 Preview

Next phase will build:
- **SMS Reader Module**: Read SMS from device
- **SMS Parser**: Extract transaction data
- **Account Auto-Creation**: Automatically create accounts from SMS
- **Transaction List Screen**: Display parsed transactions

## 📝 Notes

- This is **Phase 1 of 8** - infrastructure layer
- All type definitions are complete and ready to use
- Database schema can be deployed immediately
- No UI screens yet (those come in Phase 2)
- Ready for SMS parsing module implementation

## 🆘 Troubleshooting

### Issue: "Cannot find module 'uuid'"
```bash
npm install uuid
npm install --save-dev @types/uuid
```

### Issue: Supabase connection errors
- Verify URL and API key in .env.local
- Check that Supabase project is active
- Ensure internet connectivity

### Issue: TypeScript errors
```bash
npx tsc --noEmit  # Check for type errors
npm run android -- --clear  # Clear cache
```

## 📞 Next Steps

1. ✅ Phase 1 setup complete
2. 📅 Phase 2: Start SMS Parser implementation
3. 🔄 Week 2: Build Transaction UI
4. 💰 Week 3: Refund linking system
5. 📊 Week 4: Analytics & budgets

---

**Ready to move to Phase 2?** The foundation is solid! 🚀
