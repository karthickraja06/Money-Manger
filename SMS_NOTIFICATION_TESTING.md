# 📱 SMS & NOTIFICATION VERIFICATION GUIDE

**Date**: December 25, 2025
**Focus**: Complete SMS reading and notification testing

---

## 🔍 PRE-TEST VERIFICATION

### Step 1: Verify SMS Service is Ready

**Check SMS Service Implementation:**
```bash
# File: src/services/sms.ts

Key features to verify:
✅ checkPermissionStatus() exists
✅ requestPermissions() exists  
✅ getSMS() exists to read messages
✅ filterBankSMS() exists
✅ parseSMSMessage() exists

All present = Ready for testing
```

### Step 2: Verify Notification Service is Ready

**Check Notification Service Implementation:**
```bash
# File: src/services/notificationService.ts

Key features to verify:
✅ requestPermissions() exists
✅ sendNotification() exists
✅ scheduleNotification() exists

All present = Ready for testing
```

### Step 3: Verify Parser Logic

**Check SMS Parser:**
```bash
# File: src/services/parser.ts

Supported bank formats:
✅ HDFC
✅ SBI
✅ ICICI
✅ Axis
✅ Kotak
✅ Paytm
✅ PhonePe
✅ Google Pay

Test one from each bank
```

---

## 📱 PERMISSION TESTING

### Test 1: SMS Permission Request on First Launch

#### What to Do:
```
1. Fresh app install (no permissions granted yet)
2. Open app
3. Go to Dashboard tab
4. Look for "📱 SMS Transactions" section
5. Tap "🔐 Request Permission" button
```

#### Expected Result:
```
✅ System dialog appears: "Allow MoneyManager to access SMS?"
✅ Two buttons: "Allow" and "Deny"
✅ Tapping "Allow" grants SMS permission
✅ Tapping "Deny" shows permission required message
```

#### If Not Working:
```
❌ No dialog appears?
   - Check: App already has permission
   - Try: App Settings > Permissions > SMS > Deny
   - Then re-open app and tap Request again

❌ Permission denied?
   - Check: Device supports SMS reading (Android 6+)
   - Try: Grant from Settings > Apps > Permissions > SMS
   - Restart app after granting
```

---

### Test 2: Notification Permission Request

#### What to Do:
```
1. Go to settings or notification section
2. Look for notification permission request
3. Grant permission when prompted
```

#### Expected Result:
```
✅ System dialog appears: "Allow notifications?"
✅ Two buttons: "Allow" and "Don't Allow"
✅ After allowing, show "✅ Notifications Enabled"
✅ Can configure notification sound/vibration
```

#### If Not Working:
```
❌ No notification dialog?
   - Check: Already granted in settings
   - Try: Settings > Notifications > Toggle On
   - Restart app

❌ Notifications not working?
   - Check: Device notification settings
   - Check: App notification settings
   - Check: Do Not Disturb mode off
```

---

## 📨 SMS READING VERIFICATION

### Test 3: SMS Import Basic Flow

#### Setup:
```
1. Ensure SMS permission granted
2. Have at least 1 SMS from bank in inbox
3. Be on Dashboard screen
```

#### What to Do:
```
Step 1: Tap "📨 Import SMS" button
Step 2: Watch progress bar fill (should take 1-5 seconds)
Step 3: Wait for completion message
Step 4: Check if new transactions appear in list
```

#### Expected Result:
```
✅ Progress bar shows from 0% to 100%
✅ Message says: "Syncing SMS Transactions"
✅ After completion: "✅ Sync complete! X SMS read, Y transactions added"
✅ New transactions appear in dashboard
✅ Transaction amounts match SMS amounts exactly
✅ Merchant names extracted correctly
```

#### Sample Output:
```
✅ Sync Successful
   SMS: 15 read
   Transactions: 12 added
   Duration: 3 seconds
```

---

### Test 4: SMS Parsing Accuracy

#### Create Test SMS:
```
Via Android Emulator:
1. Open emulator control panel (...)
2. Go to "Telephony" tab
3. Send SMS to emulator phone number

Via Real Device:
1. Ask colleague/friend to send bank SMS
2. Or manually transfer SMS from another phone
```

#### Test Bank SMS Formats:

