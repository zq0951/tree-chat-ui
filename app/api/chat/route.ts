import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

// 允许最长 60 秒的底层运行时间
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 调用用户指定的 Gemini 3 预览版模型 (修正了 typo: perview -> preview)
    const result = streamText({
      model: google('gemini-3-flash-preview'),
      messages,
      temperature: 0.7,
    });

    // 为了降低我们自定义多分支前端的解析难度，
    // 这里使用纯文本格式流 (text stream) 返回，而不是 Vercel SDK 内部的数据协议流。
    return result.toTextStreamResponse();
  } catch (error: any) {
    if (error?.message?.includes('API key')) {
      return new Response('Error: Missing GOOGLE_GENERATIVE_AI_API_KEY in .env.local', { status: 401 });
    }
    return new Response(error?.message || 'Error generating response', { status: 500 });
  }
}
