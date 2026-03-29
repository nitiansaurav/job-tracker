import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { X, Upload, FileText, Check } from "lucide-react";

export default function ResumeUpload({ onClose }) {
  const { user, refreshUser } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const fileRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".txt")) {
      setError("Only PDF and TXT files are supported");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshUser();
      setSuccess(true);

      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Upload Your Resume</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user?.resumeFileName && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-sm text-blue-700">
            <FileText className="w-4 h-4" />
            Current: {user.resumeFileName}
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-600 font-medium">
              Resume uploaded!
            </p>
          </div>
        ) : (
          <>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {uploading
                  ? "Uploading..."
                  : "Click to upload PDF or TXT"}
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] &&
                handleUpload(e.target.files[0])
              }
            />

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}