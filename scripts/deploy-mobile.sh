#!/bin/bash
#
# deploy-mobile.sh
# Automates the deployment of the Health Advisor React Native mobile application
# Handles building, signing, and distributing both iOS and Android applications
# to app stores and testing environments.
#
# Usage: ./scripts/deploy-mobile.sh --platform [android|ios|all] --env [dev|internal|production]

# Exit on error
set -e

# Script directory and project paths
SCRIPT_DIR=$(dirname "$0")
ROOT_DIR=$(dirname "$SCRIPT_DIR")
WEB_DIR=$ROOT_DIR/src/web
ANDROID_DIR=$WEB_DIR/android
IOS_DIR=$WEB_DIR/ios

# Generate a build ID using current timestamp and git commit hash
BUILD_ID=$(date +'%Y%m%d%H%M%S')-$(git rev-parse --short HEAD)

# Get version from package.json
VERSION=$(node -p "require('$WEB_DIR/package.json').version")

# Application identifiers
ANDROID_PACKAGE_NAME="com.healthadvisor"
IOS_BUNDLE_ID="com.healthadvisor"

# Print usage information
print_usage() {
    echo "Health Advisor Mobile App Deployment Script"
    echo "-------------------------------------------"
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -p, --platform PLATFORM   Platform to deploy (android, ios, all) [default: all]"
    echo "  -e, --env ENVIRONMENT     Target environment (dev, internal, production) [default: dev]"
    echo "  -h, --help                Show this help message and exit"
    echo ""
    echo "Example:"
    echo "  $0 --platform android --env internal"
}

# Check if required tools are installed
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "Error: Node.js is not installed. Please install Node.js 16.x or higher."
        return 1
    fi
    
    # Check Ruby (required for fastlane)
    if ! command -v ruby &> /dev/null; then
        echo "Error: Ruby is not installed. Please install Ruby 2.7 or higher."
        return 1
    fi
    
    # Check Fastlane
    if ! command -v fastlane &> /dev/null; then
        echo "Error: Fastlane is not installed. Please install fastlane using 'gem install fastlane'."
        return 1
    fi
    
    # Check platform-specific requirements
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
        # Check Xcode command line tools
        if ! command -v xcodebuild &> /dev/null; then
            echo "Error: Xcode command line tools are not installed."
            return 1
        fi
    fi
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
        # Check Gradle or gradlew
        if ! command -v gradle &> /dev/null; then
            if [ ! -f "$ANDROID_DIR/gradlew" ]; then
                echo "Error: Gradle is not installed and gradlew wasn't found."
                return 1
            fi
        fi
    fi
    
    # Check jq for JSON processing
    if ! command -v jq &> /dev/null; then
        echo "Error: jq is not installed. Please install jq for JSON processing."
        return 1
    fi
    
    echo "✅ All prerequisites are met."
    return 0
}

