import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, END } from '@langchain/langgraph';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

// ---- State definition ----
const graphChannels = {
  messages: { value: (a, b) => b || a, default: () => [] },
  intent: { value: (a, b) => b || a, default: () => '' },
  filterUpdates: { value: (a, b) => b || a, default: () => null },
  searchQuery: { value: (a, b) => b || a, default: () => '' },
  response: { value: (a, b) => b || a, default: () => '' },
  currentFilters: { value: (a, b) => b || a, default: () => ({}) },
};

let llm = null;
function getLLM() {
  if (!llm) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key') return null;
    llm = new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0, openAIApiKey: apiKey });
  }
  return llm;
}

// ---- Intent detection node ----
async function detectIntent(state) {
  const model = getLLM();
  const lastMessage = state.messages[state.messages.length - 1];
  const userText = typeof lastMessage === 'string' ? lastMessage : lastMessage.content;

  if (!model) {
    // Fallback rule-based intent detection
    const lower = userText.toLowerCase();
    if (lower.includes('filter') || lower.includes('show only') || lower.includes('remote') ||
        lower.includes('full-time') || lower.includes('part-time') || lower.includes('contract') ||
        lower.includes('clear all') || lower.includes('reset') || lower.includes('last 24') ||
        lower.includes('last week') || lower.includes('last month') || lower.includes('high match') ||
        lower.includes('hybrid') || lower.includes('on-site') || lower.includes('internship')) {
      return { ...state, intent: 'filter_update' };
    }
    if (lower.includes('find') || lower.includes('search') || lower.includes('show me') ||
        lower.includes('jobs') || lower.includes('roles') || lower.includes('developer') ||
        lower.includes('engineer')) {
      return { ...state, intent: 'job_search' };
    }
    if (lower.includes('how') || lower.includes('where') || lower.includes('help') ||
        lower.includes('what') || lower.includes('resume') || lower.includes('application') ||
        lower.includes('upload') || lower.includes('matching')) {
      return { ...state, intent: 'product_help' };
    }
    return { ...state, intent: 'job_search' };
  }

  const intentPrompt = `Classify the user intent into exactly one of: "job_search", "filter_update", "product_help".

  User message: "${userText}"

  Rules:
  - "filter_update" if user wants to change UI filters (remote, full-time, date range, clear filters, match score, location, etc.)
  - "job_search" if user wants to find specific jobs by skills/role
  - "product_help" if user asks about how to use the platform

  Respond with ONLY the intent string, nothing else.`;

  try {
    const res = await model.invoke([new HumanMessage(intentPrompt)]);
    const intent = res.content.trim().toLowerCase().replace(/[^a-z_]/g, '');
    return { ...state, intent: ['job_search', 'filter_update', 'product_help'].includes(intent) ? intent : 'job_search' };
  } catch {
    return { ...state, intent: 'job_search' };
  }
}

