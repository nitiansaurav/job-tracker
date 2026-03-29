// In-memory data store (replace with MongoDB for production)
const store = {
  users: [
    {
      id: '1',
      email: 'test@gmail.com',
      password: 'test@123',
      name: 'Test User',
      resumeText: '',
      resumeFileName: '',
    }
  ],
  applications: [],
  // { id, userId, jobId, jobTitle, company, status, appliedAt, timeline: [{status, date}] }
};

export default store;
