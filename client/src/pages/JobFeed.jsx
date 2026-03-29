import { useState, useEffect, useCallback } from "react";
import { useFilters } from "../context/FilterContext";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import JobCard from "../components/JobCard";
import FilterSidebar from "../components/FilterSidebar";
import ApplyPopup from "../components/ApplyPopup";
import { Sparkles, Search, Loader2 } from "lucide-react";

export default function JobFeed() {
  const { filters } = useFilters();
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [pendingApply, setPendingApply] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);

    try {
      const params = {};

      if (filters.query) params.query = filters.query;
      if (filters.location) params.location = filters.location;
      if (filters.jobType) params.jobType = filters.jobType;
      if (filters.workMode) params.workMode = filters.workMode;
      if (filters.datePosted) params.datePosted = filters.datePosted;
      if (filters.skills.length)
        params.skills = filters.skills.join(",");

      const { data } = await api.get("/jobs", { params });
      const fetchedJobs = data.jobs || [];

      // AI match scoring
      if (user?.resumeText && fetchedJobs.length > 0) {
        setMatching(true);
        try {
          const { data: matchData } = await api.post(
            "/match/score",
            { jobs: fetchedJobs }
          );
          setJobs(matchData.scoredJobs);
        } catch {
          setJobs(fetchedJobs);
        } finally {
          setMatching(false);
        }
      } else {
        setJobs(fetchedJobs);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, user?.resumeText]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleApply = (job) => {
    window.open(job.applyUrl, "_blank");
    setPendingApply(job);
  };

  // Filter by match score
  let displayJobs = jobs;

  if (filters.matchScore === "high") {
    displayJobs = jobs.filter((j) => (j.match?.score || 0) > 70);
  } else if (filters.matchScore === "medium") {
    displayJobs = jobs.filter((j) => {
      const s = j.match?.score || 0;
      return s >= 40 && s <= 70;
    });
  }

  const bestMatches = [...displayJobs]
    .filter((j) => j.match)
    .sort(
      (a, b) => (b.match?.score || 0) - (a.match?.score || 0)
    )
    .slice(0, 8);

  return (
    <div className="flex gap-6">
      <FilterSidebar />

      <div className="flex-1 min-w-0">
        {matching && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-sm text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI is matching jobs with your resume...
          </div>
        )}

        {bestMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Best Matches
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bestMatches.map((job) => (
                <JobCard
                  key={"best-" + job.id}
                  job={job}
                  compact
                  onApply={() => handleApply(job)}
                />
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {loading
            ? "Loading jobs..."
            : `${displayJobs.length} Jobs Found`}
        </h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl h-48 animate-pulse"
              />
            ))}
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              No jobs match your filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={() => handleApply(job)}
              />
            ))}
          </div>
        )}
      </div>

      {pendingApply && (
        <ApplyPopup
          job={pendingApply}
          onClose={() => setPendingApply(null)}
        />
      )}
    </div>
  );
}