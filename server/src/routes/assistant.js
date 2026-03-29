import { processAssistantMessage } from '../services/langgraph-assistant.js';
import store from '../store.js';

function getUserId(request) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  return token?.replace('mock-jwt-token-', '');
}

export async function assistantRoutes(fastify) {
  fastify.post('/chat', async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { message, conversationHistory = [], currentFilters = {} } = request.body;

    try {
      const result = await processAssistantMessage({
        message,
        conversationHistory,
        currentFilters,
        userId,
      });
      return result;
    } catch (error) {
      console.error('Assistant error:', error);
      return reply.status(500).send({ error: 'Assistant processing failed' });
    }
  });
}