**Test 1: HDFC Debit**
```
SMS Text:
"HDFC: Debit of 500 at AMAZON on Dec 25 16:30. Bal: 50000"

Expected Parsing:
✅ Amount: 500
✅ Type: Debit/Expense
✅ Merchant: Amazon
✅ Account: HDFC
✅ Balance: 50000
✅ Date: Dec 25
✅ Time: 16:30
```

**Test 2: SBI UPI Transfer**
```
SMS Text:
"SBI: UPI to John - ₹1000 at 12:30 on 25-Dec. Bal: 25000"

Expected Parsing:
✅ Amount: 1000
✅ Type: UPI Transfer
✅ Recipient: John
✅ Account: SBI
✅ Time: 12:30
```

**Test 3: ICICI Credit Card**
```
SMS Text:
"ICICI: Transaction of 2000 at Starbucks approved. Bal: 30000"

Expected Parsing:
✅ Amount: 2000
✅ Type: Credit
✅ Merchant: Starbucks
✅ Account: ICICI
```

**Test 4: Refund Transaction**
```
SMS Text 1:
"AMAZON: Charged 2000 on 20-Dec. Bal: 48000"

SMS Text 2:
"AMAZON: Refund 500 on 22-Dec. Bal: 48500"

Expected Parsing:
✅ Both imported as separate transactions
✅ Can link refund to original
✅ Net amount calculated: 2000 - 500 = 1500
```

---

### Test 5: Duplicate SMS Prevention

#### What to Do:
```
Step 1: Tap "Import SMS" (imports 10 transactions)
Step 2: Wait for completion
Step 3: Note transaction count (e.g., "10 transactions")
Step 4: Tap "Import SMS" again immediately
Step 5: Check result
```

#### Expected Result:
```
✅ Second import shows: "0 new transactions"
✅ No duplicates created
✅ Same amount charged only once
✅ Database has exactly 10 transactions, not 20
```

#### If Duplicates Appear:
```
❌ Duplicate found?
   Issue: SMS deduplication not working
   Solution: Clear transactions and re-import
   Or: Manually delete duplicates
```

---

### Test 6: SMS with Various Transaction Types

#### Test Withdrawal:
```
SMS: "SBI: ATM Withdrawal of 5000 at XYZ location. Bal: 25000"
Expected:
✅ Amount: 5000
✅ Type: Withdrawal/ATM
✅ Category: Cash Withdrawal
✅ Shown as Expense
```

#### Test Credit (Income):
```
SMS: "ICICI: Credit of 25000 for your salary on 1-Dec. Bal: 50000"
Expected:
✅ Amount: 25000
✅ Type: Credit/Income
✅ Category: Salary (auto-detected)
✅ Shown as Income
```

#### Test Mobile Recharge:
```
SMS: "AIRTEL: Mobile recharge of 99 successful. Bal: 10000"
Expected:
✅ Amount: 99
✅ Type: Recharge
✅ Category: Mobile Recharge
✅ Shown as Expense
```

#### Test Transfer:
```
SMS: "HDFC: Transfer to ABC account ₹500 at 14:00. Bal: 45000"
Expected:
✅ Amount: 500
✅ Type: Transfer
✅ Merchant: ABC account
✅ Category: Transfer
```

---

## 🔔 NOTIFICATION TESTING

### Test 7: Budget Alert Notifications

#### Setup:
```
Step 1: Go to Budget Screen
Step 2: Create budget: Food category, ₹2000/month
Step 3: Make transactions to test thresholds
```

#### Test 80% Threshold Notification:
```
Action:
- Add expense: Food, ₹1600 (80% of 2000)
- Wait 5 seconds

Expected:
✅ Notification appears on screen
✅ Shows: "🟡 Budget Alert"
✅ Shows: "Food is 80% of budget"
✅ Shows amount and percentage
✅ Sound plays (if enabled)
✅ Vibration occurs (if enabled)
```

#### Test 100% Threshold Notification:
```
Action:
- Add expense: Food, ₹2000 total spent (100%)
- Wait 5 seconds

Expected:
✅ Notification appears on screen
✅ Shows: "🔴 Budget Exceeded"
✅ Shows: "Food budget exceeded by 0"
✅ Shows in red color
✅ More urgent than 80% notification
```

#### Test Over-Budget Notification:
```
Action:
- Add expense: Food, ₹2500 total spent (125%)
- Wait 5 seconds

Expected:
✅ Notification shows overage amount
✅ Shows: "Food over budget by ₹500"
✅ Marked as high priority
✅ Cannot dismiss easily
```

