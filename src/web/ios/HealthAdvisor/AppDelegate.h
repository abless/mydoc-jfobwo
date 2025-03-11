//
//  AppDelegate.h
//  HealthAdvisor
//
//  Created for the Health Advisor iOS application
//

#import <UIKit/UIKit.h> // UIKit - iOS SDK
#import <React/RCTBridgeDelegate.h> // React Native iOS

/**
 * The AppDelegate class serves as the main application delegate for the Health Advisor app.
 * It handles iOS application lifecycle events and initializes the React Native environment.
 * This class is responsible for setting up the React Native bridge, requesting necessary permissions,
 * and handling deep links and universal links for the application.
 */
@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>

/**
 * The main window of the application
 */
@property (nonatomic, strong) UIWindow *window;

/**
 * Called when the application has finished launching
 *
 * @param application The UIApplication instance
 * @param launchOptions A dictionary of launch options
 * @return YES if the application was successfully launched
 */
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions;

/**
 * Implements RCTBridgeDelegate to provide the location of the JavaScript bundle
 *
 * @param bridge The React Native bridge instance
 * @return URL to the JavaScript bundle
 */
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge;

/**
 * Handles opening URLs (deep links) in the application
 *
 * @param application The UIApplication instance
 * @param url The URL to open
 * @param options Dictionary of options for opening the URL
 * @return YES if the URL was successfully handled
 */
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options;

/**
 * Handles universal links for the application
 *
 * @param application The UIApplication instance
 * @param userActivity The user activity containing the universal link
 * @param restorationHandler Handler for restoring application state
 * @return YES if the user activity was successfully handled
 */
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> *))restorationHandler;

@end