import express from 'express';
import cors from 'cors';
import { generateStory, continueStory, generateIllustration } from './storyGen';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/startStory', async (req, res) => {
  try {
    const { name, age, gender, genre, readStory } = req.body;
    
    let fullStory = '';
    for await (const chunk of generateStory(name, parseInt(age), gender, genre, readStory)) {
      if (typeof chunk === 'string') {
        fullStory += chunk;
      }
    }
    
    fullStory = fullStory.replace('<|eot_id|>', '');

    res.json({ story: fullStory });
  } catch (error) {
    console.error('startStory Error:', error);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

app.post('/continueStory', async (req, res) => {
  try {
    const { userResponse, previousStory, readStory, age } = req.body;
    
    let fullStory = '';
    for await (const chunk of continueStory(userResponse, previousStory, readStory, parseInt(age))) {
      if (typeof chunk === 'string') {
        fullStory += chunk;
      }
    }

    fullStory = fullStory.replace('<|eot_id|>', '');

    res.json({ story: fullStory });
  } catch (error) {
    console.error('continueStory Error:', error);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

app.post('/illustrate', async (req, res) => {
  try {
    const { segment } = req.body;

    if (!segment) {
      return res.status(400).json({ error: 'Story segment is required' });
    }

    const imagePath = await generateIllustration(segment);
    res.json({ imageUrl: imagePath });
  } catch (error) {
    console.error('Error in illustrate API:', error);
    res.status(500).json({ error: 'Failed to generate illustration', details: error instanceof Error ? error.message : String(error) });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});