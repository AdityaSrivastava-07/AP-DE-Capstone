import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Sword } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import HeroDashboard from './pages/HeroDashboard';
import QuestBoard from './pages/QuestBoard';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Top Navbar */}
        <nav className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-amber-400">
              <Sword className="w-6 h-6" /> HEROICS
            </Link>

            <div className="flex gap-6 text-sm font-medium text-slate-300">
              <Link to="/" className="hover:text-amber-400 transition">Home</Link>
              <Link to="/quests" className="hover:text-amber-400 transition">Quest Board</Link>
              <Link to="/dashboard" className="hover:text-amber-400 transition">Hero Profile</Link>
            </div>
          </div>
        </nav>

        {/* Page Routes */}
        <Routes>
          <Route path="/" element={<LandingPage />} /> 
          <Route path="/quests" element={<QuestBoard />} />
          <Route path="/dashboard" element={<HeroDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
