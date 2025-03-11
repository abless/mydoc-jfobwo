import React, { useState, useEffect, useCallback } from 'react'; // React v18.2.0
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native'; // React Native v0.71.0

import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import { VoiceRecorderProps } from '../../types/components.types';
import Button from '../buttons/Button';
import LoadingIndicator from '../common/LoadingIndicator';
import MicrophoneIcon from '../../assets/icons/microphone';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * A React Native component that provides voice recording functionality for symptom reporting
 * in the Health Advisor application. It allows users to record, play back, and transcribe
 * voice descriptions of symptoms.
 * 
 * @param props - The component props
 * @returns The rendered VoiceRecorder component
 */
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordComplete,
  maxDuration = 120, // 2 minutes default
  style,
}) => {
  // Get current theme for styling
  const { theme } = useTheme();
  
  // Set up animation value for microphone pulse effect
  const pulseAnim = useState(new Animated.Value(1))[0];
  
  // Initialize the voice recorder hook with options
  const {
    isRecording,
    isPlaying,
    isTranscribing,
    recordingPath,
    transcription,
    duration,
    error,
    permissionGranted,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    deleteRecording,
    reset
  } = useVoiceRecorder({
    autoTranscribe: true,
    maxDuration,
    onTranscriptionComplete: (text) => {
      // Hook will automatically update the transcription state
      console.log('Transcription completed:', text);
    },
    onError: (errorMsg) => {
      console.error('Voice recorder error:', errorMsg);
    }
  });
  
  // Start/stop animation based on recording state
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;
    
    if (isRecording) {
      // Create a looping animation sequence for the microphone button
      pulseAnimation = Animated.loop(
        Animated.sequence([
          // Scale up
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          // Scale down
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      );
      
      pulseAnimation.start();
    } else {
      // Reset animation when not recording
      pulseAnim.setValue(1);
    }
    
    // Cleanup animation on unmount or state change
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isRecording, pulseAnim]);
  
  // Handle toggling recording state
  const handleRecordPress = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);
  
  // Handle playing recorded audio
  const handlePlayPress = useCallback(async () => {
    if (isPlaying) {
      await stopPlayback();
    } else {
      await playRecording();
    }
  }, [isPlaying, playRecording, stopPlayback]);
  
  // Handle deleting recording
  const handleDeletePress = useCallback(async () => {
    await deleteRecording();
  }, [deleteRecording]);
  
  // Handle saving/completing recording
  const handleSavePress = useCallback(() => {
    if (recordingPath && transcription) {
      onRecordComplete(recordingPath, transcription);
    }
  }, [recordingPath, transcription, onRecordComplete]);
  
  // Get recording status text based on current state
  const getStatusText = () => {
    if (isRecording) {
      return 'Recording...';
    }
    if (isTranscribing) {
      return 'Transcribing...';
    }
    if (recordingPath) {
      return `Recording complete (${Math.round(duration / 1000)}s)`;
    }
    return 'Tap microphone to start recording';
  };
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.CARD,
        borderRadius: theme.borderRadius.medium,
        padding: theme.spacing.m
      }, 
      style
    ]}>
      {/* Recording Button with Pulse Animation */}
      <TouchableOpacity
        onPress={handleRecordPress}
        style={[
          styles.recordButton,
          { 
            backgroundColor: isRecording ? theme.colors.ERROR : theme.colors.PRIMARY,
            borderRadius: theme.borderRadius.round 
          }
        ]}
        disabled={isTranscribing}
        accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
        accessibilityRole="button"
        accessibilityState={{ 
          checked: isRecording,
          disabled: isTranscribing 
        }}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <MicrophoneIcon size={36} color={theme.colors.WHITE} theme={theme} />
        </Animated.View>
      </TouchableOpacity>
      
      {/* Status Text */}
      <Text 
        style={[
          styles.statusText, 
          { 
            color: theme.colors.TEXT,
            fontSize: theme.typography.fontSize.m,
            marginBottom: theme.spacing.m
          }
        ]}
        accessibilityLabel={`Recording status: ${getStatusText()}`}
      >
        {getStatusText()}
      </Text>
      
      {/* Loading Indicator during transcription */}
      {isTranscribing && (
        <LoadingIndicator 
          size="small" 
          color={theme.colors.PRIMARY} 
          style={{ marginVertical: theme.spacing.s }}
        />
      )}
      
      {/* Transcription Text */}
      {transcription ? (
        <View style={[
          styles.transcriptionContainer,
          { marginVertical: theme.spacing.s }
        ]}>
          <Text 
            style={[
              styles.transcriptionLabel, 
              { 
                color: theme.colors.TEXT,
                fontFamily: theme.typography.fontFamily.medium,
                fontSize: theme.typography.fontSize.m,
                marginBottom: theme.spacing.xs
              }
            ]}
          >
            Transcription:
          </Text>
          <Text 
            style={[
              styles.transcriptionText, 
              { 
                color: theme.colors.TEXT,
                backgroundColor: theme.isDark 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.05)',
                borderRadius: theme.borderRadius.small,
                padding: theme.spacing.s,
                fontSize: theme.typography.fontSize.m
              }
            ]}
          >
            {transcription}
          </Text>
        </View>
      ) : null}
      
      {/* Error Message */}
      {error ? (
        <Text 
          style={[
            styles.errorText, 
            { 
              color: theme.colors.ERROR,
              fontSize: theme.typography.fontSize.s,
              marginVertical: theme.spacing.s
            }
          ]}
          accessibilityLabel={`Error: ${error}`}
        >
          {error}
        </Text>
      ) : null}
      
      {/* Control Buttons - only show after recording is complete */}
      {recordingPath && !isRecording && !isTranscribing && (
        <View style={[
          styles.controlsContainer,
          { marginTop: theme.spacing.m }
        ]}>
          <Button
            label={isPlaying ? "Stop" : "Play"}
            onPress={handlePlayPress}
            variant={isPlaying ? "secondary" : "primary"}
            disabled={!recordingPath}
          />
          <Button
            label="Delete"
            onPress={handleDeletePress}
            variant="outline"
          />
          <Button
            label="Save"
            onPress={handleSavePress}
            disabled={!transcription}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  recordButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    textAlign: 'center',
  },
  transcriptionContainer: {
    width: '100%',
  },
  transcriptionLabel: {
    fontWeight: '500',
  },
  transcriptionText: {
    width: '100%',
  },
  errorText: {
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

export default VoiceRecorder;