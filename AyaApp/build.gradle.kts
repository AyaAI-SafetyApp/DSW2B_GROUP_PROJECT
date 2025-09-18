plugins {
    // Existing plugins you already had...
    id("com.android.application") version "8.5.0" apply false
    id("com.android.library") version "8.5.0" apply false

    // ✅ Google services plugin
    id("com.google.gms.google-services") version "4.4.3" apply false

    // ✅ Firebase App Distribution plugin
    id("com.google.firebase.appdistribution") version "5.0.0" apply false
}
