import { matchJobsWithResume } from '../services/langchain-matcher.js';
import store from '../store.js';

function getUserId(request) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  return token?.replace('mock-jwt-token-', '');
}

export async function matchRoutes(fastify) {
  fastify.post('/score', async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const user = store.users.find(u => u.id === userId);
    if (!user) return reply.status(401).send({ error: 'User not found' });
    if (!user.resumeText) return reply.status(400).send({ error: 'No resume uploaded' });

    const { jobs } = request.body;
    if (!jobs || !jobs.length) return reply.status(400).send({ error: 'No jobs provided' });

    try {
      const scoredJobs = await matchJobsWithResume(jobs, user.resumeText);
      return { scoredJobs };
    } catch (error) {
      console.error('Matching error:', error);
      return reply.status(500).send({ error: 'AI matching failed' });
    }
  });
}
