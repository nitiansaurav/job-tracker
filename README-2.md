# AI-Powered Job Tracking Platform

A full-stack MERN application that fetches jobs from external sources, matches them against a user's resume using AI, tracks applications with smart UX, and includes a conversational AI assistant that controls UI filters in real time.

---

## a) Architecture Diagram

![Architecture](./architecture.mmd)

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)               │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌─────────────┐  │
│  │ Job Feed │ │ Filters  │ │ Chat   │ │ App Tracker │  │
│  │   UI     │ │ Context  │ │ Bubble │ │ Dashboard   │  │
│  └────┬─────┘ └────▲─────┘ └───┬──▲─┘ └──────┬──────┘  │
│       │            │           │  │            │         │
└───────┼────────────┼───────────┼──┼────────────┼─────────┘
        │            │           │  │            │
        ▼            │           ▼  │            ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND (Node.js + Fastify)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ /api/jobs│ │ /api/ai  │ │ /api/apps│ │ /api/auth  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       │            │            │              │         │
│       ▼            ▼            ▼              ▼         │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────────────┐  │
│  │ Adzuna   │ │ AI Layer │ │   In-Memory JSON Store  │  │
│  │ Service  │ │          │ │   (users, apps, resumes)│  │
│  └────┬─────┘ │┌────────┐│ └─────────────────────────┘  │
│       │       ││LangChn ││                               │
│       │       ││Matcher ││                               │
│       │       │└────────┘│                               │
│       │       │┌────────┐│                               │
│       │       ││LangGrph││                               │
│       │       ││Agent   ││                               │
│       │       │└───┬────┘│                               │
│       │       └────┼─────┘                               │
└───────┼────────────┼─────────────────────────────────────┘
        ▼            ▼
┌──────────┐  ┌──────────┐
│ Adzuna   │  │ OpenAI / │
│ Job API  │  │ Gemini   │
└──────────┘  └──────────┘
```

### Data Flow

1. **Job Fetching**: Frontend requests jobs → Backend fetches from Adzuna API (or returns mock data) → Jobs returned to frontend
2. **AI Matching**: Jobs + resume text sent to LangChain matcher → LLM scores each job → Scores returned with explanations
3. **AI Chat**: User message → LangGraph agent processes intent → Returns either job results, filter commands, or help text → Frontend applies filter commands to FilterContext
4. **Application Tracking**: User clicks Apply → External link opens → Return popup captures status → Status stored and tracked

---

## b) Setup Instructions

### Prerequisites

- Node.js >= 18
- npm or yarn
- OpenAI API key (optional — fallback keyword matching works without it)
- Adzuna API credentials (optional — mock data used without them)

### Local Setup

```bash
# Clone the repository
git clone <repo-url>
cd job-tracker

# Install backend dependencies
cd server
npm install
cp .env.example .env
# Edit .env with your API keys

# Start backend
npm run dev
# Server runs on http://localhost:3001

# In a new terminal, install frontend dependencies
cd client
npm install

# Start frontend
npm run dev
# App runs on http://localhost:5173
```

### Environment Variables

Create `server/.env`:

```env
# Required for AI features (falls back to keyword matching without)
OPENAI_API_KEY=sk-...

# Optional - for live job data (uses mock data without)
ADZUNA_APP_ID=your_app_id
ADZUNA_API_KEY=your_api_key

# Server config
PORT=3001
HOST=0.0.0.0
```

### Test Credentials

- **Email**: test@gmail.com
- **Password**: test@123

---

## c) LangChain & LangGraph Usage

### LangChain — Job Matching

LangChain is used to orchestrate the job-resume matching pipeline:

```
Resume Text → LangChain PromptTemplate → LLM → Structured Output Parser → Match Score
```

**How it works:**

1. **PromptTemplate**: A structured prompt sends the resume text and job description to the LLM, asking it to evaluate fit across three dimensions: skills overlap, experience relevance, and keyword alignment.

2. **StructuredOutputParser**: Forces the LLM to return a JSON object with:
   - `score` (0–100)
   - `matchingSkills` (array of matched skills)
   - `relevantExperience` (string explanation)
   - `keywordAlignment` (string explanation)

3. **Batch Processing**: Jobs are scored in parallel batches of 5 to balance speed and rate limits.

4. **Fallback**: If no API key is configured, a keyword-based TF-IDF-style matcher runs locally — extracting skills from both resume and job description, computing Jaccard similarity, and scaling to 0–100.

**Prompt Design:**

```
You are a job matching expert. Given a candidate's resume and a job posting,
score the match from 0-100 based on:
1. Skills overlap (40% weight)
2. Experience relevance (35% weight)  
3. Keyword alignment (25% weight)

Resume: {resumeText}
Job Title: {title}
Job Description: {description}
Required Skills: {skills}