# Set up environment for deployment
setup_environment() {
    local environment=$1
    local platform=$2
    
    echo "Setting up environment for $platform deployment to $environment..."
    
    # Create build directory
    BUILD_DIR="$ROOT_DIR/build/$platform-$environment-$BUILD_ID"
    mkdir -p "$BUILD_DIR"
    echo "Build artifacts will be stored in: $BUILD_DIR"
    
    # Set environment-specific configurations
    case "$environment" in
        dev)
            echo "Configuring development environment..."
            export API_URL="https://dev-api.healthadvisor.example.com"
            export ENABLE_LOGS="true"
            export ENABLE_ANALYTICS="false"
            ;;
        internal)
            echo "Configuring internal testing environment..."
            export API_URL="https://staging-api.healthadvisor.example.com"
            export ENABLE_LOGS="true"
            export ENABLE_ANALYTICS="true"
            
            # Check for required credentials
            if [[ "$platform" == "android" || "$platform" == "all" ]]; then
                if [[ -z "$ANDROID_KEYSTORE_PATH" || -z "$ANDROID_KEYSTORE_PASSWORD" ]]; then
                    echo "Error: Android signing credentials are not set. Please set ANDROID_KEYSTORE_PATH and ANDROID_KEYSTORE_PASSWORD."
                    return 1
                fi
            fi
            
            if [[ "$platform" == "ios" || "$platform" == "all" ]]; then
                if [[ -z "$APPSTORE_CONNECT_API_KEY_ID" || -z "$APPLE_TEAM_ID" ]]; then
                    echo "Error: iOS signing credentials are not set. Please set APPSTORE_CONNECT_API_KEY_ID and APPLE_TEAM_ID."
                    return 1
                fi
            fi
            ;;
        production)
            echo "Configuring production environment..."
            export API_URL="https://api.healthadvisor.example.com"
            export ENABLE_LOGS="false"
            export ENABLE_ANALYTICS="true"
            
            # Verify we're on the main/master branch for production builds
            CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
            if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
                echo "Error: Production builds should be performed from main/master branch."
                echo "Current branch: $CURRENT_BRANCH"
                return 1
            fi
            
            # Check for required credentials
            if [[ "$platform" == "android" || "$platform" == "all" ]]; then
                if [[ -z "$ANDROID_KEYSTORE_PATH" || -z "$ANDROID_KEYSTORE_PASSWORD" ]]; then
                    echo "Error: Android signing credentials are not set. Please set ANDROID_KEYSTORE_PATH and ANDROID_KEYSTORE_PASSWORD."
                    return 1
                fi
            fi
            
            if [[ "$platform" == "ios" || "$platform" == "all" ]]; then
                if [[ -z "$APPSTORE_CONNECT_API_KEY_ID" || -z "$APPLE_TEAM_ID" ]]; then
                    echo "Error: iOS signing credentials are not set. Please set APPSTORE_CONNECT_API_KEY_ID and APPLE_TEAM_ID."
                    return 1
                fi
            fi
            ;;
        *)
            echo "Error: Unknown environment: $environment"
            return 1
            ;;
    esac
    
    echo "✅ Environment setup completed."
    return 0
}

# Update version information in app configuration files
update_version() {
    local platform=$1
    local version_name=$2
    local build_number=$3
    
    echo "Updating version information for $platform: $version_name (Build $build_number)..."
    
    case "$platform" in
        android)
            # Update version name and code in build.gradle
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS version of sed requires backup extension
                sed -i '' "s/versionCode [0-9]*/versionCode $build_number/" "$ANDROID_DIR/app/build.gradle"
                sed -i '' "s/versionName \"[^\"]*\"/versionName \"$version_name\"/" "$ANDROID_DIR/app/build.gradle"
            else
                # Linux version of sed
                sed -i "s/versionCode [0-9]*/versionCode $build_number/" "$ANDROID_DIR/app/build.gradle"
                sed -i "s/versionName \"[^\"]*\"/versionName \"$version_name\"/" "$ANDROID_DIR/app/build.gradle"
            fi
            
            # Verify changes were made
            if ! grep -q "versionCode $build_number" "$ANDROID_DIR/app/build.gradle"; then
                echo "Error: Failed to update versionCode in build.gradle"
                return 1
            fi
            if ! grep -q "versionName \"$version_name\"" "$ANDROID_DIR/app/build.gradle"; then
                echo "Error: Failed to update versionName in build.gradle"
                return 1
            fi
            ;;
        ios)
            # Update CFBundleShortVersionString and CFBundleVersion in Info.plist
            if ! command -v /usr/libexec/PlistBuddy &> /dev/null; then
                echo "Error: PlistBuddy not found. This script must be run on macOS for iOS deployment."
                return 1
            fi
            
            /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $version_name" "$IOS_DIR/HealthAdvisor/Info.plist"
            /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $build_number" "$IOS_DIR/HealthAdvisor/Info.plist"
            
            # Verify changes were made
            UPDATED_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$IOS_DIR/HealthAdvisor/Info.plist")
            UPDATED_BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$IOS_DIR/HealthAdvisor/Info.plist")
            
            if [[ "$UPDATED_VERSION" != "$version_name" ]]; then
                echo "Error: Failed to update CFBundleShortVersionString in Info.plist"
                return 1
            fi
            if [[ "$UPDATED_BUILD" != "$build_number" ]]; then
                echo "Error: Failed to update CFBundleVersion in Info.plist"
                return 1
            fi
            ;;
        *)
            echo "Error: Unknown platform: $platform"
            return 1
            ;;
    esac
    
    echo "✅ Version information updated successfully."
    return 0
}

