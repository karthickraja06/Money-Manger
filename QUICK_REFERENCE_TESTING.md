# ⚡ QUICK START REFERENCE CARD

**Money Manager App - Testing & Deployment Ready** ✅

---

## 🚀 START APP (Pick One)

### Option 1: Quickest - Expo Go (2 minutes)
```bash
npm run start
# Then press 'a' for Android emulator
# Or 'i' for iOS simulator
```

### Option 2: Real APK - Build & Install (10 minutes)
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --local
adb install path/to/app.apk
```

### Option 3: Via Android Studio
```bash
# Download Android Studio
# Create Virtual Device
# Run: npx expo start
# Press 'a'
```

---

## 📱 PERMISSION TESTING CHECKLIST

### SMS Permission
```
When: First app launch
Where: Dashboard > SMS Transactions section
Expect: "🔐 Request Permission" button
Action: Tap button
Result: System dialog appears → Grant → "✅ Permission Granted"
```

### Notification Permission  
```
When: First budget/due created
Where: Settings or notification section
Expect: "Allow notifications?" dialog
Action: Tap "Allow"
Result: "✅ Notifications Enabled"
```

---

## 📨 SMS TESTING IN 5 STEPS

### Step 1: Make a Real Transaction
```
Go to ATM/Shop → Swipe card → Get SMS from bank
Takes 1-2 minutes
```

### Step 2: Open Money Manager App
```
Dashboard screen should load
SMS Transactions section visible
```

### Step 3: Tap "📨 Import SMS"
```
Progress bar fills (1-5 seconds)
Shows: "Syncing SMS Transactions"
```

### Step 4: Wait for Completion
```
Shows: "✅ Sync complete! X SMS read, Y transactions added"
Example: "SMS: 5 read, 4 transactions added"
```

### Step 5: Verify Data
```
✅ Amount matches SMS exactly
✅ Merchant name extracted  
✅ Date/time captured
✅ Account recognized
✅ Category auto-filled
✅ Appears in transaction list
✅ Dashboard totals update
```

---

## 🔔 NOTIFICATION TESTING IN 3 STEPS

### Test Budget Alert
```
Step 1: Go to Budgets → Add Budget (Food, ₹2000)
Step 2: Add transaction (Food, ₹1600)
Step 3: Wait 5 seconds

Result: "🟡 Food is 80% of budget" notification appears
```

### Test Due Reminder
```
Step 1: Go to Dues → Add Due (due today)
Step 2: Enable reminder
Step 3: Wait until due time

Result: "📌 Reminder" notification appears
```

### Test Overdue Alert
```
Step 1: Create due from 3 days ago
Step 2: App running
Step 3: Wait 5 seconds

Result: "⚠️ Overdue" notification appears
```

---

## ✏️ MANUAL TRANSACTION TESTING

### Add Transaction
```
Dashboard → + Button → Fill Details:
├─ Amount: 150
├─ Merchant: Starbucks
├─ Category: Food
├─ Account: HDFC
├─ Date: Today
└─ Tap "Save"

Result: Transaction appears in list immediately
         Dashboard stats update
