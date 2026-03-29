import store from '../store.js';
import pdfParse from 'pdf-parse';

function getUserId(request) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  return token?.replace('mock-jwt-token-', '');
}

export async function resumeRoutes(fastify) {
  // Upload resume
  fastify.post('/upload', async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const user = store.users.find(u => u.id === userId);
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const file = await request.file();
    if (!file) return reply.status(400).send({ error: 'No file uploaded' });

    const buffer = await file.toBuffer();
    let text = '';

    if (file.filename.endsWith('.pdf')) {
      try {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (e) {
        return reply.status(400).send({ error: 'Failed to parse PDF' });
      }
    } else if (file.filename.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return reply.status(400).send({ error: 'Only PDF and TXT files are supported' });
    }

    user.resumeText = text;
    user.resumeFileName = file.filename;

    return { success: true, fileName: file.filename, textLength: text.length };
  });

  // Get resume status
  fastify.get('/status', async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const user = store.users.find(u => u.id === userId);
    if (!user) return reply.status(401).send({ error: 'User not found' });

    return {
      hasResume: !!user.resumeText,
      fileName: user.resumeFileName || null,
    };
  });

  // Delete resume
  fastify.delete('/', async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const user = store.users.find(u => u.id === userId);
    if (!user) return reply.status(401).send({ error: 'User not found' });

    user.resumeText = '';
    user.resumeFileName = '';
    return { success: true };
  });
}
