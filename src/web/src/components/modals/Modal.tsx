import React from 'react'; // ^18.2.0
import { 
  Modal as RNModal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Animated 
} from 'react-native'; // ^0.71.0
import { ModalProps } from '../../types/components.types';
import { useTheme } from '../../contexts/ThemeContext';
import IconButton from '../buttons/IconButton';

/**
 * A customizable modal component that displays content in an overlay with a title and close button
 * 
 * @param props - Modal component properties
 * @returns Rendered Modal component
 */
const Modal = ({
  visible,
  onClose,
  title,
  children,
  animationType = 'fade',
}: ModalProps) => {
  const { theme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Animate modal opacity when visibility changes
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  // Dynamic styles based on current theme
  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.colors.CARD,
      borderRadius: theme.borderRadius.medium,
      width: '90%',
      maxWidth: 500,
      maxHeight: '85%',
      ...theme.elevation.medium,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.BORDER,
      padding: theme.spacing.m,
    },
    title: {
      color: theme.colors.TEXT,
      fontSize: theme.typography.fontSize.l,
      fontFamily: theme.typography.fontFamily.semiBold,
      flex: 1,
    },
    content: {
      padding: theme.spacing.m,
    },
    closeIcon: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.TEXT,
    },
  });

  // Create an "X" close icon using text
  const closeIcon = <Text style={styles.closeIcon}>✕</Text>;

  // Prevent event propagation when tapping inside the modal
  const handleModalPress = (e: any) => {
    e.stopPropagation();
  };

  return (
    <RNModal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType={animationType}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
        accessible={true}
        accessibilityLabel="Close modal"
        accessibilityRole="button"
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={handleModalPress}
            accessible={false}
          >
            <View style={styles.header}>
              <Text 
                style={styles.title} 
                numberOfLines={1}
                accessibilityRole="header"
              >
                {title}
              </Text>
              <IconButton
                icon={closeIcon}
                onPress={onClose}
                accessibilityLabel="Close modal"
              />
            </View>
            <View style={styles.content}>
              {children}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </RNModal>
  );
};

export default Modal;