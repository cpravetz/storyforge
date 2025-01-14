import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ImageBackground } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsView() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Girl');
  const router = useRouter();

  const handleSave = () => {
    // Save user data to AsyncStorage
    const userSettings = { name, age, gender };
    AsyncStorage.setItem('userSettings', JSON.stringify(userSettings));

    router.push('./story-launch');
  };

  const backgroundImage = require('../assets/images/back_ocean.png');


  return (
    <ImageBackground 
    source={backgroundImage} 
    style={styles.backgroundImage}
    imageStyle={{ opacity: 0.25 }}
  >
    <View style={styles.container}>
      <Text style={styles.title}>User Settings</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <Text style={styles.label}>Gender</Text>
      <Picker
        selectedValue={gender}
        style={styles.picker}
        onValueChange={(itemValue) => setGender(itemValue)}
      >
        <Picker.Item label="Girl" value="Girl" />
        <Picker.Item label="Boy" value="Boy" />
      </Picker>
      <Button title="Save" onPress={handleSave} />
    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
  },
});