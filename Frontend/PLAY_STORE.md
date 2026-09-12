# Medixo Android / Play Store

The Android wrapper is in `Frontend/android` and is built with Capacitor.

## Project details

- App name: Medixo
- Package ID: `com.medixo.healthcare`
- Web entry: the production Vite build in `Frontend/dist`
- Release artifact: `Frontend/android/app/build/outputs/bundle/release/app-release.aab`

## Local workflow

From `Frontend`:

```bash
npm install
npm run android:sync
npm run android:open
```

Android Studio is required to run an emulator/device and to create the signed release bundle.

## Play Store release

1. Open `Frontend/android` in Android Studio.
2. Install the Android SDK platform and build tools for API 35.
3. Create a release keystore and keep it outside Git.
4. Configure the release signing key in Android Studio or Gradle.
5. Run `npm run android:aab` after signing is configured.
6. Upload the generated `.aab` to Google Play Console.
7. Complete the store listing, privacy policy, data safety form, content rating, screenshots, app icon, and closed testing requirements.

The app uses the deployed backend URL from the frontend build. Set `VITE_API_URL` to the production API before running `npm run android:sync`.

## Notifications

The web dashboard notification center remains available inside the Android web shell. Native Android push notifications require a Firebase Android app, `google-services.json`, and a native Firebase/Capacitor push integration before release. Do not commit `google-services.json` or a signing keystore.
