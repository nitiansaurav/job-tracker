import store from '../store.js';

export async function authRoutes(fastify) {
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;
    const user = store.users.find(u => u.email === email && u.password === password);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    const { password: _, ...safeUser } = user;
    return { user: safeUser, token: 'mock-jwt-token-' + user.id };
  });

  fastify.get('/me', async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) return reply.status(401).send({ error: 'Unauthorized' });
    const userId = token.replace('mock-jwt-token-', '');
    const user = store.users.find(u => u.id === userId);
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });
    const { password: _, ...safeUser } = user;
    return { user: safeUser };
  });
}