// ---- Filter update node ----
async function handleFilterUpdate(state) {
  const lastMessage = state.messages[state.messages.length - 1];
  const userText = typeof lastMessage === 'string' ? lastMessage : lastMessage.content;
  const lower = userText.toLowerCase();

  const model = getLLM();

  if (!model) {
    // Rule-based filter extraction
    const filters = {};

    if (lower.includes('clear all') || lower.includes('reset')) {
      return {
        ...state,
        filterUpdates: { _clear: true },
        response: "Done! I've cleared all filters for you.",
      };
    }

    if (lower.includes('remote')) filters.workMode = 'remote';
    else if (lower.includes('hybrid')) filters.workMode = 'hybrid';
    else if (lower.includes('on-site') || lower.includes('onsite')) filters.workMode = 'on-site';

    if (lower.includes('full-time') || lower.includes('fulltime')) filters.jobType = 'full-time';
    else if (lower.includes('part-time') || lower.includes('parttime')) filters.jobType = 'part-time';
    else if (lower.includes('contract')) filters.jobType = 'contract';
    else if (lower.includes('internship')) filters.jobType = 'internship';

    if (lower.includes('last 24') || lower.includes('24 hours')) filters.datePosted = '24h';
    else if (lower.includes('last week') || lower.includes('this week')) filters.datePosted = 'week';
    else if (lower.includes('last month')) filters.datePosted = 'month';

    if (lower.includes('high match')) filters.matchScore = 'high';
    else if (lower.includes('medium match')) filters.matchScore = 'medium';

    // Extract location
    const locationPatterns = [/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i, /location.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i];
    for (const pattern of locationPatterns) {
      const match = userText.match(pattern);
      if (match && !['Remote', 'Hybrid', 'Full', 'Part', 'Contract'].includes(match[1])) {
        filters.location = match[1];
        break;
      }
    }

    const filterNames = Object.keys(filters).map(k => `${k}: ${filters[k]}`).join(', ');
    return {
      ...state,
      filterUpdates: filters,
      response: Object.keys(filters).length > 0
        ? `I've updated the filters: ${filterNames}`
        : "I couldn't determine which filters to update. Try being more specific.",
    };
  }

  try {
    const filterPrompt = `Extract filter updates from the user message. Return a JSON object with only the filters mentioned.

Available filters:
- workMode: "remote" | "hybrid" | "on-site"
- jobType: "full-time" | "part-time" | "contract" | "internship"
- datePosted: "24h" | "week" | "month"
- matchScore: "high" | "medium" | "all"
- location: string (city or region)
- query: string (search terms)

If user says "clear all" or "reset", return {"_clear": true}

User message: "${userText}"
Current filters: ${JSON.stringify(state.currentFilters)}

Return ONLY valid JSON.`;

    const res = await model.invoke([new HumanMessage(filterPrompt)]);
    let filters;
    try {
      const jsonStr = res.content.replace(/```json?/g, '').replace(/```/g, '').trim();
      filters = JSON.parse(jsonStr);
    } catch { filters = {}; }

    const names = Object.keys(filters).filter(k => k !== '_clear').map(k => `${k}: ${filters[k]}`).join(', ');
    return {
      ...state,
      filterUpdates: filters,
      response: filters._clear
        ? "Done! I've cleared all filters."
        : `I've updated the filters: ${names || 'none detected'}`,
    };
  } catch {
    return { ...state, filterUpdates: {}, response: "Sorry, I had trouble understanding the filters. Could you try again?" };
  }
}

// ---- Job search node ----
async function handleJobSearch(state) {
  const lastMessage = state.messages[state.messages.length - 1];
  const userText = typeof lastMessage === 'string' ? lastMessage : lastMessage.content;
  const lower = userText.toLowerCase();

  const model = getLLM();

  if (!model) {
    // Extract search terms
    const skillKeywords = ['react', 'node', 'python', 'javascript', 'typescript', 'java', 'go', 'rust',
      'ruby', 'ml', 'machine learning', 'pytorch', 'tensorflow', 'aws', 'docker', 'kubernetes',
      'frontend', 'backend', 'fullstack', 'full stack', 'devops', 'data', 'mobile', 'ios', 'android'];

    const foundSkills = skillKeywords.filter(s => lower.includes(s));
    const filters = {};

    if (lower.includes('remote')) filters.workMode = 'remote';
    if (lower.includes('senior')) filters.query = (filters.query || '') + ' senior';
    if (lower.includes('junior')) filters.query = (filters.query || '') + ' junior';
    if (foundSkills.length > 0) {
      filters.query = ((filters.query || '') + ' ' + foundSkills.join(' ')).trim();
      filters.skills = foundSkills;
    }

    if (lower.includes('this week') || lower.includes('posted this week')) filters.datePosted = 'week';

    return {
      ...state,
      searchQuery: filters.query || userText,
      filterUpdates: filters,
      response: `Searching for jobs matching: "${filters.query || userText}". I've updated the filters accordingly.`,
    };
  }

  try {
    const searchPrompt = `The user is searching for jobs. Extract search parameters.

User message: "${userText}"

Return JSON with:
- query: search terms for job title/role
- skills: array of specific skills mentioned
- workMode: "remote" | "hybrid" | "on-site" (if mentioned)
- jobType: "full-time" | "part-time" | "contract" | "internship" (if mentioned)
- datePosted: "24h" | "week" | "month" (if mentioned)
- location: string (if mentioned)

Return ONLY valid JSON.`;

    const res = await model.invoke([new HumanMessage(searchPrompt)]);
    let params;
    try {
      const jsonStr = res.content.replace(/```json?/g, '').replace(/```/g, '').trim();
      params = JSON.parse(jsonStr);
    } catch { params = { query: userText }; }

    return {
      ...state,
      searchQuery: params.query || userText,
      filterUpdates: params,
      response: `Searching for: "${params.query || userText}". I've applied relevant filters.`,
    };
  } catch {
    return { ...state, searchQuery: userText, filterUpdates: { query: userText }, response: `Searching for: "${userText}"` };
  }
}

