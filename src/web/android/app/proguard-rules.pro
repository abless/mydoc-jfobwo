-keep class com.healthadvisor.MainApplication { *; }
-keep class com.healthadvisor.MainActivity { *; }

# Preserve the special static methods that are required in all enumeration classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep setters in Views so that animations can still work
-keepclassmembers public class * extends android.view.View {
    void set*(***);
    *** get*();
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable implementations
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# React Native rules
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip

# Do not strip any method/class that is annotated with @DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}

-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

# Preserve Hermes-specific rules
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep ReactNative classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.animated.** { *; }
-keep class com.facebook.react.devsupport.** { *; }
-keep class com.facebook.react.views.** { *; }
-keep class com.facebook.react.modules.** { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Navigation
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }
-keep class com.swmansion.rnscreens.** { *; }

# React Native Camera
-keep class org.reactnative.camera.** { *; }
-keep class com.google.zxing.** { *; }

# React Native Voice
-keep class com.wenkesj.voice.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native Calendars
-keep class com.wixnavigation.calendars.** { *; }

# Axios and networking
-keep class com.squareup.okhttp.** { *; }
-keep interface com.squareup.okhttp.** { *; }
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# JWT
-keep class io.jsonwebtoken.** { *; }
-keepnames class io.jsonwebtoken.* { *; }
-keepnames interface io.jsonwebtoken.* { *; }

# SVG
-keep class com.horcrux.svg.** { *; }

# Hermes JavaScript Engine
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.hermes.jsi.** { *; }
-keep class com.facebook.jni.** { *; }

# JSC JavaScript Engine (fallback)
-keep class com.facebook.jsc.** { *; }
-keep class org.mozilla.javascript.** { *; }

# Optimization and shrinking rules
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# Remove logging in production
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Remove debugging code in production
-assumenosideeffects class com.facebook.react.devsupport.** { *; }
-assumenosideeffects class com.facebook.flipper.** { *; }
-assumenosideeffects class com.facebook.react.bridge.ReactBridge { boolean isDevSupportEnabled(); }

# Warning suppressions
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**
-dontwarn com.facebook.jni.**
-dontwarn org.mozilla.javascript.**
-dontwarn androidx.**
-dontwarn android.content.res.**
-dontwarn com.google.android.material.**
-dontwarn com.swmansion.**
-dontwarn com.th3rdwave.**
-dontwarn org.reactnative.camera.**
-dontwarn com.wenkesj.voice.**
-dontwarn com.horcrux.svg.**
-dontwarn io.jsonwebtoken.**
-dontwarn org.bouncycastle.**