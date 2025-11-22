# Money Manager App - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONEY MANAGER APP                            │
│                    (React Native + Expo)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   UI SCREENS (Phase 2+)                  │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐  │  │
│  │  │  Home   │ │ Trans.   │ │ Budgets│ │   Trends     │  │  │
│  │  │ Screen  │ │  List    │ │ Screen │ │  Analytics   │  │  │
│  │  └─────────┘ └──────────┘ └────────┘ └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        STATE MANAGEMENT (Zustand Store) - Phase 1       │  │
│  │                                                          │  │
│  │  • User State                                           │  │
│  │  • Transactions                                         │  │
│  │  • Accounts                                             │  │
│  │  • Budgets                                              │  │
│  │  • Dues                                                 │  │
│  │  • Filters                                              │  │
│  │  • Loading/Error States                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                  │              │              │                │
│                  ▼              ▼              ▼                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Auth Service │  │ Database     │  │ SMS Parser       │    │
│  │ (Phase 1)    │  │ Service      │  │ (Phase 2)        │    │
│  │              │  │ (Phase 1)    │  │                  │    │
│  │ • Device ID  │  │              │  │ • Read SMS       │    │
│  │ • User Init  │  │ • CRUD Ops   │  │ • Parse Data     │    │
│  │ • Email      │  │ • Validation │  │ • Categorize     │    │
│  │   Optional   │  │              │  │ • Auto-Account   │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
│                  │              │              │                │
│                  └──────────────┴──────────────┘                │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           UTILITIES & CONSTANTS (Phase 1)                │  │
│  │                                                          │  │
│  │  Helpers:              Constants:                       │  │
│  │  • Date Formatting     • Categories                      │  │
│  │  • Currency Calcs      • Banks                           │  │
│  │  • Filter Engine       • Status Colors                   │  │
│  │  • Normalization       • Messages                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
          ┌─────────────────────────────────────┐
          │      SUPABASE (PostgreSQL)          │
          │      Cloud Backend (Phase 1)        │
          ├─────────────────────────────────────┤
          │  Tables:                            │
          │  • users (device-based auth)        │
          │  • accounts (auto-created from SMS) │
          │  • categories                       │
          │  • transactions                     │
          │  • budgets                          │
          │  • dues                             │
          │  • merchant_mapping                 │
          │  • refund_links                     │
          │                                     │
          │  Features:                          │
          │  • Row-Level Security (RLS)         │
          │  • Real-time subscriptions          │
          │  • Automatic timestamps             │
          │  • Backups & versioning             │
          └─────────────────────────────────────┘
```

---

## Data Flow Diagram

### **Transaction Creation Flow**

```
┌─────────────────┐
│   SMS Message   │
│   (Bank Alert)  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│   SMS Parser Module      │
│   (Phase 2)              │
└────────┬─────────────────┘
         │
         ├─► Extract: Amount, Merchant, Date, Type
         │
         └─► Detect: Debit/Credit/ATM/UPI/Refund
              │
              ▼
         ┌──────────────────────────┐
         │ Merchant Normalization   │
         │ "AMAZON PAY" → "Amazon"  │
         └────────┬─────────────────┘
                  │
                  ▼
         ┌──────────────────────────┐
         │ Check Merchant Mapping   │
         │ (Auto-categorize)        │
         └────────┬─────────────────┘
                  │
                  ├─► Found: Use existing category
                  │
                  └─► Not Found: Suggest "Other"
                       User can categorize
                       │
                       ▼
                   Update Merchant Mapping
                   (visit_count++)
                   │
                   ▼
         ┌──────────────────────────┐
         │ Auto-Create Account      │
         │ if new bank detected     │
         └────────┬─────────────────┘
                  │
                  ▼
         ┌──────────────────────────┐
         │ Save Transaction         │
         │ to Database              │
         └────────┬─────────────────┘
                  │
                  ▼
         ┌──────────────────────────┐
         │ Update Zustand Store     │
         │ Update UI automatically  │
         └──────────────────────────┘
```

---

## Refund Linking Flow

```
┌──────────────────────────────┐
│  Original Expense            │
│  Amount: ₹2000               │
│  Type: Debit                 │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  User: "Link Refunds"        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Show Recent Credits         │
│  • ₹500 from Amit            │
│  • ₹600 from Priya           │
│  • ₹400 from Ravi            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  User Selects (Multi)        │
│  ✓ ₹500 from Amit            │
│  ✓ ₹500 from Priya           │
│  Total Refunds: ₹1000        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Calculate Net Amount        │
│  Original: ₹2000             │
│  - Refunds: ₹1000            │
│  = Net: ₹1000                │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Create Refund Links         │
│  • Link Amit's ₹500          │
│  • Link Priya's ₹500         │
│  Update Transaction          │
│  net_amount = 1000           │
│  is_linked = true            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Display in Transaction List │
│  Expense: ₹2000              │
│  Refunds: ₹1000              │
│  Net: ₹1000 ✓                │
└──────────────────────────────┘
```

---

## Filter & Analytics Flow

```
┌─────────────────┐
│  All Txns       │
│  500 total      │
└────────┬────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Apply Filters                     │
│                                    │
│  Date: This Month                  │
│  Type: Debit only                  │
│  Account: HDFC + ICICI             │
│  Category: Food + Travel           │
│  Tags: Groceries                   │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Filtered Transactions             │
│  45 total                          │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Calculate Statistics              │
│                                    │
│  Total Debit: ₹12,500              │
│  Total Credit: ₹800                │
│  Net: ₹11,700                      │
│                                    │
│  By Category:                      │
│  • Food: ₹5,000 (40%)              │
│  • Travel: ₹3,500 (28%)            │
│  • Other: ₹4,000 (32%)             │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Render Charts                     │
│                                    │
│  • Pie Chart (Category breakdown)  │
│  • Bar Chart (Daily spending)      │
│  • Line Chart (Trend)              │
│  • Stats Cards                     │
└────────────────────────────────────┘
```

---

## Budget Alert Flow

```
┌──────────────────────────────┐
│  Monthly Budget Set          │
│  Category: Food              │
│  Budget: ₹6,000              │
│  Thresholds:                 │
│  • Warning: 80% (₹4,800)     │
│  • Critical: 100% (₹6,000)   │
└────────┬─────────────────────┘
         │
    (Every transaction)
         │
         ▼
