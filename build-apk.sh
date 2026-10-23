#!/usr/bin/env bash
# Builds a debug APK. Needs: Node 20+, JDK 21 (or 17+), Android SDK (Android Studio installs it).
set -euo pipefail
npm install
npm run build
[ -d android ] || npx cap add android
# Camera + motion support inside the Android WebView
MANIFEST=android/app/src/main/AndroidManifest.xml
grep -q 'android.permission.CAMERA' "$MANIFEST" || sed -i 's#</manifest>#    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n</manifest>#' "$MANIFEST"
npx cap sync android
cd android && ./gradlew assembleDebug
echo "APK: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
