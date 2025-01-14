import { HfInference } from '@huggingface/inference';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function* generateStory(name: string, age: number, gender: string, genre: string, readStory: boolean) {
  const prompt = `Generate the start of a ${genre} story for a ${age}-year-old reader. 
  The main character is a ${gender} named ${name}. The story should be appropriate in length 
  and vocabulary for a ${age}-year-old child to read. This will be a choose-your-own style 
  story, so after an initial setup, end the story segment with a multiple choice question.  We
  will continue the story with the child's response. Return just the story and the question, as text not json.
  Do not add commentary or any other text besides the story segment and the questions.
  Begin the story now:`;

  try {
    const stream = await hf.textGenerationStream({
      model: 'meta-llama/llama-3.2-3b-instruct',
      inputs: prompt,
      parameters: {
        max_new_tokens: 1000,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.15,
      },
    });

    for await (const { token } of stream) {
      yield token.text;
    }
  } catch (error) {
    console.error('storyGen Error generating story:', error);
  }
}

export async function* continueStory(userResponse: string, previousStory: string, readStory: boolean, age: number) {
  const prompt = `Here's the story so far:
  ${previousStory}

  The user responded: "${userResponse}"
  Continue the story based on this response. Remember to keep the story appropriate for and 
  readable by children aged ${age} and to end with another multiple choice question for the reader. Do not include any text other 
  than the story continuation. Don't preface the story segment or provide guidance or commentary.
  Continue the story now:`;

  try {
    const stream = await hf.textGenerationStream({
      model: 'meta-llama/llama-3.2-3b-instruct',
      inputs: prompt,
      parameters: {
        max_new_tokens: 1000,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.15,
      },
    });

    for await (const { token } of stream) {
      yield token.text;
    }
  } catch (error) {
    console.error('storyGen Error continuing story:', error);
  }
}

export async function generateIllustration(segment: string): Promise<string> {
  try {
    console.log('Generating illustration for segment:', segment);
    const prompt = `Create an illustration for this scene from a children's story: ${segment}`;
    console.log('Using prompt:', prompt);

    const response = await hf.textToImage({
      inputs: prompt,
      model: "stabilityai/stable-diffusion-2",
      parameters: {
        guidance_scale: 7.5,
        num_inference_steps: 50,
      },
    });

    if (!response) {
      throw new Error('No response from Hugging Face API');
    }

    // Generate a unique filename
    const filename = `illustration_${Date.now()}.png`;
    const publicDir = path.join(process.cwd(), 'public');
    const illustrationsDir = path.join(publicDir, 'illustrations');
    const publicPath = path.join(illustrationsDir, filename);

    console.log('Saving image to:', publicPath);

    // Create directories if they don't exist
    await mkdir(publicDir, { recursive: true });
    await mkdir(illustrationsDir, { recursive: true });

    // Save the image to the public folder
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(publicPath, buffer);

    console.log('Image saved successfully');

    // Return the URL path to the saved image
    return `/illustrations/${filename}`;
  } catch (error) {
    console.error('Error in generateIllustration:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}