# Build Android application
build_android() {
    local environment=$1
    
    echo "Building Android application for $environment environment..."
    
    # Navigate to android directory
    cd "$ANDROID_DIR"
    
    # Clean previous builds
    ./gradlew clean
    
    # Set environment-specific build configurations
    case "$environment" in
        dev)
            BUILD_TYPE="debug"
            GRADLE_TASK="assembleDebug"
            ;;
        internal|production)
            BUILD_TYPE="release"
            GRADLE_TASK="assembleRelease"
            
            # Copy keystore file if it's external
            if [[ -n "$ANDROID_KEYSTORE_PATH" && -f "$ANDROID_KEYSTORE_PATH" ]]; then
                echo "Copying keystore file to project directory..."
                cp "$ANDROID_KEYSTORE_PATH" "$ANDROID_DIR/app/release.keystore"
                
                # Update signing config in build.gradle if needed
                if [[ -n "$ANDROID_KEYSTORE_PASSWORD" && -n "$ANDROID_KEY_ALIAS" && -n "$ANDROID_KEY_PASSWORD" ]]; then
                    if [[ "$OSTYPE" == "darwin"* ]]; then
                        sed -i '' "s/storePassword 'password'/storePassword '$ANDROID_KEYSTORE_PASSWORD'/" "$ANDROID_DIR/app/build.gradle"
                        sed -i '' "s/keyAlias 'healthadvisor'/keyAlias '$ANDROID_KEY_ALIAS'/" "$ANDROID_DIR/app/build.gradle"
                        sed -i '' "s/keyPassword 'password'/keyPassword '$ANDROID_KEY_PASSWORD'/" "$ANDROID_DIR/app/build.gradle"
                    else
                        sed -i "s/storePassword 'password'/storePassword '$ANDROID_KEYSTORE_PASSWORD'/" "$ANDROID_DIR/app/build.gradle"
                        sed -i "s/keyAlias 'healthadvisor'/keyAlias '$ANDROID_KEY_ALIAS'/" "$ANDROID_DIR/app/build.gradle"
                        sed -i "s/keyPassword 'password'/keyPassword '$ANDROID_KEY_PASSWORD'/" "$ANDROID_DIR/app/build.gradle"
                    fi
                fi
            fi
            ;;
        *)
            echo "Error: Unknown environment: $environment"
            return 1
            ;;
    esac
    
    # Execute the build
    echo "Running Gradle task: $GRADLE_TASK"
    if ! ./gradlew $GRADLE_TASK; then
        echo "Error: Android build failed"
        return 1
    fi
    
    # Determine the path to the generated APK
    local APK_PATH
    if [[ "$BUILD_TYPE" == "debug" ]]; then
        APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
    else
        APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
    fi
    
    # Verify the APK exists
    if [[ ! -f "$APK_PATH" ]]; then
        echo "Error: APK file not found at $APK_PATH"
        return 1
    fi
    
    # Copy APK to build directory
    local DESTINATION="$BUILD_DIR/HealthAdvisor-$VERSION-$environment.apk"
    cp "$APK_PATH" "$DESTINATION"
    
    echo "✅ Android build successful. APK saved to: $DESTINATION"
    echo "APK_PATH=$DESTINATION" > "$BUILD_DIR/android_build_info.txt"
    
    return 0
}

