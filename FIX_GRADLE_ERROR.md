# Fix Gradle Error in Android Studio

## The Problem

The error `Unable to find method 'org.gradle.api.artifacts.Dependency org.gradle.api.artifacts.dsl.DependencyHandler.module(java.lang.Object)'` indicates a Gradle version incompatibility.

## Solution Steps

### Step 1: Check if Android folder exists

If you haven't run `npx cap add android` yet, do that first:
```bash
npx cap add android
```

### Step 2: Update Gradle Wrapper

The Android project needs Gradle 8.0+ for Capacitor 5.7.8.

1. Navigate to `android/gradle/wrapper/` folder
2. Edit `gradle-wrapper.properties`
3. Update to:

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.0-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

### Step 3: Update build.gradle files

#### Update `android/build.gradle`:

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.0.2'
        classpath 'com.google.gms:google-services:4.3.15'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

#### Update `android/app/build.gradle`:

Make sure it has:
```gradle
android {
    compileSdkVersion 34
    namespace "com.securevault.app"
    
    defaultConfig {
        applicationId "com.securevault.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Step 4: Clean and Rebuild

1. In Android Studio:
   - File → Invalidate Caches / Restart
   - Select "Invalidate and Restart"

2. Or from command line:
```bash
cd android
./gradlew clean
./gradlew build
```

### Step 5: Sync Project

In Android Studio:
- File → Sync Project with Gradle Files

## Alternative: Recreate Android Project

If the above doesn't work:

1. Delete the `android` folder
2. Run:
```bash
npx cap add android
npx cap sync
```
3. Open again:
```bash
npx cap open android
```

## Quick Fix Script

Run these commands in order:

```bash
# 1. Remove Android folder
rm -rf android

# 2. Re-add Android platform
npx cap add android

# 3. Sync
npx cap sync

# 4. Open in Android Studio
npx cap open android
```

## Verify Gradle Version

After opening in Android Studio:
1. File → Project Structure
2. Check Gradle version is 8.0 or higher
3. Check Android Gradle Plugin is 8.0.2 or higher