┌──────────────────────────────┐
│  Calculate Month Spending    │
│  Food transactions sum       │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Check Threshold             │
│                              │
│  ├─ < 80%: On Track ✓       │
│  ├─ 80-100%: Warning ⚠       │
│  └─ > 100%: Exceeded ❌     │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Send Notification (if set)  │
│  Show on Dashboard           │
│  Update Progress Bar         │
└──────────────────────────────┘
```

---

## Phase Breakdown & Dependencies

```
Phase 1: Infrastructure ✅
├─ Project Setup
├─ Database Schema
├─ Type Definitions
├─ Services (Auth, Database)
├─ State Management (Zustand)
└─ Utilities & Constants

Phase 2: SMS & Accounts ⏳
├─ Depends on: Phase 1 ✅
├─ SMS Reader Module
├─ Parser Engine
└─ Auto-Account Creation

Phase 3: Transaction UI ⏳
├─ Depends on: Phase 1, 2
├─ Transaction List Screen
├─ Transaction Detail Screen
├─ Auto-Categorization UI
└─ Merchant Mapping UI

Phase 4: Refund System ⏳
├─ Depends on: Phase 1, 3
├─ Refund Linking UI
├─ Split Settlement
└─ Net Amount Calculation

Phase 5: Filters ⏳
├─ Depends on: Phase 1, 3
├─ Filter UI
├─ Search Module
└─ Results Display

Phase 6: Analytics ⏳
├─ Depends on: Phase 1, 3, 5
├─ Dashboard Screen
├─ Charts (Pie, Bar, Line)
├─ Budget Alerts
└─ Trends Screen

Phase 7: Dues & Reminders ⏳
├─ Depends on: Phase 1
├─ Dues Tracking
├─ Reminder Notifications
└─ Notes System

Phase 8: Polish & Testing ⏳
├─ Depends on: All Phases
├─ Unit Tests
├─ UI Polish
├─ Dark Mode
└─ Export/Import
```

---

## Database Schema Relationships

```
users (1)
  │
  ├──────┬─────────┬────────┬─────────┬──────────────┬──────────┐
  │      │         │        │         │              │          │
  ▼      ▼         ▼        ▼         ▼              ▼          ▼
(n) accounts  categories transactions budgets  merchant_mapping dues
              │         │         
              │         ├──→ refund_links
              │         │      (expense_txn_id)
              │         │      (refund_txn_id)
              │         │
              └─────────┴──→ transactions (self-join for linked txns)
```

**Key Relationships:**
- `users (1) → (n) accounts`: User has multiple bank accounts
- `users (1) → (n) transactions`: User has many transactions
- `users (1) → (n) categories`: User has custom categories
- `accounts (1) → (n) transactions`: Account has many transactions
- `categories (1) → (n) transactions`: Category has many transactions
- `transactions (n) ↔ (m) transactions`: Via `refund_links` table
- `users (1) → (n) merchant_mapping`: User's merchant learning history

---

## Security Architecture

```
┌─────────────────────────────────────────────────────┐
│              SECURITY LAYERS                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Layer 1: Authentication                           │
│  ├─ Device ID (Unique per device)                 │
│  ├─ Optional Email                                │
│  └─ No passwords required                         │
│                                                     │
│  Layer 2: Row-Level Security (RLS)                │
│  ├─ users: device_id must match                  │
│  ├─ accounts: user_id must match                 │
│  ├─ transactions: user_id must match             │
│  └─ All tables: user_id isolation                │
│                                                     │
│  Layer 3: Data Encryption                         │
│  ├─ HTTPS for all connections                    │
│  ├─ Supabase encryption at rest                  │
│  └─ Optional: per-field encryption               │
│                                                     │
│  Layer 4: Privacy                                  │
│  ├─ Raw SMS NOT stored                           │
│  ├─ Only parsed data saved                       │
│  ├─ Users own their data                         │
│  └─ Export/backup available                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React Native + Expo | Cross-platform mobile app |
| **Language** | TypeScript | Type-safe development |
| **State** | Zustand | Global state management |
| **Backend** | Supabase (PostgreSQL) | Database + auth + API |
| **Storage** | AsyncStorage | Device-local cache |
| **Parsing** | Custom Regex + ML hints | SMS parsing |
| **Charts** | react-native-charts (Phase 6) | Visualizations |
| **Notifications** | expo-notifications (Phase 7) | Local reminders |

---

## Performance Considerations

```
✅ Implemented in Phase 1:
├─ Database indexes on frequently queried fields
├─ Pagination support (50 items per page)
├─ Lazy loading for large lists
├─ AsyncStorage for offline cache
└─ Debounced filter operations

✅ To Implement in Later Phases:
├─ Memoization for expensive calculations
├─ Virtual lists for large transaction histories
├─ Offline-first sync strategy
├─ Background sync for cloud data
└─ Periodic SMS reading (Phase 2)
```

---

## This is Phase 1 ✅

**Infrastructure layer is complete and ready!**

Next: **Phase 2 - SMS Parser & Account Auto-Creation**
