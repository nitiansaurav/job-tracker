import store from '../store.js';
import { v4 as uuidv4 } from 'uuid';

function getUserId(request) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  return token?.replace('mock-jwt-token-', '');
}

export async function applicationRoutes(fastify) {
  // Get all applications
  fastify.get('/', async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    return store.applications.filter(a => a.userId === userId);
  });

  // Create application
  fastify.post('/', async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { jobId, jobTitle, company, applyUrl } = request.body;

    // Check if already applied
    const existing = store.applications.find(a => a.userId === userId && a.jobId === jobId);
    if (existing) return { application: existing, alreadyExists: true };

    const application = {
      id: uuidv4(),
      userId,
      jobId,
      jobTitle,
      company,
      applyUrl,
      status: 'applied',
      appliedAt: new Date().toISOString(),
      timeline: [{ status: 'applied', date: new Date().toISOString() }],
    };

    store.applications.push(application);
    return { application, alreadyExists: false };
  });

  // Update application status
  fastify.put('/:id/status', async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { id } = request.params;
    const { status } = request.body;

    const app = store.applications.find(a => a.id === id && a.userId === userId);
    if (!app) return reply.status(404).send({ error: 'Application not found' });

    app.status = status;
    app.timeline.push({ status, date: new Date().toISOString() });

    return { application: app };
  });
}
