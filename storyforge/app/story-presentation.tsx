import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Button, Alert, Switch, ImageBackground } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config/apiConfig';
import * as Speech from 'expo-speech';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

interface StorySegment {
  story: string;
  image: string | null;
  response: string;
}

export default function StoryPresentationView() {
  const { genre, storyId, story: initialStory, audio: initialAudio, readStory: initialReadStory } = useLocalSearchParams();
  const [storySegments, setStorySegments] = useState<StorySegment[]>([]);
  const [userResponse, setUserResponse] = useState('');
  const [isQuestionPending, setIsQuestionPending] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [readStory, setReadStory] = useState(initialReadStory === 'true');
  const [userGender, setUserGender] = useState('');
  const [loadingSegments, setLoadingSegments] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (storySegments.length === 0) {
      fetchStory();
    } else if (readStory) {
      speakText(storySegments[storySegments.length - 1].story);
    }
    loadUserSettings();
    return () => {
      Speech.stop();
    };
  }, [storySegments, readStory]);

  const speakText = async (text: string) => {
    try {
      await Speech.speak(text, {
        language: 'en',
        pitch: 1,
        rate: 0.9,
      });
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };

  async function generateIllustrationForSegment(index: number) {
    setLoadingSegments(prev => ({ ...prev, [index]: true }));
    try {
      const segment = storySegments[index];
      const response = await fetch(getApiUrl('/illustrate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ segment: segment.story }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.imageUrl) {
        throw new Error('No image URL returned from server');
      }
      const fullImageUrl = getApiUrl(data.imageUrl);
      setStorySegments(prevSegments =>
        prevSegments.map((s, i) => (i === index ? { ...s, image: fullImageUrl } : s))
      );
    } catch (error) {
      console.error('Error generating illustration:', error);
      Alert.alert('Error', `Failed to generate illustration: ${error instanceof Error ? error.message : error}`);
    } finally {
      setLoadingSegments(prev => ({ ...prev, [index]: false }));
    }
  }


  async function fetchStory() {
    setIsLoading(true);
    try {
      const userSettingsString = await AsyncStorage.getItem('userSettings');
      const userSettings = userSettingsString ? JSON.parse(userSettingsString) : {};

      const response = await fetch(getApiUrl('/startStory'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userSettings.name,
          age: userSettings.age,
          gender: userSettings.gender,
          genre,
          storyId,
          readStory: userSettings.readStory || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStorySegments([{ story: data.story, image: null, response: '' }]);
      setIsQuestionPending(true);

      // Read the first story segment if readStory is true
      if (readStory) {
        await speakText(data.story);
      }
    } catch (error) {
      console.error('Error fetching story:', error instanceof Error ? error.message : error);
      Alert.alert('Error', `Failed to fetch story. ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function continueStory() {
    setIsLoading(true);
    const userSettingsString = await AsyncStorage.getItem('userSettings');
    const userSettings = userSettingsString ? JSON.parse(userSettingsString) : {};
    try {
      const response = await fetch(getApiUrl('/continueStory'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userResponse,
          previousStory: storySegments[storySegments.length - 1].story,
          readStory,
          age: userSettings.age,
        }),
      });
  
      const data = await response.json();
      let newStoryPart = data.story;
  
      setStorySegments(prevSegments => [
        ...prevSegments,
        { story: newStoryPart, image: null, response: userResponse }
      ]);
      setUserResponse(''); // Reset userResponse after adding it to the new segment
      setIsQuestionPending(true);
  
      if (readStory) {
        await speakText(newStoryPart);
      }
    } catch (error) {
      console.error('Error continuing story:', error);
      Alert.alert('Error', 'Failed to continue the story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserSettings() {
    try {
      const userSettingsString = await AsyncStorage.getItem('userSettings');
      if (userSettingsString) {
        const userSettings = JSON.parse(userSettingsString);
        setUserName(userSettings.name);
        setReadStory(userSettings.readStory || false);
        setUserGender(userSettings.gender);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  }

  function handleSubmitResponse() {
    if (userResponse.trim()) {
      setIsQuestionPending(false);
      continueStory();
    }
  }

  function handleReadStoryToggle(value: boolean) {
    setReadStory(value);
    saveReadStorySetting(value);
  }


  async function saveReadStorySetting(value: boolean) {
    try {
      const userSettingsString = await AsyncStorage.getItem('userSettings');
      const userSettings = userSettingsString ? JSON.parse(userSettingsString) : {};
      userSettings.readStory = value;
      await AsyncStorage.setItem('userSettings', JSON.stringify(userSettings));
    } catch (error) {
      console.error('Error saving read story setting:', error);
    }
  }

  const backgroundImage = userGender === 'Boy' 
    ? require('../assets/images/back_boy.jpg') 
    : require('../assets/images/back_girl.jpg');

    return (
      <ImageBackground 
        source={backgroundImage} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.25 }}
      >
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{userName ? `${userName}'s ` : ''}{genre} Story</Text>
            <View style={styles.readStoryToggle}>
              <Text>Read to me</Text>
              <Switch
                value={readStory}
                onValueChange={handleReadStoryToggle}
              />
            </View>
          </View>
          {storySegments.map((segment, index) => (
            <View key={index} style={styles.storySegment}>
            <Text style={styles.story}>{segment.story}</Text>
            {segment.image ? (
              <Image
                source={{ uri: segment.image }}
                style={styles.illustration}
                contentFit="contain"
              />
            ) : (
              <TouchableOpacity
                style={styles.showMeButton}
                onPress={() => generateIllustrationForSegment(index)}
                disabled={loadingSegments[index]}
              >
                {loadingSegments[index] ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.showMeButtonText}>Show Me</Text>
                )}
              </TouchableOpacity>
            )}
            {segment.response && (
              <Text style={styles.response}>Your response: {segment.response}</Text>
            )}
          </View>
          ))}
          {isQuestionPending && (
            <View style={styles.responseContainer}>
              <TextInput
                style={styles.input}
                value={userResponse}
                onChangeText={setUserResponse}
                placeholder="Enter your response..."
              />
              <View style={styles.buttonContainer}>
                <Button title="Submit" onPress={handleSubmitResponse} disabled={isLoading} />
              </View>
            </View>
          )}
        </ScrollView>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      </ImageBackground>
    );
  }
  
  const styles = StyleSheet.create({
    loadingOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    illustration: {
      width: '100%',
      height: 200,
      marginVertical: 10,
    },
  showMeButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
    marginVertical: 10,
  },
  showMeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  storySegment: {
    marginBottom: 20,
  },
    response: {
      fontStyle: 'italic',
      marginTop: 10,
      marginHorizontal: 10,
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      marginHorizontal: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    readStoryToggle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    story: {
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 20,
      marginHorizontal: 10,
    },
    responseContainer: {
      marginTop: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 10,
      marginBottom: 10,
      marginHorizontal: 10,
    },
    buttonContainer: {
      marginHorizontal: 10,
      marginVertical: 10,
    },
  });