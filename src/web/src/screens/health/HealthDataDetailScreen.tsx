import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { HealthScreenProps } from '../../types/navigation.types';
import { HealthDataType, HealthDataResponse } from '../../types/health.types';
import { getHealthDataById, deleteHealthData } from '../../services/health.service';
import { sendMessage } from '../../services/chat.service';
import Header from '../../components/common/Header';
import Button from '../../components/buttons/Button';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { ButtonVariant } from '../../types/components.types';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft } from '../../assets/icons';

/**
 * HealthDataDetailScreen displays detailed information about a specific health data entry.
 * It allows users to view full details, ask the AI about the data, or delete it.
 */
const HealthDataDetailScreen: React.FC<HealthScreenProps<'HealthDataDetail'>> = ({ 
  route, 
  navigation 
}) => {
  // Extract the health data ID from the route params
  const { healthDataId } = route.params;
  
  // Get theme from context for consistent styling
  const { theme } = useTheme();
  
  // State management
  const [healthData, setHealthData] = useState<HealthDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState<boolean>(false);

  // Fetch health data by ID
  const fetchHealthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHealthDataById(healthDataId);
      if (data) {
        setHealthData(data);
      } else {
        setError('Failed to retrieve health data. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while fetching health data.');
      console.error('Error fetching health data:', err);
    } finally {
      setLoading(false);
    }
  }, [healthDataId]);

  // Load health data on component mount
  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // Handle navigation back to previous screen
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Handle asking AI about the health data
  const handleAskAI = async () => {
    if (!healthData) return;

    try {
      // Create a message for the LLM about this health data
      let message = '';
      
      switch (healthData.type) {
        case HealthDataType.MEAL:
          const mealData = healthData.data as any;
          message = `I'd like to know more about this meal I had: ${mealData.description}. It was a ${mealData.mealType} on ${healthData.displayDate}.`;
          break;
        case HealthDataType.LAB_RESULT:
          const labData = healthData.data as any;
          message = `I'd like to know more about this lab result: ${labData.testType} from ${labData.testDate}. ${labData.notes ? `Notes: ${labData.notes}` : ''}`;
          break;
        case HealthDataType.SYMPTOM:
          const symptomData = healthData.data as any;
          message = `I'm experiencing this symptom: ${symptomData.description}. Severity: ${symptomData.severity}. ${symptomData.duration ? `Duration: ${symptomData.duration}` : ''}`;
          break;
        default:
          message = `I'd like to know more about this health data from ${healthData.displayDate}.`;
      }

      // Send message to LLM and navigate to chat screen
      const response = await sendMessage(message);
      navigation.navigate('Chat', { conversationId: response.conversationId });
    } catch (error) {
      console.error('Error asking AI about health data:', error);
      setError('Failed to ask AI about this health data. Please try again.');
    }
  };

  // Handle delete button press - show confirmation modal
  const handleDeletePress = () => {
    setDeleteConfirmVisible(true);
  };

  // Handle confirming deletion
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const success = await deleteHealthData(healthDataId);
      if (success) {
        // Navigate back to the health log after successful deletion
        navigation.goBack();
      } else {
        setError('Failed to delete health data. Please try again.');
        setDeleteConfirmVisible(false);
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred while deleting health data.');
      console.error('Error deleting health data:', err);
      setDeleteConfirmVisible(false);
      setLoading(false);
    }
  };

  // Handle canceling deletion
  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false);
  };

  // Determine the title based on health data type
  const getTitle = () => {
    if (!healthData) return 'Health Data Detail';
    
    switch (healthData.type) {
      case HealthDataType.MEAL:
        return 'Meal Detail';
      case HealthDataType.LAB_RESULT:
        return 'Lab Result Detail';
      case HealthDataType.SYMPTOM:
        return 'Symptom Detail';
      default:
        return 'Health Data Detail';
    }
  };

  // Render the health data details based on its type
  const renderHealthDataDetails = () => {
    if (!healthData) return null;

    // Common data to display regardless of type
    const renderCommonDetails = () => (
      <>
        <Text 
          style={[styles.timestamp, { color: theme.colors.TEXT }]}
          accessibilityLabel={`Recorded on ${healthData.displayDate} at ${healthData.displayTime}`}
        >
          {healthData.displayDate} {healthData.displayTime}
        </Text>
        
        {healthData.metadata?.source && (
          <Text 
            style={[styles.metadata, { color: theme.colors.TEXT }]}
            accessibilityLabel={`Source: ${healthData.metadata.source}`}
          >
            Source: {healthData.metadata.source}
          </Text>
        )}
      </>
    );

    switch (healthData.type) {
      case HealthDataType.MEAL: {
        const mealData = healthData.data as any;
        return (
          <View style={[styles.contentContainer, { backgroundColor: theme.colors.CARD }]}>
            <Text style={[styles.label, { color: theme.colors.TEXT }]}>Meal Type</Text>
            <Text 
              style={[styles.value, { color: theme.colors.TEXT }]}
              accessibilityLabel={`Meal type: ${mealData.mealType}`}
            >
              {mealData.mealType}
            </Text>
            
            {mealData.imageUrl && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: mealData.imageUrl }} 
                  style={styles.image}
                  resizeMode="contain"
                  accessibilityLabel="Photo of meal"
                />
              </View>
            )}
            
            <Text style={[styles.label, { color: theme.colors.TEXT }]}>Description</Text>
            <Text 
              style={[styles.value, { color: theme.colors.TEXT }]}
              accessibilityLabel={`Description: ${mealData.description}`}
            >
              {mealData.description}
            </Text>
            
            {renderCommonDetails()}
          </View>
        );
      }
      
      case HealthDataType.LAB_RESULT: {
        const labData = healthData.data as any;
        return (
          <View style={[styles.contentContainer, { backgroundColor: theme.colors.CARD }]}>
            <Text style={[styles.label, { color: theme.colors.TEXT }]}>Test Type</Text>
            <Text 
              style={[styles.value, { color: theme.colors.TEXT }]}
              accessibilityLabel={`Test type: ${labData.testType}`}
            >
              {labData.testType}
            </Text>
            
            <Text style={[styles.label, { color: theme.colors.TEXT }]}>Test Date</Text>
            <Text 
              style={[styles.value, { color: theme.colors.TEXT }]}
              accessibilityLabel={`Test date: ${labData.testDate}`}
            >
              {labData.testDate}
            </Text>
            
            {labData.imageUrl && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: labData.imageUrl }} 
                  style={styles.image}
                  resizeMode="contain"
                  accessibilityLabel="Photo of lab result"
                />
              </View>
            )}
            
            {labData.notes && (
              <>
                <Text style={[styles.label, { color: theme.colors.TEXT }]}>Notes</Text>
                <Text 
                  style={[styles.value, { color: theme.colors.TEXT }]}
                  accessibilityLabel={`Notes: ${labData.notes}`}
                >
                  {labData.notes}
                </Text>
              </>
            )}
            
            {renderCommonDetails()}
          </View>
        );
      }
      
      case HealthDataType.SYMPTOM: {
        const symptomData = healthData.data as any;
        return (
          <View style={[styles.contentContainer, { backgroundColor: theme.colors.CARD }]}>
            <Text style={[styles.label, { color: theme.colors.TEXT }]}>Symptom</Text>
            <Text 
              style={[styles.value, { color: theme.colors.TEXT }]}
              accessibilityLabel={`Symptom: ${symptomData.description}`}
            >
              {symptomData.description}
            </Text>
            
            <Text style={[styles.label, { color: theme.colors.TEXT }]}>Severity</Text>
            <Text 
              style={[styles.value, { color: theme.colors.TEXT }]}
              accessibilityLabel={`Severity: ${symptomData.severity}`}
            >
              {symptomData.severity}
            </Text>
            
            {symptomData.duration && (
              <>
                <Text style={[styles.label, { color: theme.colors.TEXT }]}>Duration</Text>
                <Text 
                  style={[styles.value, { color: theme.colors.TEXT }]}
                  accessibilityLabel={`Duration: ${symptomData.duration}`}
                >
                  {symptomData.duration}
                </Text>
              </>
            )}
            
            {symptomData.transcription && (
              <>
                <Text style={[styles.label, { color: theme.colors.TEXT }]}>Transcription</Text>
                <Text 
                  style={[styles.value, { color: theme.colors.TEXT }]}
                  accessibilityLabel={`Transcription: ${symptomData.transcription}`}
                >
                  {symptomData.transcription}
                </Text>
              </>
            )}
            
            {renderCommonDetails()}
          </View>
        );
      }
      
      default:
        return (
          <View style={[styles.contentContainer, { backgroundColor: theme.colors.CARD }]}>
            <Text style={[styles.value, { color: theme.colors.TEXT }]}>
              Unknown health data type
            </Text>
            {renderCommonDetails()}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.BACKGROUND }]}>
      <Header
        title={getTitle()}
        leftIcon={<ArrowLeft />}
        onLeftPress={handleGoBack}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" color={theme.colors.PRIMARY} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.ERROR }]}>
            {error}
          </Text>
          <Button
            label="Try Again"
            onPress={fetchHealthData}
            variant={ButtonVariant.PRIMARY}
          />
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          accessible={true}
          accessibilityRole="scrollView"
          accessibilityLabel={`Details for ${getTitle()}`}
        >
          <View style={styles.typeContainer}>
            <Text 
              style={[styles.typeText, { 
                color: theme.colors.TEXT,
                fontFamily: theme.typography.fontFamily.semiBold,
                fontSize: theme.typography.fontSize.l 
              }]}
              accessibilityRole="header"
            >
              {healthData?.type === HealthDataType.LAB_RESULT
                ? 'Lab Result'
                : healthData?.type === HealthDataType.SYMPTOM
                ? 'Symptom'
                : 'Meal'} - {healthData?.displayDate}
            </Text>
          </View>
          
          {renderHealthDataDetails()}
          
          <View style={styles.actionContainer}>
            <Button
              label="Ask AI about this"
              onPress={handleAskAI}
              variant={ButtonVariant.PRIMARY}
              style={styles.button}
              accessibilityLabel="Ask AI about this health data"
            />
            <Button
              label="Delete"
              onPress={handleDeletePress}
              variant={ButtonVariant.SECONDARY}
              style={styles.button}
              accessibilityLabel="Delete this health data"
            />
          </View>
        </ScrollView>
      )}
      
      <ConfirmationModal
        visible={deleteConfirmVisible}
        title="Delete Health Data"
        message="Are you sure you want to delete this health data? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmVariant={ButtonVariant.SECONDARY}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    marginVertical: 16,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: 14,
    marginTop: 12,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
    marginTop: 16,
    opacity: 0.7,
  },
  metadata: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  actionContainer: {
    marginTop: 16,
  },
  button: {
    marginBottom: 12,
  },
});

export default HealthDataDetailScreen;