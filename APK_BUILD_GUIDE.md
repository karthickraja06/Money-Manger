# 📦 APK BUILD & DEPLOYMENT GUIDE

**Date**: December 25, 2025
**Version**: 1.0.0

---

## 🚀 QUICK START (3 MINUTES)

### Option A: Test with Expo Go (Fastest)
```bash
# In terminal, run:
npm run start

# Then in terminal menu:
# Press 'a' for Android
# OR press 'i' for iOS

# Scans QR code with Expo Go app to load
```

### Option B: Build Real APK (10 Minutes)
```bash
# First time only:
npm install -g eas-cli
eas login
eas build:configure

# Then build:
eas build --platform android --local

# Install on device:
adb install <path-to-apk>
```

---

## 📋 PREREQUISITES

### What You Need:
- ✅ Node.js 16+ (`node --version`)
- ✅ npm 8+ (`npm --version`)
- ✅ Android device OR Android emulator
- ✅ Expo account (free at expo.dev)
- ✅ EAS CLI installed globally

### Check Your Setup:
```bash
node --version          # Should be v16 or higher
npm --version           # Should be v8 or higher
expo --version          # Should exist
eas --version           # Should exist
```

### Install Missing Tools:
```bash
# Install Expo CLI
npm install -g expo-cli

# Install EAS CLI
npm install -g eas-cli

# Install Android SDK (if building native)
# Download Android Studio from developer.android.com
```

---

## 🎯 COMPLETE APK BUILD PROCESS

### Step 1: Prepare Project
```bash
# Navigate to project
cd d:\karthick\projects\MoneyManager\MoneyManager

# Install dependencies
npm install

# Verify no TypeScript errors
npm run type-check  # or: tsc --noEmit
```

### Step 2: Setup Expo Account
```bash
# Create free account at https://expo.dev

# Login in terminal:
eas login

# Enter email and password
# Two-factor auth if enabled
# Confirmation shows: "Logged in as ___"
```

### Step 3: Configure EAS Build
```bash
# In project directory:
eas build:configure

# Prompts:
# "What is your app ID?"
# Answer: com.moneymanager.app (or similar)

# "Configure for which platform(s)?"
# Select: Android
```

### Step 4: Build APK Locally (Recommended)
```bash
# This builds on your machine (fastest)
eas build --platform android --local

# First time will:
# 1. Install build tools (~2-3 minutes)
# 2. Build app (~3-5 minutes)
# 3. Generate APK file (~1 minute)

# Total: 5-10 minutes

# Terminal shows: "Signed APK saved to: /path/to/app.apk"
```

### Step 5: Transfer APK to Device

**Option A: Via USB Cable**
```bash
# Connect Android device with USB

# In terminal:
adb install /path/to/app.apk

# Device will show: "Installing..."
# Then: "App Installed Successfully"
```

**Option B: Via Email/Cloud**
```bash
# Download APK from build URL shown in terminal
# Email APK to yourself
# Download on phone from email
# Tap APK to install
```

**Option C: Via USB File Transfer**
```bash
# Copy APK file from /path/to/app.apk
# Connect phone with USB
# Paste APK to Downloads folder
# Open file manager on phone
# Tap APK to install
```

---

## 🔌 ALTERNATIVE: BUILD ON EXPO CLOUD

### If Local Build Fails
```bash
# Build on Expo servers (no local build tools needed):
eas build --platform android

# Pros:
# - No local Android SDK needed
# - Reliable
# - Manages signing certificates

# Cons:
# - Takes 15-20 minutes
# - Requires Expo account
# - Depends on internet
```

---

## 📱 ANDROID EMULATOR SETUP (Alternative to Device)

### Install Android Studio
1. Download from: https://developer.android.com/studio
2. Run installer
3. Follow setup wizard
4. When complete, restart computer