// ---- Product help node ----
async function handleProductHelp(state) {
  const lastMessage = state.messages[state.messages.length - 1];
  const userText = typeof lastMessage === 'string' ? lastMessage : lastMessage.content;
  const lower = userText.toLowerCase();

  const helpResponses = {
    applications: "You can see your applications by clicking the **Applications** tab in the navigation bar. Each application shows its current status and a timeline of all status changes.",
    resume: "To upload your resume, click on the **Profile** icon in the top-right corner, then select **Upload Resume**. We support PDF and TXT files. You can replace your resume anytime by uploading a new one.",
    matching: "Our AI matching works by analyzing your resume against each job posting. It looks at your skills, experience, and keywords to calculate a match score (0-100%). Green badges (>70%) indicate strong matches, yellow (40-70%) moderate, and gray (<40%) low matches.",
    filter: "You can filter jobs using the sidebar filters or ask me! Try saying things like 'Show only remote jobs' or 'Filter by last 24 hours'. I'll update the filters for you in real-time.",
    apply: "Click the **Apply** button on any job card to open the application link. When you return, I'll ask if you applied, and we'll track it for you automatically.",
  };

  let response = "I'm here to help! Here's what I can do:\n\n";
  response += "• **Search jobs**: 'Find React developer jobs'\n";
  response += "• **Control filters**: 'Show only remote full-time jobs'\n";
  response += "• **Platform help**: 'How do I upload my resume?'\n\n";

  if (lower.includes('application')) response = helpResponses.applications;
  else if (lower.includes('resume') || lower.includes('upload')) response = helpResponses.resume;
  else if (lower.includes('match') || lower.includes('score')) response = helpResponses.matching;
  else if (lower.includes('filter')) response = helpResponses.filter;
  else if (lower.includes('apply')) response = helpResponses.apply;

  return { ...state, response, filterUpdates: null };
}

// ---- Route function ----
function routeByIntent(state) {
  switch (state.intent) {
    case 'filter_update': return 'handleFilterUpdate';
    case 'job_search': return 'handleJobSearch';
    case 'product_help': return 'handleProductHelp';
    default: return 'handleJobSearch';
  }
}

// ---- Build LangGraph ----
let graph = null;

function buildGraph() {
  if (graph) return graph;

  const workflow = new StateGraph({ channels: graphChannels });

  workflow.addNode('detectIntent', detectIntent);
  workflow.addNode('handleFilterUpdate', handleFilterUpdate);
  workflow.addNode('handleJobSearch', handleJobSearch);
  workflow.addNode('handleProductHelp', handleProductHelp);

  workflow.setEntryPoint('detectIntent');
  workflow.addConditionalEdges('detectIntent', routeByIntent);
  workflow.addEdge('handleFilterUpdate', END);
  workflow.addEdge('handleJobSearch', END);
  workflow.addEdge('handleProductHelp', END);

  graph = workflow.compile();
  return graph;
}

export async function processAssistantMessage({ message, conversationHistory, currentFilters }) {
  const app = buildGraph();

  const result = await app.invoke({
    messages: [...conversationHistory.map(m => m.content || m), message],
    currentFilters,
  });

  return {
    reply: result.response,
    filterUpdates: result.filterUpdates,
    searchQuery: result.searchQuery || null,
    intent: result.intent,
  };
}
