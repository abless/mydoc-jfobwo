import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native'; // ^0.71.0
import { BottomSheetProps } from '../../types/components.types';
import { COLORS } from '../../constants/colors';
import { spacing, borderRadius, elevation } from '../../theme';
import IconButton from '../buttons/IconButton';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * A bottom sheet component that slides up from the bottom of the screen,
 * providing a modal-like interface for displaying content or collecting user input.
 * Supports swipe-down gesture for dismissal and a customizable height.
 */
const BottomSheet = ({
  visible,
  onClose,
  title,
  children,
  height,
}: BottomSheetProps) => {
  // Get current theme context
  const { theme } = useTheme();
  
  // Calculate sheet height
  const screenHeight = Dimensions.get('window').height;
  const defaultHeight = screenHeight * 0.5; // 50% of screen height by default
  const sheetHeight = height ? 
    (typeof height === 'number' ? height : parseInt(height as string, 10)) : 
    defaultHeight;
  
  // Animated value for slide-up animation
  const slideAnim = useRef(new Animated.Value(sheetHeight)).current;
  
  // Set up PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) { // Only allow swiping down
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) { // If swiped down more than 100, close
          onClose();
        } else {
          // Otherwise, animate back to original position
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
    })
  ).current;
  
  // Animate when visibility changes
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(sheetHeight);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
        speed: 12,
      }).start();
    }
  }, [visible, sheetHeight, slideAnim]);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Semi-transparent backdrop */}
      <TouchableOpacity
        style={[
          styles.backdrop,
          { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        ]}
        activeOpacity={1}
        onPress={onClose}
        accessible={true}
        accessibilityLabel="Close bottom sheet"
        accessibilityRole="button"
      />
      
      {/* Bottom sheet container */}
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.CARD,
            height: sheetHeight,
            transform: [{ translateY: slideAnim }],
            borderTopLeftRadius: borderRadius.large,
            borderTopRightRadius: borderRadius.large,
          },
          elevation.large,
        ]}
        {...panResponder.panHandlers}
      >
        {/* Header with title and close button */}
        <View 
          style={[
            styles.header,
            { borderBottomColor: theme.colors.BORDER }
          ]}
        >
          <Text 
            style={[
              styles.title, 
              { color: theme.colors.TEXT }
            ]}
            accessibilityRole="header"
          >
            {title}
          </Text>
          <IconButton
            icon={
              <Text style={{ fontSize: 24, color: theme.colors.TEXT }}>×</Text>
            }
            onPress={onClose}
            accessibilityLabel="Close bottom sheet"
          />
        </View>
        
        {/* Content container */}
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: spacing.m,
  },
});

export default BottomSheet;