# Build iOS application
build_ios() {
    local environment=$1
    
    echo "Building iOS application for $environment environment..."
    
    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo "Error: iOS builds can only be performed on macOS."
        return 1
    fi
    
    # Navigate to iOS directory
    cd "$IOS_DIR"
    
    # Install CocoaPods dependencies if needed
    if [[ ! -d "Pods" ]]; then
        echo "Installing CocoaPods dependencies..."
        pod install
    fi
    
    # Clean previous builds
    xcodebuild clean -workspace HealthAdvisor.xcworkspace -scheme HealthAdvisor > /dev/null
    
    # Set environment-specific build configurations
    case "$environment" in
        dev)
            CONFIGURATION="Debug"
            EXPORT_METHOD="development"
            ;;
        internal)
            CONFIGURATION="Release"
            EXPORT_METHOD="app-store"  # TestFlight uses app-store method
            ;;
        production)
            CONFIGURATION="Release"
            EXPORT_METHOD="app-store"
            ;;
        *)
            echo "Error: Unknown environment: $environment"
            return 1
            ;;
    esac
    
    # Build archive
    echo "Building archive with configuration: $CONFIGURATION"
    if ! xcodebuild archive \
        -workspace HealthAdvisor.xcworkspace \
        -scheme HealthAdvisor \
        -configuration $CONFIGURATION \
        -archivePath "$BUILD_DIR/HealthAdvisor.xcarchive" \
        CODE_SIGN_IDENTITY="iPhone Distribution" \
        DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
        -quiet; then
        echo "Error: iOS archive build failed"
        return 1
    fi
    
    # Create export options plist
    EXPORT_OPTIONS_PLIST="$BUILD_DIR/ExportOptions.plist"
    
    cat > "$EXPORT_OPTIONS_PLIST" << EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>$EXPORT_METHOD</string>
    <key>teamID</key>
    <string>$APPLE_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOL
    
    # Export IPA
    echo "Exporting IPA..."
    if ! xcodebuild -exportArchive \
        -archivePath "$BUILD_DIR/HealthAdvisor.xcarchive" \
        -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
        -exportPath "$BUILD_DIR" \
        -quiet; then
        echo "Error: iOS IPA export failed"
        return 1
    fi
    
    # Determine the path to the generated IPA
    IPA_PATH="$BUILD_DIR/HealthAdvisor.ipa"
    
    # Verify the IPA exists
    if [[ ! -f "$IPA_PATH" ]]; then
        echo "Error: IPA file not found at $IPA_PATH"
        return 1
    fi
    
    # Rename IPA to include version and environment
    DESTINATION="$BUILD_DIR/HealthAdvisor-$VERSION-$environment.ipa"
    mv "$IPA_PATH" "$DESTINATION"
    
    echo "✅ iOS build successful. IPA saved to: $DESTINATION"
    echo "IPA_PATH=$DESTINATION" > "$BUILD_DIR/ios_build_info.txt"
    
    return 0
}

# Deploy Android app to internal testing
deploy_android_internal() {
    local apk_path=$1
    local version=$2
    
    echo "Deploying Android app to internal testing track..."
    
    # Navigate to android directory
    cd "$ANDROID_DIR"
    
    # Create fastlane directory if needed
    mkdir -p fastlane
    
    # Create fastlane configuration
    cat > "fastlane/Fastfile" << EOL
default_platform(:android)

platform :android do
  desc "Deploy to Internal Testing Track"
  lane :internal do
    upload_to_play_store(
      track: 'internal',
      apk: '${apk_path}',
      json_key_data: ENV['GOOGLE_PLAY_JSON_KEY_DATA'],
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true,
      release_status: 'completed'
    )
  end
end
EOL
    
    # Check if Google Play credentials are available
    if [[ -z "$GOOGLE_PLAY_JSON_KEY_DATA" ]]; then
        echo "Error: GOOGLE_PLAY_JSON_KEY_DATA environment variable is not set."
        return 1
    fi
    
    # Use fastlane to upload APK to internal testing track
    if ! fastlane android internal; then
        echo "Error: Failed to deploy Android app to internal testing"
        return 1
    fi
    
    echo "✅ Android app successfully deployed to internal testing track"
    return 0
}

