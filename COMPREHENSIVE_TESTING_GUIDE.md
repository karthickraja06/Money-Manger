# 🧪 MONEY MANAGER APP - COMPLETE TESTING GUIDE

**Date**: December 25, 2025
**Version**: 1.0.0
**Status**: Ready for Production Testing

---

## 📋 TABLE OF CONTENTS

1. [Testing Strategy](#testing-strategy)
2. [Mock Data vs Real Data](#mock-data-vs-real-data)
3. [APK Building & Installation](#apk-building--installation)
4. [Feature Testing Checklist](#feature-testing-checklist)
5. [SMS Testing](#sms-testing)
6. [Notification Testing](#notification-testing)
7. [Manual Data Entry Testing](#manual-data-entry-testing)
8. [Real-World Testing Scenarios](#real-world-testing-scenarios)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 TESTING STRATEGY

### Testing Levels
```
1. Unit Testing (Code-level) ✅ Implemented
   - Services validated
   - Type safety verified
   - Error handling in place

2. Integration Testing (Feature-level) ✅ Ready
   - SMS reading + Database
   - Notifications + Due dates
   - Filters + Analytics

3. System Testing (Full app) ✅ Ready
   - All features together
   - Dark mode + Light mode
   - Real device testing

4. User Acceptance Testing (Real-world) 📍 This Phase
   - Real SMS messages
   - Real notifications
   - Real transaction data
```

---

## 📊 MOCK DATA VS REAL DATA

### What Happens to Mock Data?

**Mock data is TEMPORARY:**
- Used during development only
- Stored in Zustand state (in-memory)
- Lost when app restarts
- Will NOT be replaced by real data

**Real data is PERMANENT:**
- Stored in Supabase database
- Synced across devices
- Persists after app restart
- Can be exported/backed up

### Data Flow:
```
┌──────────────────────────────────────────────┐
│  USER INTERACTION (SMS/Manual Entry)        │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  PARSE & VALIDATE DATA                       │
│  (SMS Parser / Manual Entry Validation)      │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  STORE IN ZUSTAND (In-Memory Cache)          │
│  (Displayed to user immediately)             │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  SAVE TO SUPABASE (Cloud Database)           │
│  (Persisted permanently)                     │
└──────────────────────────────────────────────┘
```

### Will Real Data Conflict with Mock Data?
**NO** - They won't conflict because:
- ✅ Real data overwrites mock data in display
- ✅ Database stores all data (mock + real)
- ✅ User can delete any transaction
- ✅ Each transaction has unique ID

---

## 🚀 APK BUILDING & INSTALLATION

### Method 1: Using Expo Go (FASTEST - Development)

**Pros**: 
- No build process
- Instant reload
- Perfect for testing features

**Cons**: 
- Not a real APK
- Requires Expo Go app
- Can't test native modules fully

#### Steps:
```bash
# 1. Start Expo
npm run start

# 2. Terminal will show:
# > Press 'a' to open Android
# > Press 'i' to open iOS  
# > Press 'w' to open web

# 3. Press 'a' to open on Android emulator
# The app will load in ~30 seconds

# 4. Test features directly
```

**Command to start:**
```bash
npx expo start --android
```

---

### Method 2: Building Real APK (RECOMMENDED - Production Testing)

**Pros**:
- Real app like on Play Store
- No Expo Go required
- Proper notification testing
- Real SMS reading

**Cons**:
- Takes 5-10 minutes to build
- Larger file size (~50-100 MB)
- Need to install manually

#### Step 1: Install EAS CLI (One-time)
```bash
npm install -g eas-cli
```

#### Step 2: Login to Expo
```bash
eas login
# Follow the prompts to login with your Expo account
```

#### Step 3: Configure EAS Build
```bash
eas build:configure
# Select Android
# Follow setup wizard
```

#### Step 4: Build APK Locally (Fastest)
```bash
eas build --platform android --local
```

This will:
- Build a real APK file
- Save it to your project directory
- Show download link
- Takes ~5-10 minutes on first build

#### Step 5: Install on Android Device
```bash
# Via USB Cable
adb install path/to/apk/file.apk

# Or via File Transfer
# Copy APK to phone, tap to install
```

---

### Method 3: Using Android Studio Emulator

#### Prerequisites:
```bash
# Install Android Studio from:
# https://developer.android.com/studio

# Then configure:
npm install -g @react-native-community/cli
```

#### Steps:
```bash
# 1. Open Android Studio
# 2. Create Virtual Device (Settings > Virtual Device Manager)
# 3. Start the emulator
# 4. In terminal, run:
npx expo start
# 5. Press 'a' to open on Android emulator
```

---

## ✅ FEATURE TESTING CHECKLIST

### Phase 1: Core Features
- [ ] App loads without errors
- [ ] Dashboard displays correctly
- [ ] Dark mode toggle works
- [ ] Light mode toggle works
- [ ] All screens navigate properly

### Phase 2: SMS Features
- [ ] SMS permission request appears
- [ ] Permission grant/deny works
- [ ] SMS sync button responsive
- [ ] Progress bar shows during sync
- [ ] Transactions appear after sync
- [ ] Duplicate SMS not imported twice
- [ ] Correct amount extracted from SMS
- [ ] Merchant name extracted correctly
- [ ] Account auto-created from SMS

### Phase 3: Manual Data Entry
- [ ] Can open add transaction modal
- [ ] Amount field validates (numbers only)
- [ ] Date picker works
- [ ] Category dropdown works
- [ ] Account selection works
- [ ] Notes field accepts text
- [ ] Tags can be added
- [ ] Transaction saves to database
- [ ] Transaction appears in list immediately

### Phase 4: Filtering
- [ ] Date range filter works (today/week/month)
- [ ] Custom date range picker works
- [ ] Transaction type filter works (debit/credit)
- [ ] Account filter works
- [ ] Category filter works
- [ ] Merchant search works
- [ ] Multiple filters work together
- [ ] Statistics update with filters
- [ ] Charts update with filters

### Phase 5: Analytics
- [ ] Dashboard stats display correctly
- [ ] Monthly breakdown shows income/expense
- [ ] Trends screen loads without error
- [ ] Charts render properly
- [ ] Merchant leaderboard displays
- [ ] Category breakdown accurate

### Phase 6: Budgets
- [ ] Can create budget
- [ ] Progress bar updates
- [ ] Alert at 80% threshold
- [ ] Alert at 100% threshold
- [ ] Budget edit works
- [ ] Budget delete works

### Phase 7: Dues & Reminders
- [ ] Can add due
- [ ] Due appears in list
- [ ] Overdue items highlighted
- [ ] Mark due as complete works
- [ ] Delete due works
- [ ] Notification sent on due date

### Phase 8: Notifications
- [ ] Permission request appears
- [ ] Permission grant works
- [ ] Budget alert notification sent
- [ ] Due date notification sent
- [ ] Overdue notification sent
- [ ] Notification text correct
- [ ] Notification dismissible

### Phase 9: Data Export
- [ ] Export data to JSON works
- [ ] JSON file contains all data
- [ ] Can import JSON backup
- [ ] Imported data appears in app
- [ ] No duplicate data after import

---

## 📱 SMS TESTING

### Real-World SMS Testing

#### Test Case 1: Standard Debit Transaction
```
SMS from Bank: "HDFC: Debit of 500 at AMAZON on Dec 25. Bal: 50000"
Expected:
- Amount: 500
- Type: Debit/Expense
- Merchant: Amazon
- Account: HDFC
- Category: Shopping (if previously categorized)
```

#### Test Case 2: Multiple Refunds
```
SMS 1: "AMAZON: Charged 2000 on Dec 20. Bal: 48000"
SMS 2: "AMAZON: Refund 500 on Dec 22. Bal: 48500"
SMS 3: "AMAZON: Refund 500 on Dec 23. Bal: 49000"

Expected:
- Link refunds to original transaction
- Net amount: 2000 - 1000 = 1000
- Show refund history
```

#### Test Case 3: ATM Withdrawal
```
SMS: "SBI: ATM Withdrawal of 5000 at XYZ location. Bal: 25000"
Expected:
- Type: ATM
- Amount: 5000
- Account: SBI
- Category: Withdrawal
```

#### Test Case 4: UPI Transaction
```
SMS: "PAYTM: UPI payment 150 to John Doe. Bal: 10000"
Expected:
- Type: UPI
- Amount: 150
- Merchant: John Doe
- Account: Paytm
```

### How to Get Test SMS Messages

**Option 1: Use Real Bank SMS**
- Make small real transactions
- Check SMS from bank
- Test parsing

**Option 2: Simulate SMS (For Development)**
```bash
# Using Android emulator:
# 1. Open emulator control panel (...)
# 2. Go to Telephony
# 3. Send SMS with test message
# 4. Check if app parses correctly
```

**Option 3: Set Up Firebase Testing**
- Use Firebase test messages
- Don't count against real SMS limits
- Good for bulk testing

### Testing SMS Permission

```javascript
// Manual test in code:

1. First run: Permission modal should appear
   ✅ Grant: SMS reading enabled
   ❌ Deny: Show permission request button

2. Second run: 
   ✅ Should remember permission
   ✅ No permission prompt again

3. Third run:
   ✅ SMS button should work
   ✅ SMS import should start
   ✅ Progress should show
```

---

## 🔔 NOTIFICATION TESTING

### Test Notifications Without Real Events

#### Method 1: Manual Trigger (In-App)
```bash
# In development, add test button:
<Button 
  title="Test Notification"
  onPress={() => ReminderService.sendImmediateNotification(
    "Test Title",
    "Test Body"
  )}
/>
```

#### Method 2: Schedule Test Notification
```javascript
// Test in 5 seconds
const testDate = new Date();
testDate.setSeconds(testDate.getSeconds() + 5);

await ReminderService.scheduleDueReminder(
  "test-123",
  "Test Due",
  testDate,
  1000
);

// After 5 seconds, notification should appear
```

### Notification Checklist

**Budget Alert Notification**:
- [ ] Triggers when category hits 80%
- [ ] Shows category name
- [ ] Shows amount and percentage
- [ ] Dismissible
- [ ] Sound plays (if enabled)
- [ ] Vibration works (if enabled)

**Due Date Notification**:
- [ ] Triggers on due date
- [ ] Shows contact name
- [ ] Shows amount
- [ ] Shows 1 day before (if configured)
- [ ] Dismissible

**Overdue Notification**:
- [ ] Triggers immediately when overdue
- [ ] Shows as high priority
- [ ] Shows red/warning color
- [ ] Can't be dismissed easily

---

## ✏️ MANUAL DATA ENTRY TESTING

### Test Adding Transaction Manually

#### Scenario 1: Basic Transaction
```
Step 1: Tap "+" button on Dashboard
Step 2: Fill in:
  - Amount: 150
  - Date: Today
  - Merchant: Starbucks
  - Category: Food
  - Account: HDFC
Step 3: Tap "Save"
Expected:
  ✅ Transaction appears in list immediately
  ✅ Dashboard stats update
  ✅ Total expense increases by 150
```

#### Scenario 2: Transaction with Tags
```
Step 1: Add transaction
Step 2: Add tags: "coffee, morning"
Step 3: Save
Expected:
  ✅ Tags display in detail view
  ✅ Can filter by tags
  ✅ Tags persist after refresh
```

#### Scenario 3: Link Refund
```
Step 1: Add expense (2000 - Shopping)
Step 2: Add refund transaction (500 - Credit)
Step 3: Open expense detail
Step 4: Tap "Link Refunds"
Step 5: Select refund transaction
Expected:
  ✅ Net amount becomes 1500
  ✅ Refund shows as linked
  ✅ Analytics updated with net amount
```

#### Scenario 4: Edit Transaction
```
Step 1: Tap transaction from list
Step 2: Tap "Edit"
Step 3: Change amount from 150 to 175
Step 4: Tap "Save"
Expected:
  ✅ Amount updated in list
  ✅ Dashboard stats recalculated
  ✅ Previous amount removed
```

---

## 🌍 REAL-WORLD TESTING SCENARIOS

### Day 1: Basic Setup
```
Morning:
[ ] Install APK on real device
[ ] Open app
[ ] Complete first-time setup
[ ] Grant SMS permission
[ ] Grant notification permission

Afternoon:
[ ] Make a real transaction (coffee shop, groceries)
[ ] Wait for SMS
[ ] Test SMS import
[ ] Verify transaction appears correctly

Evening:
[ ] Manually add evening transaction
[ ] Check dashboard stats
[ ] Verify calculations accurate
```

### Day 2: SMS Testing
```
Morning:
[ ] Make 3-5 real bank transactions
[ ] Wait for SMS from each
[ ] Do SMS import
[ ] Verify all transactions imported
[ ] Check if amounts match exactly
[ ] Check if accounts recognized correctly

Afternoon:
[ ] Make refund transaction
[ ] Wait for SMS
[ ] Import SMS
[ ] Link refund to original transaction
[ ] Check net amount calculation

Evening:
[ ] Review all imported transactions
[ ] Manually categorize 2-3
[ ] Check if future similar transactions get same category
```

### Day 3: Filtering & Analytics
```
Morning:
[ ] Test all filter combinations:
  - By date range
  - By transaction type
  - By account
  - By category
  - By merchant name
[ ] Verify statistics update correctly
[ ] Check pie charts render

Afternoon:
[ ] Go to Trends screen
[ ] Check monthly breakdown
[ ] Verify income/expense amounts
[ ] Check merchant leaderboard
[ ] Verify category distribution

Evening:
[ ] Export data to JSON
[ ] Save backup file
[ ] Delete one transaction
[ ] Import backup
[ ] Verify transaction restored
```

### Day 4: Budgets & Alerts
```
Morning:
[ ] Set budget for Food category (2000)
[ ] Spend 1500 on food (manual entry)
[ ] Check if 75% shown
[ ] Budget color should be green

Afternoon:
[ ] Spend 500 more on food
[ ] Check if 100% shown
[ ] Budget color should be red
[ ] Check if alert notification appears

Evening:
[ ] Set budget for another category
[ ] Track spending throughout day
[ ] Verify alerts appear at 80% and 100%
[ ] Dismiss alerts
```

### Day 5: Dues & Notifications
```
Morning:
[ ] Add due (lend 1000 to friend, due today)
[ ] Check notification appears
[ ] Verify notification shows amount and name
[ ] Mark due as complete

Afternoon:
[ ] Add due (due tomorrow)
[ ] Wait for notification
[ ] Add another due (due next week)
[ ] Check notification settings

Evening:
[ ] Review all dues in list
[ ] Edit one due
[ ] Delete one due
[ ] Verify list updates
```

### Day 6: Dark Mode & Settings
```
Morning:
[ ] Enable dark mode in settings
[ ] Navigate all screens
[ ] Verify colors readable
[ ] Check charts visible

Afternoon:
[ ] Toggle light mode
[ ] Verify all screens switch correctly
[ ] Check transitions smooth
[ ] No color inconsistencies

Evening:
[ ] Test dark mode at night (actual lighting)
[ ] Verify eye comfort
[ ] Check text contrast
```

### Day 7: Performance & Edge Cases
```
Morning:
[ ] Import 100+ transactions
[ ] Scroll through list smoothly
[ ] Check app doesn't freeze
[ ] Memory usage normal

Afternoon:
[ ] Test with no internet
[ ] Verify local caching works
[ ] Test sync when back online
[ ] Check no data loss

Evening:
[ ] Close and reopen app
[ ] Verify all data persists
[ ] Export data
[ ] Uninstall and reinstall app
[ ] Verify data restored
```

---

## 🐛 TROUBLESHOOTING

### Issue: SMS Not Reading
```
Solution 1: Check Permission
- Go to Settings > App > Permissions > SMS
- Ensure "Allow" is selected

Solution 2: Check SMS Format
- Bank SMS must contain amount and date
- If SMS format unusual, parser might fail
- Test with standard bank SMS first

Solution 3: Check Logs
- In terminal, look for parser logs
- Verify SMS was received by app
- Check if amount extraction successful
```

### Issue: Notifications Not Appearing
```
Solution 1: Check Permission
- Go to Settings > App > Permissions > Notifications
- Ensure "Allow" is selected

Solution 2: Check App Settings
- Enable notifications in app settings
- Set sound and vibration preferences

Solution 3: Check Notification Service
- Verify Expo Notifications installed
- Check device notification settings
- Restart app
```

### Issue: Slow Performance
```
Solution 1: Clear Cache
- Go to Settings > App > Storage > Clear Cache
- Reinstall app if needed

Solution 2: Reduce Data
- Delete old transactions (>1000)
- Archive historical data
- Export to JSON backup

Solution 3: Device Resources
- Close other apps
- Clear device memory
- Restart device
```

### Issue: Data Not Saving
```
Solution 1: Check Internet
- Verify WiFi/mobile connection
- Check Supabase connectivity
- Try again after 5 seconds

Solution 2: Check Database
- Verify Supabase credentials correct
- Check RLS policies allow write
- Review database quota

Solution 3: Try Again
- Manually retry save
- Clear app cache
- Restart app
```

### Issue: SMS Parser Missing Transactions
```
Solution 1: Check SMS Format
- Verify SMS contains amount
- Check date format is recognized
- Look for merchant name

Solution 2: Update Parser Rules
- Add new bank pattern if needed
- Test with multiple banks
- Report pattern to developers

Solution 3: Manual Entry
- Manually add transaction
- Takes 30 seconds
- Fully editable anytime
```

---

## 📊 TESTING REPORT TEMPLATE

Use this to document your testing:

```
TEST SESSION REPORT
Date: ___________
Device: ___________ (Model, Android Version)
Build: ___________ (APK version)

PASSED TESTS:
✅ Feature 1: ________________
✅ Feature 2: ________________
✅ Feature 3: ________________

FAILED TESTS:
❌ Feature 1: ________________
   Issue: ___________________
   
❌ Feature 2: ________________
   Issue: ___________________

BUGS FOUND:
🐛 Bug 1: ___________________
   Steps to reproduce: _______
   
🐛 Bug 2: ___________________
   Steps to reproduce: _______

PERFORMANCE:
⚡ App load time: __ seconds
⚡ SMS sync time: __ seconds
⚡ Filter response: __ ms
⚡ Chart render: __ ms

BATTERY:
🔋 Before test: __%
🔋 After 1 hour: __%
🔋 Battery drain: __%/hour

FEEDBACK:
👍 What works great:
   1. _________________
   2. _________________

👎 What needs improvement:
   1. _________________
   2. _________________

RATING: ___ / 5 stars
```

---

## 🎯 TESTING PRIORITIES

### Must Test (Critical)
1. ✅ App installs and runs
2. ✅ SMS reading works
3. ✅ Data saves to database
4. ✅ Notifications appear
5. ✅ Filtering accurate
6. ✅ Analytics calculations correct

### Should Test (Important)
1. Dark mode works
2. Multiple SMS types parse
3. Budgets alert correctly
4. Dues track properly
5. Export/import works

### Nice to Test (Optional)
1. Performance optimization
2. Edge cases
3. Unusual SMS formats
4. Extreme data amounts
5. Multi-language support

---

## 📞 NEXT STEPS AFTER TESTING

### If All Tests Pass ✅
1. Deploy to Google Play Store
2. Announce to users
3. Monitor for feedback
4. Plan Phase 2 features

### If Bugs Found 🐛
1. Document bugs thoroughly
2. Create bug fix plan
3. Fix highest priority bugs
4. Retest before launch

### User Feedback Phase 👥
1. Invite 10-20 beta testers
2. Gather feedback
3. Fix common issues
4. Prepare for public launch

---

**Ready to start testing? Build APK with:**
```bash
eas build --platform android --local
```

**Happy testing! 🚀**
