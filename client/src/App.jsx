import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Sword } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import HeroDashboard from './pages/HeroDashboard';
import QuestBoard from './pages/QuestBoard';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';

function getStoredAuth() {
  const token = localStorage.getItem('heroics_token');
  const rawUser = localStorage.getItem('heroics_user');
  try {
    return { token, user: rawUser ? JSON.parse(rawUser) : null };
  } catch {
    return { token: null, user: null };
  }
}

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth);
  const isStaff = auth.user?.role === 'GUILD_MASTER' || auth.user?.role === 'ADMIN';

  function handleLogout() {
    localStorage.removeItem('heroics_token');
    localStorage.removeItem('heroics_user');
    setAuth({ token: null, user: null });
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        <nav className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-amber-400">
              <Sword className="w-6 h-6" /> HEROICS
            </Link>

            <div className="flex items-center gap-6 text-sm font-medium text-slate-300">
              <Link to="/" className="hover:text-amber-400 transition">Home</Link>
              <Link to="/quests" className="hover:text-amber-400 transition">Quest Board</Link>
              <Link to="/dashboard" className="hover:text-amber-400 transition">Hero Profile</Link>
              {isStaff && (
                <Link to="/admin" className="text-amber-400 hover:text-amber-300 transition">
                  Admin Console
                </Link>
              )}
              {auth.token ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs"
                >
                  Logout ({auth.user?.name?.split(' ')[0] || 'Hero'})
                </button>
              ) : (
                <Link
                  to="/login"
                  className="px-3 py-1 rounded bg-amber-400 text-slate-950 font-semibold text-xs hover:bg-amber-300"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/quests" element={<QuestBoard token={auth.token} user={auth.user} />} />
          <Route path="/dashboard" element={<HeroDashboard token={auth.token} user={auth.user} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={setAuth} />} />
          <Route
            path="/admin"
            element={
              isStaff ? (
                <AdminDashboard token={auth.token} user={auth.user} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}