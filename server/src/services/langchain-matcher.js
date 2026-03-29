import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

const matchSchema = z.object({
  score: z.number().min(0).max(100),
  matchingSkills: z.array(z.string()),
  relevantExperience: z.string(),
  keywordsAlignment: z.string(),
  summary: z.string(),
});

const parser = StructuredOutputParser.fromZodSchema(matchSchema);

const MATCH_PROMPT = PromptTemplate.fromTemplate(`
You are a job matching AI. Compare the resume against the job posting and provide a match score.

Resume:
{resume}

Job Title: {jobTitle}
Company: {company}
Job Description: {jobDescription}

{format_instructions}

Be honest and precise with the score. Consider:
- Matching technical skills
- Relevant work experience
- Keywords alignment
- Seniority level match
`);

let llm = null;

function getLLM() {
  if (!llm) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key') {
      return null;
    }
    llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey: apiKey,
    });
  }
  return llm;
}

// Fallback keyword-based matching when no API key
function keywordMatch(resume, job) {
  const resumeLower = resume.toLowerCase();
  const jobText = (job.title + ' ' + job.description).toLowerCase();

  const techSkills = [
    'react', 'node.js', 'nodejs', 'python', 'javascript', 'typescript',
    'java', 'c++', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
    'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql',
    'redis', 'graphql', 'rest', 'api', 'git', 'ci/cd', 'agile',
    'machine learning', 'tensorflow', 'pytorch', 'nlp', 'css',
    'html', 'tailwind', 'redux', 'vue', 'angular', 'django', 'flask',
    'express', 'fastify', 'next.js', 'figma', 'sketch',
  ];

  const resumeSkills = techSkills.filter(s => resumeLower.includes(s));
  const jobSkills = techSkills.filter(s => jobText.includes(s));
  const matchingSkills = resumeSkills.filter(s => jobSkills.includes(s));

  let score = 0;
  if (jobSkills.length > 0) {
    score = Math.round((matchingSkills.length / jobSkills.length) * 70);
  }

  // Bonus for title keywords in resume
  const titleWords = job.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const titleMatch = titleWords.filter(w => resumeLower.includes(w)).length;
  score += Math.round((titleMatch / Math.max(titleWords.length, 1)) * 30);
  score = Math.min(100, score);

  return {
    score,
    matchingSkills,
    relevantExperience: matchingSkills.length > 0
      ? `Resume shows experience with ${matchingSkills.slice(0, 3).join(', ')}`
      : 'Limited direct skill overlap found',
    keywordsAlignment: `${matchingSkills.length}/${jobSkills.length} required skills found in resume`,
    summary: score > 70 ? 'Strong match' : score > 40 ? 'Moderate match' : 'Low match',
  };
}

export async function matchJobsWithResume(jobs, resumeText) {
  const model = getLLM();

  // Process in batches to avoid rate limits
  const results = [];

  for (const job of jobs) {
    if (model) {
      try {
        const formatted = await MATCH_PROMPT.format({
          resume: resumeText.substring(0, 3000),
          jobTitle: job.title,
          company: job.company,
          jobDescription: (job.description || '').substring(0, 1500),
          format_instructions: parser.getFormatInstructions(),
        });

        const response = await model.invoke(formatted);
        const parsed = await parser.parse(response.content);
        results.push({ ...job, match: parsed });
      } catch (error) {
        console.error('LLM match error for', job.title, error.message);
        results.push({ ...job, match: keywordMatch(resumeText, job) });
      }
    } else {
      results.push({ ...job, match: keywordMatch(resumeText, job) });
    }
  }

  return results;
}
