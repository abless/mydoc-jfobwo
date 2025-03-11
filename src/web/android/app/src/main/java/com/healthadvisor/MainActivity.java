package com.healthadvisor;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import android.os.Bundle;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.modules.core.PermissionAwareActivity;
import androidx.core.app.ActivityCompat;

/**
 * Main activity class for the Health Advisor Android application that serves as the entry point
 * for the React Native mobile app. This class extends ReactActivity and handles the initialization
 * of the React Native view, permissions management, and native module integration.
 * 
 * The Health Advisor app provides a personalized health guidance platform with five main sections:
 * Chat, Health Log, Data Entry, Insights, and Profile. This activity enables integration with
 * device capabilities including camera and microphone for health data input.
 */
public class MainActivity extends ReactActivity {
    
    private PermissionListener mPermissionListener;

    /**
     * Called when the activity is first created. Initializes the activity and sets up
     * the React Native environment.
     *
     * @param savedInstanceState If the activity is being re-initialized after previously being
     *                          shut down, this contains the data most recently supplied in
     *                          onSaveInstanceState(Bundle). Otherwise it is null.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Any additional initialization specific to Health Advisor can be added here
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to
     * schedule rendering of the component.
     *
     * @return The name of the main component ("HealthAdvisor")
     */
    @Override
    protected String getMainComponentName() {
        return "HealthAdvisor";
    }

    /**
     * Creates the ReactActivityDelegate for this activity, which is responsible for
     * creating the React Native view.
     *
     * @return The delegate that will manage the React Native view
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
            this,
            getMainComponentName()
        );
    }

    /**
     * Callback for the result from requesting permissions. Forwards the result to
     * the permission listener.
     *
     * @param requestCode The request code passed in requestPermissions
     * @param permissions The requested permissions
     * @param grantResults The grant results for the corresponding permissions
     */
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (mPermissionListener != null &&
            mPermissionListener.onRequestPermissionsResult(requestCode, permissions, grantResults)) {
            mPermissionListener = null;
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    /**
     * Requests permissions needed by the app, such as camera and microphone access.
     * Implementation as required by PermissionAwareActivity interface which ReactActivity implements.
     *
     * @param permissions The permissions to request
     * @param requestCode The request code for the permissions
     * @param listener Listener to receive the permission results
     */
    @Override
    public void requestPermissions(String[] permissions, int requestCode, PermissionListener listener) {
        mPermissionListener = listener;
        ActivityCompat.requestPermissions(this, permissions, requestCode);
    }
}