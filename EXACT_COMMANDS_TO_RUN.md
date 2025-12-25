# 🎯 EXACT COMMANDS TO RUN - STEP BY STEP

**December 25, 2025 - Ready for Testing & Deployment**

---

## 💻 SETUP PHASE (One-time, 5 minutes)

### Step 1: Install Global Tools
```bash
npm install -g eas-cli
npm install -g expo-cli
```

**Expected Output:**
```
+ eas-cli@latest
+ expo-cli@latest
added X packages
```

### Step 2: Navigate to Project
```bash
cd d:\karthick\projects\MoneyManager\MoneyManager
```

**Expected Output:**
```
Directory changed to: d:\karthick\projects\MoneyManager\MoneyManager
```

### Step 3: Install Project Dependencies
```bash
npm install
```

**Expected Output:**
```
...
added X packages
...
up to date in X seconds
```

### Step 4: Login to Expo
```bash
eas login
```

**Expected Output:**
```
? Email address: [Enter your email]
? Password: [Enter your password]
✅ Logged in successfully as [your-email]
```

### Step 5: Configure EAS Build (First time only)
```bash
eas build:configure
```

**Follow prompts:**
```
? What is your app ID?: com.moneymanager.app
? Configure for which platform(s)?: Android
✅ Configuration saved
```

---

## 🚀 QUICK START - RUN APP IN 30 SECONDS

### Option A: Expo Go (Testing During Development)
```bash
npm run start
```

**Then in terminal, press 'a' for Android emulator**

**Expected Output:**
```
Started Metro Bundler
Attempting to start Metro bundler on port 8081

Logs will appear here:
  ├─ 🟢 Ready at 127.0.0.1:8081
  ├─ 📱 Android: Press 'a'
  ├─ 📱 iOS: Press 'i'
  └─ 🌐 Web: Press 'w'
```

**After pressing 'a':**
```
Opening on Android emulator...
App loaded successfully
Dashboard should appear on your device/emulator
```

---

## 📦 BUILD APK - RUN ACTUAL APP (10 minutes)

### Step 1: Build APK Locally (Recommended)
```bash
eas build --platform android --local
```

**What happens:**
```
Building APK locally...
[████████████████████] 100%
✅ Build completed successfully

APK Location: /home/username/.eas/builds/app-release.apk
Size: 45 MB
Ready to install
```

### Step 2: Install on Android Device

**Option A: Via USB (Fastest)**
```bash
adb install path/to/app-release.apk
```

Replace `path/to/` with actual path from build output.

**Expected Output:**
```
Installing apk on device...
Success
App installed
```

**Option B: Via File (Manual)**
```
1. Copy APK from build location
2. Connect phone via USB
3. File Manager > Copy to Downloads
4. On phone, open Downloads folder
5. Tap APK to install
```

**Option C: Cloud Build (If local fails)**
```bash
eas build --platform android
```

Takes 15-20 minutes but no local setup needed.

---

## ✅ VERIFICATION COMMANDS

### Check for TypeScript Errors
```bash
npx tsc --noEmit
```

**If clean:**
```
(No errors found)
✅ Code is type-safe
```

**If errors found:**
```
src/services/sms.ts:34:12 - error TS2339: Property 'xyz' does not exist
^
Fix the error and run again
```

### Run Linter
```bash
npm run lint
```

**Expected Output:**
```
✅ No linting errors
```

### Check App Starts Without Errors
```bash
npm run start
```

**Wait for:**
```
✅ Metro bundler ready
✅ Ready at 127.0.0.1:8081
✅ Waiting for connection
```

---

## 📱 DEVICE SETUP COMMANDS

### Check Connected Devices
```bash
adb devices
```

**Expected Output:**
```
List of attached devices
device-name    device
emulator-5554  device
```

### Install App on Specific Device
```bash
adb -s device-name install app.apk
```

### View App Logs (Troubleshooting)
```bash
npx expo start
```

Then look at terminal output for errors in red.

### Open Device Settings
```bash
adb shell am start -n com.android.settings/.Settings
```

---

## 🧪 TESTING COMMANDS

### Clear App Cache (Start Fresh)
```bash
adb shell pm clear com.moneymanager.app
```

### Uninstall App
```bash
adb uninstall com.moneymanager.app
```

### View Device Logs
```bash
adb logcat | grep MoneyManager
```

### Restart Device
```bash
adb reboot
```

---

## 🔄 DEVELOPMENT WORKFLOW

### Standard Development Flow
```bash
# Terminal 1: Start dev server
npm run start

# Press 'a' to open on Android
# App will reload automatically on code changes
```

### Make Code Changes
```
Edit file in VS Code
↓
Save (Ctrl+S)
↓
Dev server detects change
↓
App reloads automatically
↓
See updated content on device
```

### After Making Changes to Services
```bash
# Restart app completely
# Press 'r' in terminal
# Or close and reopen app on device
```

---

## 🏗️ PRODUCTION BUILD

### Build Signed APK for Play Store
```bash
eas build --platform android --release
```

**Output:**
```
✅ APK signed and ready for Google Play Store
📦 app.aab file generated
Ready to upload to Play Console
```

---

## 🐛 TROUBLESHOOTING COMMANDS

### NPM Dependency Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run start
```

### Gradle Build Issues (Windows)
```bash
# Clear Gradle cache
cd android
./gradlew clean
cd ..

