import { useState } from "react";
import api from "../lib/api";
import { X, Check, Eye, History } from "lucide-react";

export default function ApplyPopup({ job, onClose }) {
  const [saving, setSaving] = useState(false);

  const handleResponse = async (response) => {
    if (response === "browsing") {
      onClose();
      return;
    }

    setSaving(true);

    try {
      await api.post("/applications", {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        applyUrl: job.applyUrl,
      });
    } catch (err) {
      console.error(err);
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-gray-900">
            Did you apply?
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Did you apply to{" "}
          <span className="font-medium">{job.title}</span> at{" "}
          <span className="font-medium">{job.company}</span>?
        </p>

        <div className="space-y-2">
          <button
            onClick={() => handleResponse("applied")}
            disabled={saving}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 transition text-sm font-medium"
          >
            <Check className="w-5 h-5" /> Yes, I Applied
          </button>

          <button
            onClick={() => handleResponse("browsing")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition text-sm font-medium"
          >
            <Eye className="w-5 h-5" /> No, Just Browsing
          </button>

          <button
            onClick={() => handleResponse("earlier")}
            disabled={saving}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition text-sm font-medium"
          >
            <History className="w-5 h-5" /> Applied Earlier
          </button>
        </div>
      </div>
    </div>
  );
}