---

### Test 8: Due Date Reminder Notifications

#### Setup:
```
Step 1: Go to Dues Screen
Step 2: Add due: "Lend ₹1000 to John, due today at 5 PM"
Step 3: Enable reminders
```

#### Test Reminder on Due Date:
```
Action:
- Set due date to today 5 PM
- Wait until 5 PM
- App running in background

Expected:
✅ Notification appears: "📌 Reminder: Lend to John"
✅ Shows: "Due amount: ₹1000"
✅ Shows time: 5:00 PM
✅ Tapping opens due details
✅ Can mark as complete from notification
```

#### Test Advance Reminder:
```
Action:
- Set due date to tomorrow
- Configure: "Remind 1 day before"
- Wait until tomorrow

Expected:
✅ Notification appears at 9 AM (default)
✅ Shows: "📌 Reminder: Lend to John (Due Tomorrow)"
✅ Amount displayed correctly
✅ Can dismiss or act
```

---

### Test 9: Overdue Notifications

#### Setup:
```
Step 1: Add due: "Lend ₹500 to Sarah, due 3 days ago"
Step 2: Don't mark as complete
Step 3: Go to background
```

#### Expected Result:
```
✅ Notification appears immediately
✅ Shows: "⚠️ Overdue: Lend to Sarah"
✅ Shows: "Due 3 days ago"
✅ Amount: ₹500
✅ Shows in orange/red warning color
✅ Sound plays immediately
✅ Vibration pattern indicates urgency
✅ Cannot swipe to dismiss (requires action)
```

---

### Test 10: Multiple Simultaneous Notifications

#### Setup:
```
Step 1: Create 3 budgets and exceed them all
Step 2: Add 3 overdue dues
Step 3: Wait for all notifications
```

#### Expected Result:
```
✅ All notifications appear (stacked)
✅ Can swipe through each
✅ Can group by type
✅ Priority respected (overdue > budget alert)
✅ Each shows correct information
✅ No notification crashes app
```

---

## 🧪 INTEGRATION TESTING

### Test 11: SMS → Transaction → Budget Flow

#### Complete Workflow:
```
Step 1: Make bank transaction (₹500 at Starbucks)
        ⬇️
Step 2: Receive bank SMS
        ⬇️
Step 3: Import SMS in app
        ⬇️
Step 4: Transaction appears in list
        ⬇️
Step 5: Category auto-detected: Food/Beverages
        ⬇️
Step 6: Budget "Food" updates (now 500/2000)
        ⬇️
Step 7: No alert (only 25%)

Expected:
✅ Transaction imported correctly
✅ Amount matches SMS
✅ Merchant extracted correctly
✅ Budget updated automatically
✅ No manual action needed
```

---

### Test 12: Due → Reminder → Notification Flow

#### Complete Workflow:
```
Step 1: Add due: "Borrow ₹1000 from Mom, due in 2 days"
        ⬇️
Step 2: Set reminder: 1 day before
        ⬇️
Step 3: Tomorrow, notification appears
        ⬇️
Step 4: Tap notification
        ⬇️
Step 5: Due detail screen opens
        ⬇️
Step 6: Tap "Remind Me Later" or "Paid"
        ⬇️
Step 7: Reminder reschedules or marks complete

Expected:
✅ Reminder scheduled correctly
✅ Notification appears at right time
✅ Can take action from notification
✅ Status updates in app
```

---

### Test 13: Data Persistence Across Restarts

#### What to Do:
```
Step 1: Import 5 transactions via SMS
Step 2: Close app completely
Step 3: Reopen app
Step 4: Check transaction list
```

#### Expected Result:
```
✅ All 5 transactions still visible
✅ Amounts unchanged
✅ Categories preserved
✅ No data loss
✅ Database sync successful
```

---

## ✅ TESTING CHECKLIST

### SMS Features
- [ ] SMS permission request appears
- [ ] Permission grant/deny works
- [ ] SMS import button responsive
- [ ] Progress bar shows correctly
- [ ] Transactions imported accurately
- [ ] Amounts match SMS exactly
- [ ] Merchant names extracted
- [ ] Dates parsed correctly
- [ ] Times extracted properly
- [ ] No duplicate transactions
- [ ] Multiple bank formats supported
- [ ] Refunds recognized
- [ ] Withdrawals recognized
- [ ] Transfers recognized
- [ ] All transaction types work