```

### Edit Transaction
```
Tap transaction → Edit → Change amount → Save
Result: Updated in list and dashboard
```

### Delete Transaction
```
Tap transaction → Delete → Confirm
Result: Removed from list and dashboard
```

---

## 🔍 FULL FEATURE CHECKLIST

### Core Features ✅
- [x] App loads without errors
- [x] Dark mode/Light mode toggle
- [x] Navigation between screens
- [x] Dashboard displays stats

### SMS Features
- [ ] SMS permission request
- [ ] SMS import working
- [ ] Transactions parsed correctly
- [ ] No duplicates
- [ ] Multiple bank formats

### Notification Features
- [ ] Notification permission request
- [ ] Budget alerts at 80% & 100%
- [ ] Due date reminders
- [ ] Overdue alerts
- [ ] Sound & vibration

### Manual Entry
- [ ] Add transaction modal
- [ ] Edit transaction
- [ ] Delete transaction
- [ ] Categories work
- [ ] Tags work

### Filtering
- [ ] Date range filter
- [ ] Transaction type filter
- [ ] Account filter
- [ ] Category filter
- [ ] Merchant search

### Analytics
- [ ] Dashboard stats accurate
- [ ] Monthly breakdown
- [ ] Trends charts
- [ ] Category breakdown
- [ ] Merchant leaderboard

### Budgets & Dues
- [ ] Create budget
- [ ] Track spending
- [ ] Create due
- [ ] Mark complete
- [ ] Overdue tracking

### Data Management
- [ ] Export to JSON
- [ ] Import from backup
- [ ] No data loss on restart
- [ ] Sync to database

---

## 🐛 QUICK TROUBLESHOOTING

### SMS Not Reading
```
Check 1: Settings > Apps > Permissions > SMS = "Allow"
Check 2: At least 1 SMS from bank in inbox
Check 3: SMS format contains amount (₹500 or 500)
Check 4: Restart app and try again
```

### Notifications Not Appearing
```
Check 1: Settings > Notifications > MoneyManager = "On"
Check 2: Device volume is not mute
Check 3: Do Not Disturb mode is off
Check 4: App running in background
```

### Transaction Not Saving
```
Check 1: Internet connection active
Check 2: Amount filled in correctly
Check 3: Account selected
Check 4: Try again (network delay)
```

### App Crashing
```
Check 1: Restart app
Check 2: Clear app cache (Settings > App > Clear Cache)
Check 3: Reinstall app
Check 4: Check logs: npm run start → Look for red errors
```

---

## 📊 REAL-WORLD TEST SCHEDULE

### Day 1: Setup & SMS (30 min)
- [x] Install app
- [x] Grant permissions
- [x] Make 1 transaction
- [x] Import SMS
- [x] Verify 1 transaction

### Day 2: SMS Intensive (1 hour)
- [x] Make 5-10 transactions
- [x] Import all SMS
- [x] Verify all parsed correctly
- [x] Check merchant extraction
- [x] Test different bank formats

### Day 3: Notifications (30 min)
- [x] Create budget
- [x] Spend to trigger alert
- [x] Verify 80% notification
- [x] Spend to trigger 100%
- [x] Verify notifications sound/vibrate

### Day 4: Filtering (1 hour)
- [x] Test date range filter
- [x] Test category filter
- [x] Test merchant search
- [x] Combine multiple filters
- [x] Verify stats update

### Day 5: Full App (2 hours)
- [x] Test all screens
- [x] Test navigation
- [x] Dark mode toggle
- [x] Export data
- [x] Comprehensive testing

---

## ✨ SUCCESS INDICATORS

### App Ready if:
✅ No TypeScript compilation errors
✅ App loads in 3-5 seconds
✅ SMS import works
✅ Notifications appear
✅ Data saves correctly
✅ No crashes in 1 hour
✅ UI responsive

### Ready for Launch if:
✅ All features tested
✅ No critical bugs
✅ SMS parsing accurate
✅ Notifications working
✅ Performance acceptable
✅ Dark mode looks good
✅ Data exports correctly

---

## 🎯 KEY COMMANDS

```bash
# Start Development
npm run start

# Build APK
eas build --platform android --local

# Install APK
adb install app.apk

# Check Errors
npx tsc --noEmit

# View Logs
npx expo start  # Look for red text in terminal

# Clean Build
npm run clean
npm install
npm run start
```

---

## 📞 QUICK HELP

**Can't install APK?**
```bash
# Try: 
adb devices  # Should show your device
adb install /path/to/app.apk  # If not found, check path

# Or use file transfer:
# Copy APK to phone Downloads
# Open file manager on phone
# Tap APK to install
```

**SMS not importing?**
```
1. Check: Settings > SMS Permission = Allow
2. Check: Inbox has SMS from bank
3. Try: Restart app
4. Try: Make new transaction and wait for SMS
```

**Notification not working?**
```
1. Check: Settings > Notifications = On
2. Check: Volume is not mute
3. Try: Disable and re-enable
4. Try: Restart app
```

**App crashes on launch?**
```
1. Try: npm run clean && npm install
2. Try: adb uninstall <app>
3. Try: Reinstall APK
4. Check: Terminal for error messages
```

---

## 🚀 LAUNCH READINESS CHECKLIST

- [ ] All permissions working
- [ ] SMS import tested
- [ ] Notifications tested
- [ ] Manual entry working
- [ ] Filtering accurate
- [ ] Analytics correct
- [ ] No crashes in 2 hours
- [ ] Dark mode tested
- [ ] Export/import working
- [ ] Performance good

**If all checked → Ready for production! 🎉**

---

**Questions?** Check these guides:
- `COMPREHENSIVE_TESTING_GUIDE.md` - Full testing procedures
- `APK_BUILD_GUIDE.md` - Detailed build instructions
- `SMS_NOTIFICATION_TESTING.md` - SMS & notification specifics

**Ready to test? Run:**
```bash
npm run start
```

**Good luck! 🚀**
