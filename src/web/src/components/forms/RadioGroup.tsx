import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native'; // ^0.71.0
import { RadioGroupProps, RadioOption } from '../../types/components.types';
import { COLORS } from '../../constants/colors';
import { spacing, borderRadius } from '../../theme/metrics';

/**
 * A customizable radio button group component that allows users to select
 * a single option from multiple choices.
 * 
 * @param options - Array of radio options with label and value
 * @param selectedValue - The currently selected value
 * @param onValueChange - Callback function when selection changes
 * @param direction - Layout direction of radio buttons ('horizontal' or 'vertical')
 * @param style - Additional styles for the container
 */
const RadioGroup = ({
  options,
  selectedValue,
  onValueChange,
  direction = 'vertical',
  style,
}: RadioGroupProps) => {
  return (
    <View 
      style={[
        styles.container, 
        direction === 'horizontal' ? styles.horizontal : styles.vertical,
        style
      ]}
    >
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              direction === 'horizontal' ? styles.horizontalOption : styles.verticalOption
            ]}
            onPress={() => onValueChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessible={true}
            accessibilityLabel={`${option.label}, ${isSelected ? 'selected' : 'not selected'}`}
          >
            <View style={[
              styles.radioOuter,
              { borderColor: isSelected ? COLORS.LIGHT.PRIMARY : COLORS.LIGHT.BORDER }
            ]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.label}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  horizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  vertical: {
    flexDirection: 'column',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    minHeight: 44, // Minimum height for touchable area per accessibility guidelines
  },
  horizontalOption: {
    marginRight: spacing.m,
  },
  verticalOption: {
    marginBottom: spacing.m,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.round,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.COMMON.TRANSPARENT,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.round,
    backgroundColor: COLORS.LIGHT.PRIMARY,
  },
  label: {
    marginLeft: spacing.s,
    fontSize: 16,
    color: COLORS.LIGHT.TEXT,
    fontWeight: '400',
  },
});

export default RadioGroup;