### Create Virtual Device
```bash
# Option A: Via Android Studio GUI
1. Open Android Studio
2. Tools > Device Manager
3. Click "Create Device"
4. Select: Pixel 4a (or similar)
5. Select: Android 13 (or latest)
6. Click "Finish"

# Option B: Via Command Line
sdkmanager --list
emulator -avd "Pixel_4a" -netdelay none -netspeed full
```

### Run Emulator
```bash
# In terminal:
emulator -avd Pixel_4a

# Or in Android Studio:
1. Open Device Manager
2. Click Play button on device
3. Wait for emulator to start (~30 seconds)
```

### Load App in Emulator
```bash
# Terminal:
npx expo start

# Then press 'a'
# App loads in emulator
```

---

## ⚙️ ENVIRONMENT SETUP

### Configure Supabase Connection
Before testing, add your Supabase credentials:

**File**: `src/services/supabase.ts`
```typescript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Get credentials from:
1. Go to https://supabase.com
2. Open your project
3. Settings > API
4. Copy Project URL
5. Copy Anon Key (Public)
6. Paste into supabase.ts

### Test Supabase Connection
```bash
# In project directory:
npm run test

# Should show:
# ✅ Database connection OK
# ✅ Authentication ready
# ✅ RLS policies active
```

---

## 🧪 PRE-LAUNCH TESTING

### Build Verification Checklist
```bash
# Run these commands:

# 1. Install dependencies
npm install

# 2. Check for TypeScript errors
npx tsc --noEmit
# Should show: No errors

# 3. Check for lint errors
npm run lint
# Should show: No critical errors

# 4. Start dev server
npm run start

# 5. Test on device/emulator
# Press 'a' and verify app loads

# 6. Test SMS permission request
# Should appear on first launch

# 7. Test notification permission request
# Should appear in Settings

# 8. Test adding transaction
# Should appear in list immediately

# 9. Test SMS sync
# Import at least 1 SMS
# Verify transaction appears

# 10. Test filters
# Filter by date, type, account
# Verify results accurate
```

---

## 📊 BUILD OUTPUT EXPLANATION

### Successful Build Output:
```
✅ Creating APK...
✅ Signing APK with certificate...
✅ Compressing assets...
✅ Building complete!

📦 Output:
   Location: /home/username/.eas/build/app-release.apk
   Size: 45 MB
   SHA256: abc123...

✨ Build successful!
🎉 Ready for testing
```

### What Each File Means:
- `app-release.apk` = Production app, ready to use
- `app-debug.apk` = Debug app, for developers only
- `.aab` = Android App Bundle, for Play Store only

---

## 🚨 COMMON BUILD ERRORS & SOLUTIONS

### Error 1: "SDK not found"
```
❌ Error: Android SDK not found

Solution:
1. Install Android Studio
2. Open Android Studio
3. Tools > SDK Manager
4. Install Android 12+
5. Set ANDROID_HOME in environment variables
6. Restart terminal
7. Try build again
```

### Error 2: "TypeScript errors"
```
❌ Error: Found 3 TypeScript errors

Solution:
1. Run: npx tsc --noEmit
2. Fix each error shown
3. Run again to verify
4. Then try build again
```

### Error 3: "Out of memory"
```
❌ Error: Java heap space

Solution:
1. Close other applications
2. Increase build memory:
   export GRADLE_OPTS="-Xmx4096m"
3. Try build again

Or use cloud build:
   eas build --platform android
```

### Error 4: "Permission denied"
```
❌ Error: Permission denied for APK file

Solution:
# On Windows:
eas build --platform android --local

