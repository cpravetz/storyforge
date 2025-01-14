import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename;
    const filePath = path.join(process.cwd(), 'public', 'illustrations', filename);
    const fileBuffer = await readFile(filePath);
    
    return new Response(fileBuffer, {
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (error) {
    console.error('Error serving illustration:', error);
    return new Response('Image not found', { status: 404 });
  }
}