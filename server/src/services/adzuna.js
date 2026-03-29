const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs';

export async function fetchAdzunaJobs({ query, location, jobType, workMode, datePosted, skills, page }) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey || appId === '9e5e3580') {
    // Return mock data if no API keys configured
    return getMockJobs({ query, location, jobType, workMode, skills });
  }

  try {
    let what = [query, ...skills].filter(Boolean).join(' ');
    let where = location || '';

    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: '20',
      what: what,
      where: where,
      content_type: 'application/json',
    });

    if (datePosted === '24h') params.set('max_days_old', '1');
    else if (datePosted === 'week') params.set('max_days_old', '7');
    else if (datePosted === 'month') params.set('max_days_old', '30');

    if (jobType === 'full-time') params.set('full_time', '1');
    else if (jobType === 'part-time') params.set('part_time', '1');
    else if (jobType === 'contract') params.set('contract', '1');

    const url = `${ADZUNA_BASE}/us/search/${page}?${params.toString()}`;
    const res = await fetch(url);
    const data = await res.json();

    return {
      jobs: (data.results || []).map(mapAdzunaJob),
      total: data.count || 0,
      page,
    };
  } catch (error) {
    console.error('Adzuna API error:', error);
    return getMockJobs({ query, location, jobType, workMode, skills });
  }
}

function mapAdzunaJob(job) {
  return {
    id: job.id?.toString() || Math.random().toString(36).substr(2),
    title: job.title || 'Untitled',
    company: job.company?.display_name || 'Unknown Company',
    location: job.location?.display_name || 'Unknown',
    description: job.description || '',
    jobType: job.contract_time || 'full-time',
    workMode: detectWorkMode(job),
    applyUrl: job.redirect_url || '#',
    postedDate: job.created || new Date().toISOString(),
    salary: job.salary_min ? `$${Math.round(job.salary_min)} - $${Math.round(job.salary_max || job.salary_min)}` : null,
    source: 'adzuna',
  };
}

function detectWorkMode(job) {
  const text = ((job.title || '') + ' ' + (job.description || '')).toLowerCase();
  if (text.includes('remote')) return 'remote';
  if (text.includes('hybrid')) return 'hybrid';
  return 'on-site';
}