Respond in JSON: { score, matchingSkills, relevantExperience, keywordAlignment }
```

### LangGraph — AI Assistant

LangGraph manages the conversational AI assistant as a state machine:

```
User Message → Intent Classifier → Router → [Search | Filter | Help] → Response
```

**Graph Structure:**

```
┌─────────────┐
│  START       │
│  (input)     │
└──────┬──────┘
       ▼
┌─────────────┐
│  classify    │
│  intent      │
└──────┬──────┘
       ▼
┌─────────────┐     ┌──────────────┐
│  ROUTER     │────▶│ search_jobs  │──▶ Return job results
│  (conditional)│   └──────────────┘
│             │     ┌──────────────┐
│             │────▶│ update_filter│──▶ Return filter commands
│             │     └──────────────┘
│             │     ┌──────────────┐
│             │────▶│ help         │──▶ Return help text
└─────────────┘     └──────────────┘
```

**Nodes:**

| Node | Purpose |
|------|---------|
| `classifyIntent` | Uses LLM to detect intent: `search`, `filter`, `help` |
| `searchJobs` | Extracts search params, queries job store, returns ranked results |
| `updateFilters` | Parses filter commands, returns structured filter object for frontend |
| `helpResponse` | Returns contextual help about app features |

**Tool/Function Calling for UI Filter Updates:**

The `updateFilters` node uses LLM function calling with a defined schema:

```javascript
const filterTool = {
  name: "apply_filters",
  parameters: {
    type: "object",
    properties: {
      workMode: { enum: ["remote", "hybrid", "onsite"] },
      jobType: { enum: ["fulltime", "parttime", "contract", "internship"] },
      datePosted: { enum: ["24h", "week", "month", "any"] },
      location: { type: "string" },
      matchScore: { enum: ["high", "medium", "all"] },
      skills: { type: "array", items: { type: "string" } },
      searchQuery: { type: "string" },
      clearAll: { type: "boolean" }
    }
  }
};
```

When the LLM returns a tool call, the backend extracts the filter object and sends it to the frontend, which applies it directly to `FilterContext`.

**State Management:**

LangGraph maintains conversation state per session:

```javascript
const graphState = {
  messages: [],        // Conversation history
  intent: "",          // Classified intent
  filters: {},         // Current active filters
  searchResults: [],   // Last search results
  userId: ""           // For resume-aware responses
};
```

---

## d) AI Matching Logic

### Scoring Approach

The matching system uses a **weighted multi-factor scoring model**:

| Factor | Weight | Method |
|--------|--------|--------|
| Skills Overlap | 40% | Extract skills from resume and job, compute intersection ratio |
| Experience Relevance | 35% | LLM evaluates years of experience, seniority level, domain match |
| Keyword Alignment | 25% | TF-IDF-style keyword frequency comparison |

### Why It Works

1. **Skills are the strongest signal**: A React developer with 5 years of experience is a strong match for a React role regardless of other factors.
2. **Experience provides context**: A junior developer shouldn't score 90% on a "10+ years required" role even if skills match.
3. **Keywords catch domain specifics**: "fintech", "healthcare", "e-commerce" — these contextual terms matter for culture and domain fit.

### Fallback (No API Key)

Without an LLM API key, the system uses a deterministic keyword matcher:

```
1. Extract known skills from resume (from a predefined skill taxonomy)
2. Extract required skills from job description
3. Compute: score = (matched_skills / total_required_skills) * 70 + keyword_bonus * 30
```

This ensures the app is fully functional without external API dependencies.

### Performance Considerations

- **Batch scoring**: Jobs are scored in batches of 5 with Promise.allSettled
- **Caching**: Scores are cached per resume hash + job ID; re-scoring only happens when resume changes
- **Lazy scoring**: Only visible/filtered jobs are scored on-demand
- **Debouncing**: Resume upload triggers scoring after a 500ms debounce

---

## e) Popup Flow Design (Critical Thinking)

### The Design

When a user clicks "Apply" on a job card:

1. The external application link opens in a **new tab**
2. When the user returns (via `visibilitychange` event), a popup appears:
   > "Did you apply to [Job Title] at [Company]?"
   > - ✅ Yes, Applied
   > - 👀 No, just browsing  
   > - 📝 Applied Earlier

### Why This Design

**Problem**: We can't know if the user actually completed the external application. Opening a link ≠ applying.

**Solution**: A **non-blocking confirmation popup** that:
- Appears only when the user returns (not immediately)
- Uses a 2-second delay after tab focus to avoid being jarring
- Provides three options covering all realistic scenarios
- Doesn't block the UI — users can dismiss and continue browsing

### Edge Cases Handled

| Edge Case | Handling |
|-----------|----------|
| User switches tabs without applying | "No, just browsing" option |
| User applied days ago via another channel | "Applied Earlier" option with backdated timestamp |
| User clicks Apply multiple times | Deduplication — only one popup per job per session |
| User closes popup without answering | Job saved as "Viewed" (not "Applied") |
| Browser doesn't support visibilitychange | Fallback to `focus` event listener |
| Multiple Apply clicks in quick succession | Queue system — show popups one at a time |

### Alternative Approaches Considered

| Approach | Why Rejected |
|----------|-------------|
| Auto-mark as Applied on click | Inaccurate — many users browse without applying |
| Manual tracking only | Too much friction — users forget to log applications |
| Browser extension to detect form submission | Over-engineered, privacy concerns, cross-browser issues |
| Timed popup (show after 30s) | Arbitrary timing doesn't correlate with actual behavior |

---

## f) AI Assistant UI Choice

### Choice: Floating Chat Bubble (Bottom-Right)

### Why Bubble Over Sidebar

| Factor | Bubble | Sidebar |
|--------|--------|---------|
| Screen real estate | Minimal footprint when collapsed | Takes 300px+ even when "collapsed" |
| Discoverability | Universally recognized pattern (Intercom, Drift) | Less familiar to casual users |
| Mobile UX | Works as bottom sheet on mobile | Awkward on small screens |
| Context preservation | User sees full job feed while chatting | Feed gets compressed |
| Quick interactions | Open → type → get answer → close | Feels heavy for simple queries |

### UX Reasoning

1. **Non-intrusive**: The bubble sits in the corner and doesn't compete with the primary task (browsing jobs)
2. **Progressive disclosure**: Collapsed = small icon; expanded = full chat interface; users choose their engagement level
3. **Filter feedback**: When AI applies filters, the user sees the job feed update in real-time behind the chat — this visual feedback loop is critical for trust
4. **Conversation persistence**: Chat history persists across open/close cycles within a session

---

## g) Scalability

### Handling 100+ Jobs

| Challenge | Solution |
|-----------|----------|
| Rendering performance | Virtual scrolling with `react-window` — only render visible jobs |
| AI scoring latency | Batch scoring (5 at a time) + progressive loading (show jobs immediately, scores appear as computed) |
| Filter performance | Client-side filtering with memoized selectors — O(n) scan is fast for hundreds of jobs |
| API rate limits | Request queue with exponential backoff; cached responses with 15-minute TTL |

### Handling 10,000 Users

| Challenge | Solution |
|-----------|----------|
| Concurrent AI requests | Queue system with max 10 concurrent LLM calls; fallback to keyword matching under load |
| Data storage | Migrate from in-memory JSON to MongoDB with indexed queries |
| Session management | JWT tokens with Redis session store |
| Job data | Shared job cache — all users see the same jobs, only scoring is per-user |
| Resume processing | Background job queue (Bull/BullMQ) for resume parsing and batch scoring |

### Production Architecture (Future)

```
                    ┌─────────────┐
                    │   CDN       │
                    │  (Vercel)   │
                    └──────┬──────┘
                           ▼
