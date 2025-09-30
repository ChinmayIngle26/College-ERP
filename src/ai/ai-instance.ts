
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const genkitPlugins = [];

if (process.env.GOOGLE_GENAI_API_KEY) {
  genkitPlugins.push(googleAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
    // You can specify a default model for text generation here if desired
    // defaultModel: 'gemini-1.5-flash-latest',
  }));
  console.log('[ai-instance] Google AI plugin configured with API key.');
} else {
  console.warn('[ai-instance] GOOGLE_GENAI_API_KEY is not set. Google AI plugin will not be available. Genkit features requiring this plugin may fail if called.');
}

export const ai = genkit({
  promptDir: './prompts', // This might not be used if prompts are defined inline
  plugins: genkitPlugins,
  // Explicitly set a default model for ai.generate calls if not specified in the call itself
  // This ensures ai.generate has a model if the prompt doesn't specify one.
  // However, for `ai.definePrompt`, the model choice is often more contextual.
  // For the email generation prompt, gemini-1.5-flash should be good.
  // Using a specific gemini model. This was the missing piece causing AI analysis to fail.
  defaultModel: 'googleai/gemini-1.5-flash', 
});
