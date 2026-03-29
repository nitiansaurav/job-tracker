import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResumeUpload from './ResumeUpload';
import AIAssistant from './AIAssistant';
import { Briefcase, FileText, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const [showResume, setShowResume] = useState(!user?.resumeText);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> JobTracker AI
              </h1>
              <div className="flex gap-1">
                <NavLink to="/" end className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`
                }>Jobs</NavLink>
                <NavLink to="/applications" className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`
                }>Applications</NavLink>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowResume(true)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <FileText className="w-4 h-4" />
                {user?.resumeFileName ? 'Update Resume' : 'Upload Resume'}
              </button>
              <span className="text-sm text-gray-500 flex items-center gap-1"><User className="w-4 h-4" />{user?.email}</span>
              <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 transition-colors"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {showResume && <ResumeUpload onClose={() => setShowResume(false)} />}
      <AIAssistant />
    </div>
  );
}
