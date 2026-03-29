import { useState, useEffect } from "react";
import api from "../lib/api";
import { formatDistanceToNow } from "date-fns";
import { Briefcase, Clock, ChevronRight } from "lucide-react";

const STATUS_COLORS = {
  applied: "bg-blue-100 text-blue-800",
  interview: "bg-purple-100 text-purple-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUSES = ["applied", "interview", "offer", "rejected"];

export default function ApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api
      .get("/applications")
      .then(({ data }) => setApps(data))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    const { data } = await api.put(`/applications/${id}/status`, {
      status,
    });
    setApps((prev) =>
      prev.map((a) => (a.id === id ? data.application : a))
    );
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );

  if (apps.length === 0)
    return (
      <div className="text-center py-16 bg-white rounded-xl">
        <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          No Applications Yet
        </h2>
        <p className="text-gray-500">
          Start applying to jobs and track your progress here
        </p>
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        My Applications ({apps.length})
      </h1>

      <div className="space-y-3">
        {apps.map((app) => {
          const isLocked =
            app.status === "offer" || app.status === "rejected";

          return (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                onClick={() =>
                  setExpandedId(
                    expandedId === app.id ? null : app.id
                  )
                }
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {app.jobTitle}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {app.company}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      STATUS_COLORS[app.status] || "bg-gray-100"
                    }`}
                  >
                    {app.status}
                  </span>

                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(
                      new Date(app.appliedAt),
                      { addSuffix: true }
                    )}
                  </span>

                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedId === app.id ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>

              {expandedId === app.id && (
                <div className="border-t border-gray-100 p-4">
                  
                  {/* 🎉 SUCCESS / REJECT MESSAGE */}
                  {app.status === "offer" && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                      🎉 Congratulations! You received an offer.
                    </div>
                  )}

                  {app.status === "rejected" && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                      😔 Better luck next time. Keep applying!
                    </div>
                  )}

                  {/* 🔒 STATUS BUTTONS */}
                  <div className="flex gap-2 mb-4">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          !isLocked &&
                          updateStatus(app.id, s)
                        }
                        disabled={isLocked}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                          app.status === s
                            ? STATUS_COLORS[s]
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        } ${
                          isLocked
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Timeline
                  </h4>

                  <div className="space-y-2">
                    {app.timeline.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="capitalize font-medium">
                          {t.status}
                        </span>
                        <span className="text-gray-400">
                          {new Date(
                            t.date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}