# On Mac/Linux:
chmod +x node_modules/.bin/*
eas build --platform android --local
```

### Error 5: "Timeout"
```
❌ Error: Build timeout after 30 minutes

Solution:
1. Try local build: eas build --platform android --local
2. Close other applications
3. Free up disk space (need 5+ GB)
4. Restart computer
5. Try build again
```

---

## 📦 APK SIZE OPTIMIZATION

### Current App Size: ~45-50 MB

### What's Included:
- React Native runtime: ~8 MB
- Expo framework: ~5 MB
- App code + assets: ~8 MB
- Dependencies (npm): ~24 MB

### How to Reduce Size (Optional):
```bash
# 1. Remove unused dependencies:
npm uninstall <package-name>

# 2. Optimize images:
# Use ImageOptim or similar
# Convert to WebP format

# 3. Code splitting (advanced):
# Split features into lazy bundles
# Only load when needed

# 4. Remove dev dependencies from build:
# Automatically done by build process
```

---

## 🔐 SIGNING & RELEASE CERTIFICATES

### About App Signing:
- EAS automatically manages signing
- Certificate stored securely
- Never shared or exposed
- Different certs for each build

### Manual Signing (Advanced):
```bash
# Generate signing key (one-time):
keytool -genkey -v -keystore release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias release-key

# Use in EAS:
eas build --platform android --local \
  --keystore-path=release-key.jks
```

---

## 📈 DEPLOYMENT TO PLAY STORE

### Prepare for Store
```bash
# 1. Create Google Play account ($25 one-time fee)
# 2. Create app listing in Play Console
# 3. Add screenshots and description
# 4. Set content rating
# 5. Set privacy policy URL
```

### Build for Store
```bash
# Build app bundle:
eas build --platform android --release

# This creates: app.aab
# Upload to Play Console > Your app > Release > Production
```

### Release Schedule
```
Week 1: Internal Testing (you)
Week 2: Beta Testing (10-20 users)
Week 3: Gather Feedback
Week 4: Public Launch on Play Store
```

---

## ✨ SUCCESS INDICATORS

### APK Built Successfully:
✅ No errors in terminal
✅ APK file created (~45 MB)
✅ File is executable
✅ Signed properly

### App Installs Successfully:
✅ No permission errors
✅ App appears on home screen
✅ App icon shows correctly
✅ No crashes on launch

### App Functions Successfully:
✅ Dashboard loads
✅ SMS permission request appears
✅ Can add manual transaction
✅ Data saves to database

### Ready for Production:
✅ All features tested
✅ No critical bugs
✅ Performance acceptable
✅ User feedback positive

---

## 📞 NEXT STEPS

### If Build Succeeds:
1. ✅ Install APK on device
2. ✅ Test all features
3. ✅ Check SMS reading
4. ✅ Verify notifications
5. ✅ Test data export
6. ✅ Document any issues

### If Build Fails:
1. Read error message carefully
2. Check solutions above
3. Try alternative build method (cloud)
4. Post error in GitHub issues
5. Ask in Expo forums

### Performance Optimization:
1. Monitor app startup time
2. Check memory usage
3. Test with 100+ transactions
4. Verify scroll smoothness
5. Check battery drain

---

## 🎯 COMMAND REFERENCE

```bash
# Development
npm install                    # Install dependencies
npm run start                  # Start Expo dev server
npm run android               # Build and run on Android
npm run web                   # Build and run on web

# Type checking
npx tsc --noEmit             # Check TypeScript errors
npm run type-check           # Same as above

# Building APK
npm install -g eas-cli       # Install EAS CLI
eas login                    # Login to Expo
eas build:configure          # Configure build
eas build --platform android --local    # Build APK locally
eas build --platform android            # Build APK on cloud

# Installing APK
adb install app.apk          # Install APK via USB
adb devices                  # List connected devices
adb logcat                   # View app logs

# Cleaning
npm run clean                # Clean build artifacts
npm run reset                # Reset to initial state
```

---

**Ready to build? Run:**
```bash
eas build --platform android --local
```

**Questions? Check:**
- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Docs](https://docs.expo.dev/build/introduction)
- [React Native Docs](https://reactnative.dev/docs/getting-started)

**Good luck with your launch! 🚀**