### Notification Features
- [ ] Notification permission requested
- [ ] Permission grant works
- [ ] 80% budget alert appears
- [ ] 100% budget alert appears
- [ ] Over-budget alerts show overage
- [ ] Due date reminders sent
- [ ] Advance reminders work
- [ ] Overdue notifications appear
- [ ] Notification text accurate
- [ ] Notification sound works
- [ ] Notification vibration works
- [ ] Can dismiss notifications
- [ ] Can act from notification
- [ ] Multiple notifications stack
- [ ] Priority order respected

### Manual Entry
- [ ] Can open add transaction modal
- [ ] Amount field validates
- [ ] Date picker works
- [ ] Category dropdown works
- [ ] Merchant field accepts input
- [ ] Notes field works
- [ ] Can save transaction
- [ ] Transaction appears immediately
- [ ] Dashboard stats update
- [ ] Can edit transaction
- [ ] Can delete transaction

---

## 📊 TESTING REPORT TEMPLATE

```
SMS & NOTIFICATION TEST REPORT
Date: ___________
Device: ___________ (Model, Android Version)

SMS TESTS PASSED:
☑ Test 1: Permission request
☑ Test 2: SMS import basic
☑ Test 3: Format parsing (Bank: ___)
☑ Test 4: Duplicate prevention
☑ Test 5: Transaction types
☑ Total SMS: ___ read, ___ imported

NOTIFICATION TESTS PASSED:
☑ Test 6: 80% budget alert
☑ Test 7: 100% budget alert
☑ Test 8: Due reminder
☑ Test 9: Overdue alert
☑ Test 10: Multiple notifications

ISSUES FOUND:
1. ___________________________
2. ___________________________
3. ___________________________

PERFORMANCE:
- SMS import speed: __ seconds
- Notification delay: __ seconds
- App memory usage: __ MB
- Battery drain: __ %/hour

FINAL RATING:
SMS Features: __ / 10
Notifications: __ / 10
Overall: __ / 10

READY FOR PRODUCTION: [ ] YES [ ] NO
```

---

## 🚨 TROUBLESHOOTING SMS & NOTIFICATIONS

### SMS Not Reading
```
Problem: SMS permission denied
Solution:
1. Go to Settings > Apps > MoneyManager > Permissions > SMS
2. Change to "Allow"
3. Restart app
4. Try SMS import again

Problem: No SMS in inbox
Solution:
1. Check with bank if SMS enabled
2. Try making small transaction
3. Wait for SMS to arrive
4. Then import

Problem: SMS format not recognized
Solution:
1. Check SMS format matches bank pattern
2. Verify amount is clearly shown
3. Try SMS from different bank
4. Add pattern to parser if needed
```

### Notifications Not Appearing
```
Problem: No notification permission
Solution:
1. Go to Settings > Notifications > MoneyManager
2. Toggle "Allow" ON
3. Restart app
4. Create condition for notification
5. Wait 5-10 seconds

Problem: Do Not Disturb mode
Solution:
1. Go to Settings > Do Not Disturb
2. Turn OFF or set to "Allow all"
3. Retry notification test

Problem: Notification service not running
Solution:
1. Restart app completely
2. Check: Settings > Battery > Optimization
3. Remove MoneyManager from battery saver
4. Restart device
5. Try again

Problem: Notification sound/vibration not working
Solution:
1. Check device volume is ON
2. Check: Settings > Sound > App notifications
3. Set to "Loud" or "Vibrate"
4. Restart app
5. Test again
```

---

## 🎯 NEXT STEPS

### If All Tests Pass ✅
1. Proceed to full feature testing
2. Test analytics and filters
3. Test data export
4. Document success
5. Prepare for launch

### If Issues Found 🐛
1. Document exact issue
2. Note steps to reproduce
3. Try troubleshooting above
4. If persists, check logs:
   ```bash
   # In terminal:
   npx expo start
   # Look for error messages
   ```
5. Contact support if critical

### Ready to Test?
```bash
# Run the app:
npm run start

# Then press 'a' for Android emulator
# Or 'i' for iOS simulator
# Or scan QR with Expo Go app
```

---

**SMS & Notification testing is critical for app success.**
**Follow this guide thoroughly before launch. 🚀**
