import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('❌ GEMINI_API_KEY not found in environment variables');
    }

    this.logger.log('✅ Gemini client initialized');
    this.client = new GoogleGenerativeAI(apiKey);
  }


  getModel(model: string) {
    return this.client.getGenerativeModel({ model });
  }
}