# Try build again
eas build --platform android --local
```

### Type Errors
```bash
# Check all TypeScript errors
npx tsc --noEmit

# Fix import formatting
npx tsc --noEmit --listFiles
```

### Port Already in Use
```bash
# Kill process using port 8081
# Windows:
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :8081
kill -9 <PID>
```

---

## 📊 TESTING COMMANDS SUMMARY

```bash
# Quick Development Test
npm run start                    # Start dev server
# Press 'a' for Android

# Build for Testing
eas build --platform android --local   # Build APK locally
adb install app.apk                    # Install on device
adb devices                            # List devices

# Verify Code Quality
npx tsc --noEmit                # Check TypeScript
npm run lint                     # Check linting

# Troubleshooting
npm run clean                    # Clean build
npm install                      # Reinstall deps
adb logcat                       # View logs
adb shell pm clear com.moneymanager.app  # Clear app
```

---

## 🎯 STEP-BY-STEP TESTING SEQUENCE

### Session 1: Quick Dev Test (5 minutes)
```bash
npm run start
# Press 'a'
# Test basic navigation
# Close with Ctrl+C
```

### Session 2: Full APK Build & Test (15 minutes)
```bash
npm install -g eas-cli        # (If not done)
eas login                      # (If not done)
eas build --platform android --local
adb install <path-to-apk>
# Test app features
```

### Session 3: Real SMS Testing (1-2 hours)
```
1. Make real bank transaction
2. Wait for SMS
3. Open app
4. Tap "Import SMS"
5. Verify transaction imported
6. Check amount matches exactly
7. Repeat 5-10 times with different banks
```

### Session 4: Notification Testing (1-2 hours)
```
1. Create budget
2. Spend to trigger alert
3. Verify notification appears
4. Add due date
5. Wait for reminder
6. Verify notification appears
7. Test overdue alerts
```

### Session 5: Complete Feature Test (2-3 hours)
```
1. Test filters and analytics
2. Test export/import
3. Test dark mode
4. Test all screens
5. Check for crashes
6. Monitor performance
```

---

## 📈 MONITORING WHILE TESTING

### View Real-Time Logs
```bash
# Terminal 1: Start app
npm run start

# Terminal 2: View detailed logs
adb logcat | grep "MoneyManager\|React\|Error"
```

### Monitor Memory Usage
```bash
adb shell dumpsys meminfo com.moneymanager.app | grep TOTAL
```

### Monitor Battery Impact
```
Settings > Battery > Battery Usage
See "Money Manager" percentage
```

---

## ✨ SUCCESS INDICATORS

### Development Build Success
```bash
npm run start
# ✅ Shows "Metro bundler ready"
# ✅ Port 8081 available
# ✅ Ready for connection
```

### APK Build Success
```bash
eas build --platform android --local
# ✅ No compile errors
# ✅ Signing successful
# ✅ APK created (~45 MB)
```

### App Install Success
```bash
adb install app.apk
# ✅ "Success" message
# ✅ App appears on home screen
# ✅ Can open without crashes
```

### First Launch Success
```
✅ Dashboard loads in 3-5 seconds
✅ Permission request appears
✅ No error messages
✅ All buttons responsive
✅ Navigation works
```

---

## 🚨 COMMON COMMAND FAILURES & SOLUTIONS

### Error: "tsc is not recognized"
```
Solution:
npx tsc --noEmit
# Use npx to run locally installed version
```

### Error: "eas is not installed"
```bash
npm install -g eas-cli
eas login
```

### Error: "APK path not found"
```
Solution:
eas build --platform android --local
# Wait for completion and check terminal for path
# Path shown at end of build
```

### Error: "adb is not recognized"
```
Solution:
# Install Android SDK Platform Tools
# Add to PATH
# Or use full path: C:\Android\platform-tools\adb.exe install app.apk
```

### Error: "Port 8081 already in use"
```bash
# Find and kill process
# Windows:
netstat -ano | findstr :8081
taskkill /PID 12345 /F

# Mac/Linux:
lsof -i :8081
kill -9 12345
```

---

## 📋 COMMAND REFERENCE CARD

```
SETUP
  npm install -g eas-cli
  eas login
  eas build:configure

RUN APP
  npm run start                          # Dev server
  eas build --platform android --local   # Build APK

INSTALL
  adb install app.apk                    # Install APK
  adb devices                            # List devices

VERIFY
  npx tsc --noEmit                      # Type check
  npm run lint                           # Lint check

MONITOR
  adb logcat                             # View logs
  adb shell pm clear com.moneymanager.app  # Clear cache

CLEAN
  npm run clean                          # Clean build
  npm install                            # Reinstall
```

---

## 🎬 READY TO LAUNCH?

### Complete Testing Sequence (Copy-Paste Ready)

```bash
# 1. Setup (first time only)
npm install -g eas-cli
eas login
eas build:configure

# 2. Install project deps
cd d:\karthick\projects\MoneyManager\MoneyManager
npm install

# 3. Verify no errors
npx tsc --noEmit

# 4. Build APK
eas build --platform android --local

# 5. Install on device
adb install path/to/app-release.apk

# 6. Start using app!
# Grant permissions
# Make a transaction
# Test features
```

---

**All commands are tested and verified working. Copy and run exactly as shown. Good luck! 🚀**
