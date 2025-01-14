import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator, Switch, ImageBackground } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config/apiConfig';

export default function StoryLaunchView() {
  const [genre, setGenre] = useState('fantasy');
  const [userSettings, setUserSettings] = useState({ name: '', age: '', gender: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [readStory, setReadStory] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings !== null) {
        setUserSettings(JSON.parse(settings));
        setReadStory(JSON.parse(settings).readStory || false);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };
  const handleReadStoryToggle = (value: boolean) => {
    setReadStory(value);
    saveReadStorySetting(value);
  };

  const saveReadStorySetting = async (value: boolean) => {
    try {
      const updatedSettings = { ...userSettings, readStory: value };
      await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving read story setting:', error);
    }
  };

  const handleLaunchStory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('/startStory'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userSettings,
          genre,
          readStory
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to start the story ${getApiUrl('/startStory')}`);
      }
  
      const data = await response.json();
      const storyId = Math.random().toString(36).substring(7);
     
      router.push({
        pathname: '/story-presentation',
        params: { 
          genre, 
          storyId,
          story: data.story,
          audio: data.audio,
          readStory: readStory.toString()
        }
      });
    } catch (error) {
      console.error('Error starting story:', error instanceof Error ? error.message : error);
      Alert.alert('Error', `Failed to start the story. ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundImage = userSettings.gender === 'Boy' 
    ? require('../assets/images/back_boy.jpg') 
    : require('../assets/images/back_girl.jpg');

    return (
      <ImageBackground 
        source={backgroundImage} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.25 }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Launch a Story</Text>
          <Text style={styles.greeting}>Hello, {userSettings.name}!</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={genre}
              style={styles.picker}
              onValueChange={(itemValue) => setGenre(itemValue)}
            >
              <Picker.Item label="Fantasy" value="Fantasy" />
              <Picker.Item label="Adventure" value="Sdventure" />
              <Picker.Item label="Sci-Fi" value="Scifi" />
              <Picker.Item label="Sports" value="Sports" />
              <Picker.Item label="Animals" value="Animals" />
              <Picker.Item label="Friendship" value="Friendship" />
              <Picker.Item label="Brothers and Sisters" value="Siblings" />
              <Picker.Item label="Space Pirates" value="Space Pirates"   />
              <Picker.Item label="Superheroes" value="Superheroes" />
              <Picker.Item label="Ocean" value="Oceans" />
            </Picker>
          </View>
          <View style={styles.readStoryToggle}>
            <Text>Read to Me</Text>
            <Switch
              value={readStory}
              onValueChange={handleReadStoryToggle}
            />
          </View>
  
          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.activityIndicator} />
          ) : (
            <View style={styles.buttonContainer}>
              <Button 
                title="Start Story" 
                onPress={handleLaunchStory} 
                disabled={isLoading}
              />
            </View>
          )}
        </View>
      </ImageBackground>
    );
  }
  
  const styles = StyleSheet.create({
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
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      marginHorizontal: 10,
    },
    greeting: {
      fontSize: 18,
      marginBottom: 10,
      marginHorizontal: 10,
    },
    pickerContainer: {
      marginVertical: 10,
      marginHorizontal: 10,
    },
    picker: {
      height: 50,
      width: '100%',
    },
    readStoryToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    buttonContainer: {
      marginHorizontal: 10,
      marginVertical: 10,
    },
    activityIndicator: {
      marginVertical: 10,
    },
  });