┌──────────┐      ┌─────────────┐      ┌──────────────┐
│ React    │─────▶│ Load        │─────▶│ Fastify      │
│ Frontend │      │ Balancer    │      │ Cluster (x4) │
└──────────┘      └─────────────┘      └──────┬───────┘
                                              │
                    ┌─────────────────────────┼──────────┐
                    ▼              ▼                      ▼
              ┌──────────┐  ┌──────────┐          ┌──────────┐
              │ MongoDB  │  │ Redis    │          │ Bull     │
              │ (data)   │  │ (cache)  │          │ (queues) │
              └──────────┘  └──────────┘          └──────────┘
```

---

## h) Tradeoffs & Limitations

### Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| In-memory storage | Data lost on server restart | Acceptable for demo; MongoDB migration is straightforward |
| Single LLM provider | Vendor lock-in risk | Abstracted behind LangChain — swap providers in one line |
| No real authentication | Insecure for production | JWT + bcrypt implementation is scaffolded, needs hardening |
| Synchronous scoring | Slow for large job sets | Background queue needed for production |
| No resume parsing | Only raw text extraction | Add pdf-parse or Apache Tika for structured extraction |

### What I'd Improve With More Time

1. **MongoDB + Mongoose**: Replace in-memory store with proper persistence, indexes, and aggregation pipelines
2. **WebSocket for real-time updates**: Push new jobs and score updates instead of polling
3. **Resume parser**: Use `pdf-parse` + NER (Named Entity Recognition) to extract structured data (skills, experience, education) from resumes
4. **Multi-LLM fallback**: Try OpenAI → Gemini → local model (Ollama) for resilience
5. **Analytics dashboard**: Track application conversion rates, most-matched skills, market trends
6. **Testing**: Add Jest unit tests for scoring logic, Playwright E2E tests for the apply flow
7. **Rate limiting**: Per-user rate limits on AI endpoints to prevent abuse
8. **Accessibility**: Full ARIA labels, keyboard navigation, screen reader support
9. **PWA support**: Offline access to saved jobs and applications
10. **Email notifications**: Alert users when new high-match jobs appear

---

## License

MIT
