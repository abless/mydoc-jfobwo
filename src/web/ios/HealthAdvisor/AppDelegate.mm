/**
 * AppDelegate.mm
 * HealthAdvisor
 *
 * Implementation file for the iOS application delegate that handles application lifecycle events,
 * initializes the React Native environment, and configures necessary native modules for the
 * Health Advisor mobile app.
 */

#import "AppDelegate.h"

#import <React/RCTBridge.h> // React Native iOS - v0.71+
#import <React/RCTBundleURLProvider.h> // React Native iOS - v0.71+
#import <React/RCTRootView.h> // React Native iOS - v0.71+
#import <React/RCTLinkingManager.h> // React Native iOS - v0.71+
#import <React/RCTAppSetupUtils.h> // React Native iOS - v0.71+
#import <AVFoundation/AVFoundation.h> // iOS SDK

@implementation AppDelegate

/**
 * Initializes the React Native environment and sets up the application
 * Called when the application has finished launching
 */
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Prepare the React Native app environment
  RCTAppSetupPrepareApp(application);

  // Create the React Native bridge
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  
  // Create the root view with the main component name 'HealthAdvisor'
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"HealthAdvisor"
                                            initialProperties:nil];

  // Set the background color based on iOS version
  if (@available(iOS 13.0, *)) {
    rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  // Set up the main window with the root view controller
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  // Request camera and microphone permissions required for health data input
  [self requestCameraAndMicrophonePermissions];
  
  return YES;
}

/**
 * Implements RCTBridgeDelegate to provide the location of the JavaScript bundle
 * Returns different URLs based on debug/release mode
 */
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  // In development, use the bundler URL which points to the Metro bundler
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  // In production, use the pre-bundled file
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/**
 * Handles opening URLs (deep links) in the application
 * Delegates to RCTLinkingManager for processing
 */
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

/**
 * Handles universal links for the application
 * Delegates to RCTLinkingManager for processing
 */
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> *))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

/**
 * Requests camera and microphone permissions required for health data input features
 * This is necessary for capturing meal photos, lab results, and voice recordings for symptoms
 */
- (void)requestCameraAndMicrophonePermissions
{
  // Request camera permission if not already determined
  AVAuthorizationStatus cameraStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  if (cameraStatus == AVAuthorizationStatusNotDetermined) {
    [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
      NSLog(@"Camera permission %@", granted ? @"granted" : @"denied");
    }];
  }
  
  // Request microphone permission if not already determined
  AVAudioSessionRecordPermission microphoneStatus = [[AVAudioSession sharedInstance] recordPermission];
  if (microphoneStatus == AVAudioSessionRecordPermissionUndetermined) {
    [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
      NSLog(@"Microphone permission %@", granted ? @"granted" : @"denied");
    }];
  }
}

@end