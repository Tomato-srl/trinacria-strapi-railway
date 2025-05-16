/**
 * OpenAI configuration
 */

interface EnvFn {
  (key: string): string | undefined;
}

interface ConfigOptions {
  env: EnvFn;
}

interface OpenAIConfig {
  apiKey: string | undefined;
  assistantId: string | undefined;
  syncContentTypes: Array<{
    type: string;
    fields: string[];
  }>;
}

export default ({ env }: ConfigOptions): OpenAIConfig => ({
  apiKey: env('OPENAI_API_KEY'),
  assistantId: env('OPENAI_ASSISTANT_ID'),
  // Configurazione dei content-types da sincronizzare
  syncContentTypes: [
    // Esempio: { type: 'api::article.article', fields: ['title', 'content'] }
    { type: 'api::operator.operator', fields: ['title', 'description', 'address', 'district', 'type', 'phone', 'email', 'website', 'location'] }
  ],
}); 