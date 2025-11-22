# 📱 Phase 2: SMS Parser & Transaction Ingestion

## Overview
Phase 2 focuses on reading SMS messages from the device, parsing transaction data, and automatically ingesting transactions into the database.

### Dependencies
- React Native SMS capabilities
- Transaction parser engine
- Auto-categorization logic
- Account detection from SMS

---

## Phase 2 Roadmap

### Phase 2A: SMS Reader Setup
- [ ] Request SMS permissions
- [ ] Read SMS inbox
- [ ] Filter transaction SMS
- [ ] Store raw SMS data
- [ ] Test with sample SMS

### Phase 2B: Transaction Parser
- [ ] Parse bank SMS formats
- [ ] Extract key data (amount, merchant, date)
- [ ] Standardize parsed data
- [ ] Handle multiple bank formats
- [ ] Validate parsed transactions

### Phase 2C: Account Auto-Creation
- [ ] Detect account from SMS
- [ ] Check if account exists
- [ ] Auto-create new accounts
- [ ] Link transactions to accounts
- [ ] Test account detection

### Phase 2D: Transaction Ingestion
- [ ] Create transactions in DB
- [ ] Link to accounts
- [ ] Auto-categorize transactions
- [ ] Handle duplicates
- [ ] Store SMS metadata

### Phase 2E: Testing & Validation
- [ ] Test with real SMS
- [ ] Verify parsing accuracy
- [ ] Test duplicate detection
- [ ] Performance testing
- [ ] Error handling

---

## Architecture

### SMS Parser Pipeline
```
Raw SMS Text
    ↓
Pattern Matching (Bank Detection)
    ↓
Extract Data (Amount, Merchant, Date, Type)
    ↓
Normalize Format
    ↓
Validate Data
    ↓
Auto-Categorize
    ↓
Create Transaction
```

### Key Components to Create

1. **SMS Reader Service** (`src/services/sms.ts`)
   - Request permissions
   - Read SMS messages
   - Filter transaction SMS
   - Return SMS list

2. **Transaction Parser** (`src/services/parser.ts`)
   - Parse HDFC format
   - Parse ICICI format
   - Parse AXIS format
   - Parse UPI format
   - Generic fallback parser

3. **Auto-Categorizer** (`src/services/categorizer.ts`)
   - Detect category from merchant
   - Use merchant mapping
   - Machine learning (future)
   - Default category fallback

4. **SMS Sync Manager** (`src/services/smsSync.ts`)
   - Orchestrate SMS reading
   - Detect new SMS
   - Parse transactions
   - Ingest to database
   - Track sync state

---

## Bank SMS Formats (Common)

### HDFC Bank
```
Debit: Debit card ending xxxxx debited for Rs.X,XXX on MERCHANT. 
       Bal: X,XXX. Ref: XXXXXXX

Credit: Credit of Rs.X,XXX from SENDER. Ref: XXXXXXX
```

### ICICI Bank
```
Debit: Amount Rs.X,XXX has been debited from your account.
       Txn Ref: XXXXXXX. Balance: X,XXX

Credit: Amount Rs.X,XXX has been credited to your account.
        Txn Ref: XXXXXXX
```

### AXIS Bank
```
Debit: Your Account has been debited for Rs.X,XXX towards MERCHANT.
       Ref: XXXXXXX. Bal: X,XXX

Credit: Your Account has been credited with Rs.X,XXX from SENDER.
        Ref: XXXXXXX
```

### UPI
```
Payment successful. Rs.X,XXX transferred to RECIPIENT@UPI. 
Ref: XXXXXXX
```

---

## File Structure (Phase 2)

