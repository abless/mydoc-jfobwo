import React from 'react'; // 18.2.0
import { View, TextInput, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native'; // 0.71.0
import { useTheme } from '@react-navigation/native'; // 6.0.0
import { SearchBarProps } from '../../types/components.types';
import SearchIcon from '../../assets/icons/search';

/**
 * A reusable search input component with an integrated search icon.
 * Used primarily in the Health Log screen for searching health data entries.
 */
const SearchBar = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search health data...',
  style,
}: SearchBarProps): JSX.Element => {
  // Access the current theme
  const theme = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }, style]}>
      <SearchIcon size={20} color={theme.colors.text} />
      <TextInput
        style={[
          styles.input,
          { color: theme.colors.text }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={`${theme.colors.text}80`} // Adding transparency to placeholder text
        returnKeyType="search"
        onSubmitEditing={onSubmit || undefined}
        accessibilityLabel="Search text field"
        accessibilityHint="Enter text to search health data"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && onSubmit && (
        <TouchableOpacity
          onPress={onSubmit}
          style={styles.searchButton}
          accessibilityLabel="Search button"
          accessibilityHint="Tap to search"
          accessibilityRole="button"
        >
          <View style={[styles.searchButtonInner, { backgroundColor: theme.colors.primary }]}>
            <SearchIcon size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 2,
  },
  searchButton: {
    marginLeft: 8,
  },
  searchButtonInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default SearchBar;