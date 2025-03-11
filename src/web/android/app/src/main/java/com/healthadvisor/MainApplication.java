package com.healthadvisor;

import android.app.Application;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import com.facebook.react.PackageList;
import java.util.List;

/**
 * Main application class for the Health Advisor Android app that initializes React Native
 * and manages native modules. This class extends Application and implements ReactApplication
 * interface to integrate with the React Native framework.
 * 
 * The Health Advisor app is a mobile application with five main sections:
 * Chat, Health Log, Data Entry, Insights, and Profile, providing personalized health advice
 * through an LLM integration.
 */
public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = initializeReactNativeHost();

  /**
   * Initializes the ReactNativeHost instance with application-specific configuration.
   * 
   * @return The configured ReactNativeHost instance
   */
  private ReactNativeHost initializeReactNativeHost() {
    return new ReactNativeHostImpl(this);
  }

  /**
   * Returns the ReactNativeHost instance for this application.
   * Required by the ReactApplication interface.
   * 
   * @return The ReactNativeHost instance managing the React Native runtime
   */
  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  /**
   * Called when the application is first created. Initializes the React Native
   * environment and native modules.
   */
  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    // Initialize any additional native modules or third-party libraries here
    // Configure React Native debugging settings if in development mode
  }

  /**
   * Inner class that extends DefaultReactNativeHost to customize React Native initialization
   * for the Health Advisor app.
   */
  private static class ReactNativeHostImpl extends DefaultReactNativeHost {
    
    /**
     * Constructor for ReactNativeHostImpl
     * 
     * @param application The application instance
     */
    public ReactNativeHostImpl(Application application) {
      super(application);
    }

    /**
     * Determines whether developer support should be enabled.
     * Usually based on build configuration.
     * 
     * @return True if developer support should be enabled, false otherwise
     */
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    /**
     * Returns a list of React Native packages that provide native modules to JavaScript.
     * 
     * @return List of React Native packages for the application
     */
    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
      // Packages that cannot be autolinked yet can be added manually here
      // packages.add(new MyReactNativePackage());
      return packages;
    }

    /**
     * Returns the name of the main JavaScript bundle file.
     * 
     * @return The name of the main JavaScript module ('index')
     */
    @Override
    protected String getJSMainModuleName() {
      return "index";
    }

    /**
     * Determines whether the Hermes JavaScript engine should be used.
     * 
     * @return True to enable Hermes, false to use JSC
     */
    @Override
    protected boolean isHermesEnabled() {
      return true;
    }
  }
}