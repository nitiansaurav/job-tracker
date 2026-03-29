import { formatDistanceToNow } from "date-fns";
import {
  MapPin,
  Building,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

function MatchBadge({ score }) {
  const color =
    score > 70
      ? "bg-green-100 text-green-800 border-green-200"
      : score >= 40
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}
    >
      {score}% Match
    </span>
  );
}

export default function JobCard({ job, compact, onApply }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className={`font-semibold text-gray-900 ${
                compact ? "text-sm" : "text-base"
              }`}
            >
              {job.title}
            </h3>

            {job.match && <MatchBadge score={job.match.score} />}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5" />
              {job.company}
            </span>

            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {job.location}
            </span>

            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(job.postedDate), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        <button
          onClick={onApply}
          className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
        >
          Apply <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md capitalize">
          {job.jobType}
        </span>

        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md capitalize">
          {job.workMode}
        </span>

        {job.salary && (
          <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-md">
            {job.salary}
          </span>
        )}
      </div>

      {!compact && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {job.description}
        </p>
      )}

      {job.match && job.match.matchingSkills.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            {showDetails ? "Hide" : "Show"} match details
          </button>

          {showDetails && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-1.5">
              <p>
                <span className="font-medium">Skills:</span>{" "}
                {job.match.matchingSkills.join(", ")}
              </p>
              <p>
                <span className="font-medium">Experience:</span>{" "}
                {job.match.relevantExperience}
              </p>
              <p>
                <span className="font-medium">Keywords:</span>{" "}
                {job.match.keywordsAlignment}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}