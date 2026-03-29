import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth.js';
import { jobRoutes } from './routes/jobs.js';
import { resumeRoutes } from './routes/resume.js';
import { matchRoutes } from './routes/match.js';
import { applicationRoutes } from './routes/applications.js';
import { assistantRoutes } from './routes/assistant.js';

dotenv.config();

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: true });
await fastify.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(jobRoutes, { prefix: '/api/jobs' });
fastify.register(resumeRoutes, { prefix: '/api/resume' });
fastify.register(matchRoutes, { prefix: '/api/match' });
fastify.register(applicationRoutes, { prefix: '/api/applications' });
fastify.register(assistantRoutes, { prefix: '/api/assistant' });

fastify.get('/api/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    await fastify.listen({ port: parseInt(process.env.PORT || '3001'), host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