# Deploy Android app to production
deploy_android_production() {
    local apk_path=$1
    local version=$2
    
    echo "Deploying Android app to production..."
    
    # Navigate to android directory
    cd "$ANDROID_DIR"
    
    # Create fastlane directory if needed
    mkdir -p fastlane
    
    # Create fastlane configuration
    cat > "fastlane/Fastfile" << EOL
default_platform(:android)

platform :android do
  desc "Deploy to Production"
  lane :production do
    upload_to_play_store(
      track: 'production',
      apk: '${apk_path}',
      json_key_data: ENV['GOOGLE_PLAY_JSON_KEY_DATA'],
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true,
      release_status: 'completed'
    )
  end
end
EOL
    
    # Check if Google Play credentials are available
    if [[ -z "$GOOGLE_PLAY_JSON_KEY_DATA" ]]; then
        echo "Error: GOOGLE_PLAY_JSON_KEY_DATA environment variable is not set."
        return 1
    fi
    
    # Use fastlane to upload APK to production
    if ! fastlane android production; then
        echo "Error: Failed to deploy Android app to production"
        return 1
    fi
    
    echo "✅ Android app successfully deployed to production"
    return 0
}

# Deploy iOS app to TestFlight
deploy_ios_testflight() {
    local ipa_path=$1
    local version=$2
    
    echo "Deploying iOS app to TestFlight..."
    
    # Navigate to iOS directory
    cd "$IOS_DIR"
    
    # Create fastlane directory if needed
    mkdir -p fastlane
    
    # Create fastlane configuration
    cat > "fastlane/Fastfile" << EOL
default_platform(:ios)

platform :ios do
  desc "Deploy to TestFlight"
  lane :beta do
    app_store_connect_api_key(
      key_id: ENV['APPSTORE_CONNECT_API_KEY_ID'],
      issuer_id: ENV['APPSTORE_CONNECT_API_KEY_ISSUER_ID'],
      key_filepath: ENV['APPSTORE_CONNECT_API_KEY_PATH'],
    )
    
    upload_to_testflight(
      ipa: '${ipa_path}',
      skip_waiting_for_build_processing: true,
      apple_id: ENV['IOS_APPLE_ID']
    )
  end
end
EOL
    
    # Check if App Store Connect credentials are available
    if [[ -z "$APPSTORE_CONNECT_API_KEY_ID" || -z "$APPSTORE_CONNECT_API_KEY_ISSUER_ID" || -z "$APPSTORE_CONNECT_API_KEY_PATH" ]]; then
        echo "Error: App Store Connect API credentials are not set."
        return 1
    fi
    
    if [[ -z "$IOS_APPLE_ID" ]]; then
        echo "Error: IOS_APPLE_ID environment variable is not set."
        return 1
    fi
    
    # Use fastlane to upload IPA to TestFlight
    if ! fastlane ios beta; then
        echo "Error: Failed to deploy iOS app to TestFlight"
        return 1
    fi
    
    echo "✅ iOS app successfully deployed to TestFlight"
    return 0
}

# Deploy iOS app to App Store
deploy_ios_production() {
    local ipa_path=$1
    local version=$2
    
    echo "Deploying iOS app to App Store..."
    
    # Navigate to iOS directory
    cd "$IOS_DIR"
    
    # Create fastlane directory if needed
    mkdir -p fastlane
    
    # Create fastlane configuration
    cat > "fastlane/Fastfile" << EOL
default_platform(:ios)

platform :ios do
  desc "Deploy to App Store"
  lane :release do
    app_store_connect_api_key(
      key_id: ENV['APPSTORE_CONNECT_API_KEY_ID'],
      issuer_id: ENV['APPSTORE_CONNECT_API_KEY_ISSUER_ID'],
      key_filepath: ENV['APPSTORE_CONNECT_API_KEY_PATH'],
    )
    
    upload_to_app_store(
      ipa: '${ipa_path}',
      skip_metadata: true,
      skip_screenshots: true,
      submit_for_review: false,
      automatic_release: false,
      apple_id: ENV['IOS_APPLE_ID']
    )
  end
end
EOL
    
    # Check if App Store Connect credentials are available
    if [[ -z "$APPSTORE_CONNECT_API_KEY_ID" || -z "$APPSTORE_CONNECT_API_KEY_ISSUER_ID" || -z "$APPSTORE_CONNECT_API_KEY_PATH" ]]; then
        echo "Error: App Store Connect API credentials are not set."
        return 1
    fi
    
    if [[ -z "$IOS_APPLE_ID" ]]; then
        echo "Error: IOS_APPLE_ID environment variable is not set."
        return 1
    fi
    
    # Use fastlane to upload IPA to App Store
    if ! fastlane ios release; then
        echo "Error: Failed to deploy iOS app to App Store"
        return 1
    fi
    
    echo "✅ iOS app successfully deployed to App Store"
    return 0
}

