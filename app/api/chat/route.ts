import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';

// Allow a maximum of 60 seconds for underlying execution time
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Get configuration from request headers
    const apiKey = req.headers.get('X-Api-Key');
    const provider = req.headers.get('X-Provider');
    const baseUrl = req.headers.get('X-Base-Url');
    const model = req.headers.get('X-Model') || 'gemini-3-flash-preview';

    let selectedModel;

    if (apiKey && provider) {
      if (provider === 'google') {
        const google = createGoogleGenerativeAI({ apiKey, baseURL: baseUrl || undefined });
        selectedModel = google(model);
      } else if (provider === 'openai') {
        const openai = createOpenAI({ apiKey, baseURL: baseUrl || undefined });
        selectedModel = openai(model);
      } else {
        throw new Error(`Unsupported API provider: ${provider}`);
      }
    } else {
      throw new Error('API key not configured. Please click the ⚙️ API Settings button in the top right to add your API key.');
    }

    let streamController: ReadableStreamDefaultController | null = null;
    let externalError: Error | null = null;

    // Call the selected model
    const result = streamText({
      model: selectedModel,
      messages,
      temperature: 0.7,
      onError: ({ error }) => {
        console.error('An error occurred in streamText:', error);

        const errMsg = error instanceof Error ? error.message : String(error);
        const encoder = new TextEncoder();

        if (streamController) {
          try {
            streamController.enqueue(encoder.encode(`\n\n[API Error]: ${errMsg}`));
            streamController.close();
          } catch {
            // Controller might be already closed, ignore
          }
        } else {
          // If onError fires before the stream starts pulling
          externalError = error as Error;
        }
      }
    });

    // To reduce the parsing difficulty for our custom multi-branch frontend,
    // we intercept text stream errors here and send them as plain text to prevent them from being swallowed
    const encoder = new TextEncoder();
    const reader = result.textStream.getReader();

    const stream = new ReadableStream({
      start(controller) {
        streamController = controller;
        if (externalError) {
          const errMsg = externalError.message || String(externalError);
          controller.enqueue(encoder.encode(`\n\n[API Error]: ${errMsg}`));
          controller.close();
        }
      },
      async pull(controller) {
        try {
          const { value, done } = await reader.read();
          if (done) {
            try { controller.close(); } catch { }
          } else {
            controller.enqueue(encoder.encode(value));
          }
        } catch (streamError: unknown) {
          console.error("Stream generating error:", streamError);
          const errMsg = streamError instanceof Error ? streamError.message : String(streamError);
          try {
            controller.enqueue(encoder.encode(`\n\n[API Error]: ${errMsg}`));
            controller.close();
          } catch { }
        }
      },
      cancel() {
        reader.cancel();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("API Route Error:", message);
    if (message.includes('API key')) {
      return new Response('Error: Missing or Invalid API Key. Please check your API Settings in the top right.', { status: 401 });
    }
    return new Response(message || 'Error generating response', { status: 500 });
  }
}