function getMockJobs({ query, location, jobType, workMode, skills }) {
  const mockJobs = [
    { id: '1', title: 'Senior React Developer', company: 'TechCorp', location: 'San Francisco, CA', description: 'We are looking for a Senior React Developer with 5+ years of experience in React, TypeScript, Node.js. Experience with Redux, GraphQL, and AWS preferred. You will lead frontend development for our SaaS platform.', jobType: 'full-time', workMode: 'remote', applyUrl: 'https://example.com/apply/1', postedDate: new Date(Date.now() - 86400000).toISOString(), salary: '$150,000 - $180,000', source: 'mock' },
    { id: '2', title: 'Full Stack Engineer', company: 'StartupXYZ', location: 'New York, NY', description: 'Full Stack Engineer needed. Must know React, Node.js, Python, PostgreSQL. Experience with Docker, Kubernetes, CI/CD pipelines. Building scalable microservices architecture.', jobType: 'full-time', workMode: 'hybrid', applyUrl: 'https://example.com/apply/2', postedDate: new Date(Date.now() - 172800000).toISOString(), salary: '$130,000 - $160,000', source: 'mock' },
    { id: '3', title: 'ML Engineer', company: 'AI Labs', location: 'Remote', description: 'Machine Learning Engineer with expertise in PyTorch, TensorFlow, Python. NLP experience required. Work on cutting-edge LLM applications. Strong understanding of transformer architectures.', jobType: 'full-time', workMode: 'remote', applyUrl: 'https://example.com/apply/3', postedDate: new Date(Date.now() - 259200000).toISOString(), salary: '$170,000 - $210,000', source: 'mock' },
    { id: '4', title: 'Frontend Developer (Contract)', company: 'DesignStudio', location: 'Austin, TX', description: 'Contract frontend developer needed for 6-month project. React, CSS, Tailwind, Figma integration. Building design system components and responsive layouts.', jobType: 'contract', workMode: 'on-site', applyUrl: 'https://example.com/apply/4', postedDate: new Date(Date.now() - 432000000).toISOString(), salary: '$80/hr', source: 'mock' },
    { id: '5', title: 'Backend Engineer - Node.js', company: 'CloudScale', location: 'Seattle, WA', description: 'Node.js backend engineer. Fastify, Express, MongoDB, Redis. Microservices, event-driven architecture. Experience with message queues (RabbitMQ/Kafka).', jobType: 'full-time', workMode: 'hybrid', applyUrl: 'https://example.com/apply/5', postedDate: new Date(Date.now() - 518400000).toISOString(), salary: '$140,000 - $170,000', source: 'mock' },
    { id: '6', title: 'Python Developer Intern', company: 'DataFlow', location: 'Chicago, IL', description: 'Python internship. Django, Flask, data processing. Learn machine learning basics. Pandas, NumPy, scikit-learn exposure.', jobType: 'internship', workMode: 'on-site', applyUrl: 'https://example.com/apply/6', postedDate: new Date(Date.now() - 86400000).toISOString(), salary: '$25/hr', source: 'mock' },
    { id: '7', title: 'DevOps Engineer', company: 'InfraMax', location: 'Denver, CO', description: 'DevOps engineer with AWS, Docker, Kubernetes, Terraform. CI/CD pipeline management. Infrastructure as code. Monitoring with Prometheus and Grafana.', jobType: 'full-time', workMode: 'remote', applyUrl: 'https://example.com/apply/7', postedDate: new Date(Date.now() - 345600000).toISOString(), salary: '$135,000 - $165,000', source: 'mock' },
    { id: '8', title: 'React Native Developer', company: 'MobileFirst', location: 'Los Angeles, CA', description: 'React Native developer for cross-platform mobile apps. TypeScript, Redux, REST APIs. Experience with app store deployment and push notifications.', jobType: 'full-time', workMode: 'hybrid', applyUrl: 'https://example.com/apply/8', postedDate: new Date(Date.now() - 604800000).toISOString(), salary: '$125,000 - $155,000', source: 'mock' },
    { id: '9', title: 'Data Scientist', company: 'AnalyticsPro', location: 'Boston, MA', description: 'Data Scientist with Python, R, SQL. Machine learning, statistical modeling. Experience with A/B testing, recommendation systems. PhD preferred.', jobType: 'full-time', workMode: 'on-site', applyUrl: 'https://example.com/apply/9', postedDate: new Date(Date.now() - 172800000).toISOString(), salary: '$145,000 - $185,000', source: 'mock' },
    { id: '10', title: 'Part-time UI/UX Designer', company: 'CreativeHub', location: 'Portland, OR', description: 'Part-time UI/UX designer. Figma, Sketch, Adobe XD. User research, wireframing, prototyping. Design system maintenance.', jobType: 'part-time', workMode: 'remote', applyUrl: 'https://example.com/apply/10', postedDate: new Date(Date.now() - 86400000).toISOString(), salary: '$50/hr', source: 'mock' },
  ];

  let filtered = mockJobs;
  if (query) filtered = filtered.filter(j => (j.title + j.description).toLowerCase().includes(query.toLowerCase()));
  if (location) filtered = filtered.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
  if (jobType) filtered = filtered.filter(j => j.jobType === jobType);
  if (workMode) filtered = filtered.filter(j => j.workMode === workMode);
  if (skills && skills.length > 0) {
    filtered = filtered.filter(j => skills.some(s => (j.title + j.description).toLowerCase().includes(s.toLowerCase())));
  }

  return { jobs: filtered, total: filtered.length, page: 1 };
}