# Verify deployment
verify_deployment() {
    local platform=$1
    local environment=$2
    
    echo "Verifying $platform deployment to $environment..."
    
    # For development environment, no verification needed
    if [[ "$environment" == "dev" ]]; then
        echo "✅ Development build verification skipped"
        return 0
    fi
    
    # For production and internal, do basic checks
    case "$platform" in
        android)
            echo "Checking Android deployment..."
            # In a real-world scenario, we would use Google Play Developer API
            # to check the status of the release
            echo "Note: Manual verification in Google Play Console is recommended"
            ;;
        ios)
            echo "Checking iOS deployment..."
            # In a real-world scenario, we would use App Store Connect API
            # to check the status of the release
            echo "Note: Manual verification in App Store Connect is recommended"
            ;;
        *)
            echo "Error: Unknown platform: $platform"
            return 1
            ;;
    esac
    
    echo "✅ Deployment verification completed"
    return 0
}

# Perform post-deployment tasks
post_deployment_tasks() {
    local platform=$1
    local environment=$2
    local version=$3
    
    echo "Performing post-deployment tasks..."
    
    # Create a git tag for the deployment
    TAG_NAME="v${version}-${platform}-${environment}-${BUILD_ID}"
    echo "Creating git tag: $TAG_NAME"
    git tag -a "$TAG_NAME" -m "Deployed $platform $version to $environment"
    
    # Push tag to remote repository if not in dev environment
    if [[ "$environment" != "dev" ]]; then
        echo "Pushing git tag to remote repository..."
        git push origin "$TAG_NAME"
    fi
    
    # Send deployment notification if webhook configured
    if [[ -n "$NOTIFICATION_WEBHOOK_URL" ]]; then
        echo "Sending deployment notification..."
        PAYLOAD="{\"text\":\"🚀 Health Advisor $version deployed to $environment for $platform\"}"
        curl -s -X POST -H "Content-Type: application/json" -d "$PAYLOAD" "$NOTIFICATION_WEBHOOK_URL"
    fi
    
    # Log deployment information
    echo "Deployment details:" > "$BUILD_DIR/deployment_info.log"
    echo "  Date: $(date)" >> "$BUILD_DIR/deployment_info.log"
    echo "  Platform: $platform" >> "$BUILD_DIR/deployment_info.log"
    echo "  Environment: $environment" >> "$BUILD_DIR/deployment_info.log"
    echo "  Version: $version" >> "$BUILD_DIR/deployment_info.log"
    echo "  Build ID: $BUILD_ID" >> "$BUILD_DIR/deployment_info.log"
    
    echo "✅ Post-deployment tasks completed"
}

