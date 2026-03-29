import { useFilters } from '../context/FilterContext';
import { Filter, X } from 'lucide-react';

const SKILLS = ['React', 'Node.js', 'Python', 'TypeScript', 'JavaScript', 'Java', 'Go', 'Rust', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL', 'Machine Learning', 'PyTorch', 'TensorFlow'];

export default function FilterSidebar() {
  const { filters, updateFilter, clearFilters } = useFilters();
  const hasFilters = filters.query || filters.skills.length || filters.datePosted || filters.jobType || filters.workMode || filters.location || filters.matchScore;

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</h3>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Role / Title</label>
          <input value={filters.query} onChange={e => updateFilter('query', e.target.value)} placeholder="e.g. React Developer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Location</label>
          <input value={filters.location} onChange={e => updateFilter('location', e.target.value)} placeholder="City or region"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>

        {/* Job Type */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Job Type</label>
          <select value={filters.jobType} onChange={e => updateFilter('jobType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        {/* Work Mode */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Work Mode</label>
          <select value={filters.workMode} onChange={e => updateFilter('workMode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Modes</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="on-site">On-site</option>
          </select>
        </div>

        {/* Date Posted */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Date Posted</label>
          <select value={filters.datePosted} onChange={e => updateFilter('datePosted', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Any Time</option>
            <option value="24h">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>

        {/* Match Score */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Match Score</label>
          <select value={filters.matchScore} onChange={e => updateFilter('matchScore', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All</option>
            <option value="high">High (&gt;70%)</option>
            <option value="medium">Medium (40–70%)</option>
          </select>
        </div>

        {/* Skills */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">Skills</label>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {SKILLS.map(skill => {
              const active = filters.skills.includes(skill);
              return (
                <button key={skill} onClick={() => {
                  updateFilter('skills', active ? filters.skills.filter(s => s !== skill) : [...filters.skills, skill]);
                }}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                    active ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
