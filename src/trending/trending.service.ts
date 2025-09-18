import { Injectable } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';

export interface TrendingIdea {
  title: string;
  description: string;
}

@Injectable()
export class TrendingService {
  constructor(private geminiService: GeminiService) {}

  async getTrendingIdeas(): Promise<TrendingIdea[]> {
    const prompt = `Generate 5 current trending business ideas that are popular right now in 2025. 
    Focus on:
    - AI and technology trends
    - Sustainability and green business
    - Remote work solutions
    - Health and wellness
    - E-commerce innovations
    - Social media and content creation

    Return as JSON array with this format:
    [
      {
        "title": "Idea Title",
        "description": "Short, valuable description (max 60 characters) highlighting key benefit"
      }
    ]

    Make descriptions concise, impactful, and focused on the main value proposition. 
    Make sure ideas are realistic, current, and have market potential.`;

    try {
      const messages = [{ role: 'user' as const, content: prompt }];
      const response =
        await this.geminiService.generateChatCompletion(messages);

      // Parse the JSON response with better error handling
      let ideas: TrendingIdea[];
      if (typeof response === 'string') {
        // Remove markdown code blocks if present
        let cleanResponse = response.trim();

        // Handle ```json code blocks
        const jsonMatch = cleanResponse.match(
          /```(?:json)?\s*([\s\S]*?)\s*```/,
        );
        if (jsonMatch) {
          cleanResponse = jsonMatch[1].trim();
        }

        // Remove any leading/trailing backticks or quotes
        cleanResponse = cleanResponse.replace(/^[`"']+|[`"']+$/g, '');

        try {
          const parsed = JSON.parse(cleanResponse) as TrendingIdea[];
          ideas = Array.isArray(parsed) ? parsed : [parsed];
        } catch (parseError) {
          console.error('JSON parsing failed:', parseError);
          console.error('Raw response:', response);
          console.error('Cleaned response:', cleanResponse);
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        ideas = Array.isArray(response)
          ? (response as TrendingIdea[])
          : [response as TrendingIdea];
      }

      // Validate the parsed ideas
      const validIdeas = ideas.filter(
        (idea) =>
          idea &&
          typeof idea.title === 'string' &&
          typeof idea.description === 'string',
      );

      if (validIdeas.length === 0) {
        throw new Error('No valid ideas found in AI response');
      }

      return validIdeas;
    } catch (error: any) {
      console.error('Error generating trending ideas:', error);
      // Return empty array instead of fallback data to let frontend handle the error
      throw new Error(`Failed to generate trending ideas: ${error?.message || 'Unknown error'}`);
    }
  }
}
