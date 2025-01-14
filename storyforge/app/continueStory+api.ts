import { continueStory } from '../lib/llm/storyGen';

export async function POST(request: Request): Promise<Response> {
  try {
    const { userResponse, previousStory, readStory, age } = await request.json();
    
    let fullStory = '';

    for await (const chunk of continueStory(userResponse, previousStory, readStory, age)) {
      if (typeof chunk === 'string') {
        fullStory += chunk;
      }
    }

    fullStory = fullStory.replace('<|eot_id|>', '');

    return new Response(JSON.stringify({ story: fullStory }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('continueStory Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate story' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}