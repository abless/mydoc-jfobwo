# Font Usage in Health Advisor

This document outlines the font usage in the Health Advisor mobile application, explaining the typography system and providing guidance for developers.

## System Fonts

The application uses system fonts to ensure optimal performance and native look and feel across different platforms:
- iOS: San Francisco (System font)
- Android: Roboto (System font)

Using system fonts provides several benefits:
- Better performance (no need to load custom fonts)
- Automatic support for dynamic type and accessibility features
- Consistent with platform design guidelines
- Automatic updates when OS updates its system fonts

## Font Weights

The application uses the following font weights:
- Regular: For body text and general content
- Medium: For labels and secondary headings
- Semi-Bold: For buttons and important UI elements
- Bold: For headings and emphasized text

These weights are mapped to the appropriate system font weights on each platform.

## Font Sizes

The application follows these font size guidelines:
- Headings: 20-24pt (xl, xxl in our typography system)
- Body Text: 16pt (m in our typography system)
- Labels: 14pt (s in our typography system)
- Buttons: 16pt (m in our typography system)

These sizes are defined in the typography.ts file and should be used consistently throughout the application.

## Adding Custom Fonts

If custom fonts need to be added in the future, follow these steps:

1. Add font files (.ttf or .otf) to this directory
2. For iOS:
   - Add fonts to the Info.plist file
   - Update the podfile and run pod install

3. For Android:
   - Create assets/fonts directory in the android/app/src/main/assets/ folder
   - Copy font files to this directory

4. Update the typography.ts file to use the custom fonts
5. Test thoroughly on both platforms

## Accessibility Considerations

When working with fonts in the application, keep these accessibility guidelines in mind:

- Always use the typography system rather than hardcoded font sizes
- Support dynamic type by using the relative font sizes from the typography system
- Ensure sufficient contrast between text and background
- Test with different font size settings on both platforms
- Avoid using font styles or colors as the only way to convey information

## Typography Implementation

The typography system is implemented in src/web/src/theme/typography.ts and follows the Typography interface defined in src/web/src/types/theme.types.ts. Always use these predefined typography settings to maintain consistency throughout the application.