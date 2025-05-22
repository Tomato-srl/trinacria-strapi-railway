/**
 * OpenAI configuration
 */

module.exports = ({ env }) => ({
  apiKey: env('OPENAI_API_KEY'),
  assistantId: env('OPENAI_ASSISTANT_ID'),
  // Configurazione dei content-types da sincronizzare
  syncContentTypes: [
    // Esempio: { type: 'api::article.article', fields: ['title', 'content'] }
    { type: 'api::operator.operator', fields: ['title', 'description', 'address', 'district', 'type', 'phone', 'email', 'website', 'location'] }
  ],
}); 