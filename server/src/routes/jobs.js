import { fetchAdzunaJobs } from '../services/adzuna.js';

export async function jobRoutes(fastify) {
  fastify.get('/', async (request) => {
    const {
      query = '',
      location = '',
      jobType = '',
      workMode = '',
      datePosted = '',
      skills = '',
      page = 1,
    } = request.query;

    const jobs = await fetchAdzunaJobs({
      query, location, jobType, workMode, datePosted,
      skills: skills ? skills.split(',') : [],
      page: parseInt(page),
    });

    return jobs;
  });
}
