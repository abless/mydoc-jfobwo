## Introduction

This document provides comprehensive guidance for deploying the Health Advisor React Native mobile application to both the iOS App Store and Google Play Store. It covers automated CI/CD pipelines, manual deployment procedures, environment-specific configurations, and best practices to ensure a smooth and efficient deployment process.

## Prerequisites

Before deploying the Health Advisor mobile application, ensure the following prerequisites are met:

1.  **Development Environment:**
    *   Node.js (v16.x or higher)
    *   npm or Yarn package manager
    *   React Native CLI
    *   Xcode (for iOS deployment)
    *   Android SDK and Build Tools (for Android deployment)
    *   Java Development Kit (JDK)

2.  **Accounts and Certificates:**
    *   Apple Developer Program membership
    *   App Store Connect account
    *   iOS Distribution Certificate and Provisioning Profile
    *   Google Play Developer account
    *   Google Play Developer API credentials (JSON key)

3.  **Environment Variables:**
    *   API endpoint URLs for development, staging, and production
    *   Authentication keys and secrets
    *   App Store Connect API key (for iOS deployment)
    *   Google Play Developer API key (for Android deployment)

4.  **Code Signing:**
    *   iOS Distribution Certificate and Provisioning Profile correctly configured in Xcode
    *   Android Keystore file and signing configuration set up in `android/app/build.gradle`

5.  **Version Control:**
    *   Git repository for the mobile application code
    *   GitHub account for CI/CD integration

## Deployment Environments

The Health Advisor mobile application is deployed to the following environments:

1.  **Development:**
    *   Used for local development and testing
    *   Connects to development API endpoints
    *   Debug builds with verbose logging

2.  **Staging:**
    *   Used for internal testing and QA
    *   Connects to staging API endpoints
    *   Release builds with limited logging

3.  **Production:**
    *   Used for public release on the App Store and Google Play Store
    *   Connects to production API endpoints
    *   Release builds with minimal logging and optimized performance

## CI/CD Pipeline

The Health Advisor mobile application uses GitHub Actions for automated CI/CD. The pipeline consists of two main workflows:

1.  **Mobile Build Workflow (`mobile-build.yml`):**
    *   Runs on every push to the `main` branch and pull requests
    *   Lints and type-checks the code
    *   Runs unit tests with coverage checks
    *   Builds the Android APK and iOS IPA files
    *   Uploads the build artifacts to GitHub Actions

2.  **Mobile Deploy Workflow (`mobile-deploy.yml`):**
    *   Runs when the Mobile Build workflow completes successfully
    *   Downloads the build artifacts
    *   Deploys the Android APK to Google Play Internal Testing track
    *   Deploys the iOS IPA to TestFlight
    *   Promotes the Android app to Google Play Production track
    *   Promotes the iOS app to the App Store
    *   Creates a deployment tag in Git
    *   Sends a deployment success notification to Slack

The CI/CD pipeline automates the following tasks:

*   Building the mobile application for both iOS and Android platforms
*   Running automated tests to ensure code quality
*   Signing the application with appropriate certificates
*   Deploying the application to the appropriate distribution channels
*   Notifying the team of successful deployments

## Manual Deployment

In addition to the automated CI/CD pipeline, the Health Advisor mobile application can also be deployed manually using the `deploy-mobile.sh` script. This script automates the following tasks:

1.  Building the mobile application for the specified platform and environment
2.  Signing the application with appropriate certificates
3.  Deploying the application to the appropriate distribution channels

To deploy the application manually, follow these steps:

1.  Clone the Git repository to your local machine.
2.  Install the required dependencies using `npm install`.
3.  Configure the environment variables for the target environment.
4.  Run the `deploy-mobile.sh` script with the appropriate parameters:

    ```bash
    ./scripts/deploy-mobile.sh --platform [android|ios|all] --env [dev|internal|production]
    ```

    For example, to deploy the Android application to the internal testing track, run the following command:

    ```bash
    ./scripts/deploy-mobile.sh --platform android --env internal
    ```

5.  Follow the on-screen instructions to complete the deployment process.

## iOS Deployment

To deploy the Health Advisor mobile application to the App Store, follow these steps:

1.  **Configure Xcode:**
    *   Open the `ios/HealthAdvisor.xcworkspace` file in Xcode.
    *   Select the `HealthAdvisor` project in the Project navigator.
    *   Select the `HealthAdvisor` target.
    *   In the `Signing & Capabilities` tab, configure the following settings:
        *   Team: Select your Apple Developer Program team.
        *   Bundle Identifier: Ensure the bundle identifier matches the one configured in App Store Connect.
        *   Automatically manage signing: Enable automatic signing or manually select the appropriate Distribution Certificate and Provisioning Profile.

2.  **Create an App Store Connect API Key:**
    *   Log in to App Store Connect.
    *   Navigate to `Users and Access > API Keys`.
    *   Click the `+` button to create a new API key.
    *   Enter a name for the key and select the `App Manager` role.
    *   Download the API key file and store it securely.

