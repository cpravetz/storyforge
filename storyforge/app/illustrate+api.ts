import { generateIllustration } from '../lib/llm/storyGen';

export async function POST(request: Request): Promise<Response> {
  try {
    console.log('Received illustration request');
    const { segment } = await request.json();

    if (!segment) {
      console.error('No segment provided');
      return new Response(JSON.stringify({ error: 'Story segment is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    console.log('Generating illustration for segment:', segment);
    const imagePath = await generateIllustration(segment);
    console.log('Illustration generated, path:', imagePath);

    return new Response(JSON.stringify({ imageUrl: imagePath }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in illustrate API:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return new Response(JSON.stringify({ error: 'Failed to generate illustration', details: error instanceof Error ? error.message : String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}