```
src/
├── services/
│   ├── sms.ts              # NEW: SMS reading
│   ├── parser.ts           # NEW: Transaction parsing
│   ├── categorizer.ts      # NEW: Auto-categorization
│   ├── smsSync.ts          # NEW: Sync orchestration
│   ├── auth.ts             # Existing
│   ├── database.ts         # Existing
│   └── supabase.ts         # Existing
│
├── types/
│   └── index.ts            # Add new SMS/Parser types
│
├── utils/
│   ├── helpers.ts          # Existing
│   ├── parsers.ts          # NEW: Bank-specific parsers
│   └── validation.ts       # NEW: Data validation
│
└── constants/
    └── index.ts            # Add SMS bank formats
```

---

## New Types to Add

### SMS Types
```typescript
interface RawSMS {
  id: string;
  sender: string;
  body: string;
  timestamp: number;
  read: boolean;
}

interface ParsedSMS {
  type: 'debit' | 'credit' | 'atm' | 'upi';
  amount: number;
  merchant?: string;
  account?: string;
  date: string;
  reference?: string;
  rawSMS: RawSMS;
}

interface SMSBank {
  name: 'HDFC' | 'ICICI' | 'AXIS' | 'SBI' | 'UPI' | 'OTHER';
  patterns: RegExp[];
  parser: (sms: string) => ParsedSMS | null;
}
```

---

## Implementation Steps

### Step 1: Create SMS Service
- Read SMS using React Native API
- Filter transaction-related SMS
- Return SMS list with metadata

### Step 2: Create Parser Service
- Implement bank-specific patterns
- Extract transaction data
- Validate parsed data
- Return structured transactions

### Step 3: Create Categorizer
- Lookup merchant in mapping
- Auto-assign category
- Handle new merchants
- Learn from user corrections

### Step 4: Create Sync Manager
- Orchestrate SMS reading
- Detect new transactions
- Prevent duplicates
- Ingest to database
- Update UI

### Step 5: Connect to UI
- Add SMS permissions screen
- Add transaction import UI
- Show parsed transactions
- Allow manual corrections
- Confirm import

---

## Testing Strategy

### Unit Tests
- Test each bank parser with sample SMS
- Test data validation
- Test categorization logic
- Test duplicate detection

### Integration Tests
- Test full SMS→DB flow
- Test account auto-creation
- Test permission handling
- Test error scenarios

### Manual Tests
- Test with real SMS from phone
- Test with multiple banks
- Test edge cases
- Test performance with many SMS

---

## Dependencies Needed

Check package.json for:
- `react-native-sms` or similar
- `react-native-permissions`
- Regex libraries (built-in)
- Existing: Supabase, Zustand, AsyncStorage

---

## Success Criteria

✅ SMS permissions requested and granted  
✅ SMS messages read successfully  
✅ Transaction data parsed correctly  
✅ Transactions created in database  
✅ Accounts auto-created  
✅ Categories auto-assigned  
✅ Duplicates prevented  
✅ UI shows imported transactions  
✅ No crashes or errors  

---

## Timeline Estimate

- **Phase 2A**: SMS Reader - 2-3 days
- **Phase 2B**: Parser - 2-3 days  
- **Phase 2C**: Auto-Account - 1-2 days
- **Phase 2D**: Ingestion - 1-2 days
- **Phase 2E**: Testing - 1-2 days

**Total**: ~1-2 weeks

---

## Next Steps

1. ✅ Create `src/services/sms.ts` - SMS reading service
2. ✅ Create `src/services/parser.ts` - Transaction parser
3. ✅ Create `src/services/categorizer.ts` - Auto-categorization
4. ✅ Create `src/services/smsSync.ts` - Sync orchestration
5. ✅ Add new types to `src/types/index.ts`
6. ✅ Create UI components
7. ✅ Test end-to-end
8. ✅ Performance optimization

---

## Phase 2 Complete When

- SMS reading working
- Parser handles multiple banks
- Transactions ingested to DB
- Accounts auto-created
- Categories auto-assigned
- UI shows transactions
- All tests passing

Then → Phase 3 (Analytics & Dashboard)

---

**Status**: Ready to start Phase 2  
**Phase 1 Status**: ✅ Complete  
**Current Date**: November 23, 2025