# Main function
main() {
    local platform=$1
    local environment=$2
    
    # Validate platform parameter
    if [[ "$platform" != "android" && "$platform" != "ios" && "$platform" != "all" ]]; then
        echo "Error: Invalid platform. Must be 'android', 'ios', or 'all'."
        print_usage
        return 1
    fi
    
    # Validate environment parameter
    if [[ "$environment" != "dev" && "$environment" != "internal" && "$environment" != "production" ]]; then
        echo "Error: Invalid environment. Must be 'dev', 'internal', or 'production'."
        print_usage
        return 1
    fi
    
    echo "========================================"
    echo "Health Advisor Mobile App Deployment"
    echo "Platform: $platform"
    echo "Environment: $environment"
    echo "Version: $VERSION"
    echo "Build ID: $BUILD_ID"
    echo "========================================"
    
    # Check prerequisites
    if ! check_prerequisites; then
        return 1
    fi
    
    # Set up environment
    if ! setup_environment "$environment" "$platform"; then
        return 1
    fi
    
    # Generate build number (based on timestamp)
    BUILD_NUMBER=$(date +%s)
    
    # Process Android deployment if requested
    if [[ "$platform" == "android" || "$platform" == "all" ]]; then
        echo "========================================"
        echo "Starting Android Deployment"
        echo "========================================"
        
        # Update version information
        if ! update_version "android" "$VERSION" "$BUILD_NUMBER"; then
            echo "❌ Android deployment failed at version update stage"
            return 1
        fi
        
        # Build the Android application
        if ! build_android "$environment"; then
            echo "❌ Android deployment failed at build stage"
            return 1
        fi
        
        # Deploy based on environment
        if [[ "$environment" == "internal" ]]; then
            APK_PATH=$(grep -o 'APK_PATH=.*' "$BUILD_DIR/android_build_info.txt" | cut -d'=' -f2)
            if ! deploy_android_internal "$APK_PATH" "$VERSION"; then
                echo "❌ Android deployment failed at internal deployment stage"
                return 1
            fi
        elif [[ "$environment" == "production" ]]; then
            APK_PATH=$(grep -o 'APK_PATH=.*' "$BUILD_DIR/android_build_info.txt" | cut -d'=' -f2)
            if ! deploy_android_production "$APK_PATH" "$VERSION"; then
                echo "❌ Android deployment failed at production deployment stage"
                return 1
            fi
        fi
        
        # Verify deployment
        if ! verify_deployment "android" "$environment"; then
            echo "❌ Android deployment verification failed"
            return 1
        fi
        
        echo "✅ Android deployment completed successfully"
    fi
    
    # Process iOS deployment if requested
    if [[ "$platform" == "ios" || "$platform" == "all" ]]; then
        echo "========================================"
        echo "Starting iOS Deployment"
        echo "========================================"
        
        # Update version information
        if ! update_version "ios" "$VERSION" "$BUILD_NUMBER"; then
            echo "❌ iOS deployment failed at version update stage"
            return 1
        fi
        
        # Build the iOS application
        if ! build_ios "$environment"; then
            echo "❌ iOS deployment failed at build stage"
            return 1
        fi
        
        # Deploy based on environment
        if [[ "$environment" == "internal" ]]; then
            IPA_PATH=$(grep -o 'IPA_PATH=.*' "$BUILD_DIR/ios_build_info.txt" | cut -d'=' -f2)
            if ! deploy_ios_testflight "$IPA_PATH" "$VERSION"; then
                echo "❌ iOS deployment failed at TestFlight deployment stage"
                return 1
            fi
        elif [[ "$environment" == "production" ]]; then
            IPA_PATH=$(grep -o 'IPA_PATH=.*' "$BUILD_DIR/ios_build_info.txt" | cut -d'=' -f2)
            if ! deploy_ios_production "$IPA_PATH" "$VERSION"; then
                echo "❌ iOS deployment failed at App Store deployment stage"
                return 1
            fi
        fi
        
        # Verify deployment
        if ! verify_deployment "ios" "$environment"; then
            echo "❌ iOS deployment verification failed"
            return 1
        fi
        
        echo "✅ iOS deployment completed successfully"
    fi
    
    # Perform post-deployment tasks
    post_deployment_tasks "$platform" "$environment" "$VERSION"
    
    echo "========================================"
    echo "🎉 Deployment completed successfully"
    echo "Platform: $platform"
    echo "Environment: $environment"
    echo "Version: $VERSION (Build $BUILD_NUMBER)"
    echo "Build Directory: $BUILD_DIR"
    echo "========================================"
    
    return 0
}

# Parse command line arguments
PLATFORM="all"
ENVIRONMENT="dev"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -p|--platform)
            PLATFORM="$2"
            shift
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            echo "Unknown parameter: $1"
            print_usage
            exit 1
            ;;
    esac
    shift
done

# Call main function with parameters
main "$PLATFORM" "$ENVIRONMENT"
exit $?