3.  **Configure Fastlane:**
    *   Install Fastlane using `gem install fastlane`.
    *   Create a `Fastfile` in the `ios` directory with the following content:

        ```ruby
        # ios/Fastfile
        default_platform(:ios)

        platform :ios do
          desc "Deploy to TestFlight"
          lane :beta do
            app_store_connect_api_key(
              key_id: ENV["APPSTORE_CONNECT_API_KEY_ID"],
              issuer_id: ENV["APPSTORE_CONNECT_API_KEY_ISSUER_ID"],
              key_filepath: ENV["APPSTORE_CONNECT_API_KEY_PATH"],
            )

            upload_to_testflight(
              ipa: "build/HealthAdvisor.ipa",
              skip_waiting_for_build_processing: true
            )
          end

          desc "Deploy to App Store"
          lane :release do
            app_store_connect_api_key(
              key_id: ENV["APPSTORE_CONNECT_API_KEY_ID"],
              issuer_id: ENV["APPSTORE_CONNECT_API_KEY_ISSUER_ID"],
              key_filepath: ENV["APPSTORE_CONNECT_API_KEY_PATH"],
            )

            upload_to_app_store(
              ipa: "build/HealthAdvisor.ipa",
              skip_metadata: true,
              skip_screenshots: true,
              submit_for_review: false,
              automatic_release: false
            )
          end
        end
        ```

4.  **Set Environment Variables:**
    *   Set the following environment variables:
        *   `APPSTORE_CONNECT_API_KEY_ID`: The ID of the App Store Connect API key.
        *   `APPSTORE_CONNECT_API_KEY_ISSUER_ID`: The issuer ID of the App Store Connect API key.
        *   `APPSTORE_CONNECT_API_KEY_PATH`: The path to the App Store Connect API key file.
        *   `IOS_APPLE_ID`: Your Apple ID.

5.  **Build and Deploy:**
    *   Run the `deploy-mobile.sh` script with the appropriate parameters:

        ```bash
        ./scripts/deploy-mobile.sh --platform ios --env production
        ```

    *   Or, use Fastlane directly:

        ```bash
        fastlane beta # For TestFlight
        fastlane release # For App Store
        ```

## Android Deployment

To deploy the Health Advisor mobile application to the Google Play Store, follow these steps:

1.  **Configure Android Keystore:**
    *   Generate a new keystore file using the `keytool` command:

        ```bash
        keytool -genkeypair -v -keystore release.keystore -alias healthadvisor -keyalg RSA -keysize 2048 -validity 10000
        ```

    *   Store the keystore file securely.

2.  **Configure Signing in Gradle:**
    *   Update the `android/app/build.gradle` file with the keystore information:

        ```gradle
        signingConfigs {
            release {
                storeFile file('release.keystore')
                storePassword 'your_keystore_password'
                keyAlias 'your_key_alias'
                keyPassword 'your_key_password'
            }
        }

        buildTypes {
            release {
                minifyEnabled true
                proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
                signingConfig signingConfigs.release
            }
        }
        ```

3.  **Create a Google Play Developer API Key:**
    *   Log in to the Google Play Console.
    *   Navigate to `API access`.
    *   Create a new service account.
    *   Grant the service account the `Editor` role.
    *   Download the service account's JSON key file.

4.  **Configure Fastlane:**
    *   Install Fastlane using `gem install fastlane`.
    *   Create a `Fastfile` in the `android` directory with the following content:

        ```ruby
        # android/Fastfile
        default_platform(:android)

        platform :android do
          desc "Deploy to Internal Testing Track"
          lane :internal do
            upload_to_play_store(
              track: 'internal',
              apk: 'app/build/outputs/apk/release/app-release.apk',
              json_key_data: ENV["GOOGLE_PLAY_JSON_KEY_DATA"],
              skip_upload_metadata: true,
              skip_upload_images: true,
              skip_upload_screenshots: true,
              release_status: 'completed'
            )
          end

          desc "Deploy to Production"
          lane :production do
            upload_to_play_store(
              track: 'production',
              apk: 'app/build/outputs/apk/release/app-release.apk',
              json_key_data: ENV["GOOGLE_PLAY_JSON_KEY_DATA"],
              skip_upload_metadata: true,
              skip_upload_images: true,
              skip_upload_screenshots: true,
              release_status: 'completed'
            )
          end
        end
        ```

5.  **Set Environment Variables:**
    *   Set the following environment variables:
        *   `GOOGLE_PLAY_JSON_KEY_DATA`: The contents of the Google Play Developer API key file.
        *   `ANDROID_KEYSTORE_PATH`: The path to the Android keystore file.
        *   `ANDROID_KEYSTORE_PASSWORD`: The password for the Android keystore.
        *   `ANDROID_KEY_ALIAS`: The alias for the key in the keystore.
        *   `ANDROID_KEY_PASSWORD`: The password for the key in the keystore.

6.  **Build and Deploy:**
    *   Run the `deploy-mobile.sh` script with the appropriate parameters:

        ```bash
        ./scripts/deploy-mobile.sh --platform android --env production
        ```

    *   Or, use Fastlane directly:

        ```bash
        fastlane internal # For Internal Testing
        fastlane production # For Production