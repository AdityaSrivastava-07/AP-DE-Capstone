import { Link } from 'react-router-dom';
import { Sword, Shield, Trophy, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 text-center">
      {/* Top Tag */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-amber-400 text-sm font-medium mb-6">
        <Sparkles className="w-4 h-4" />
        Campus Event & Club Gamification
      </div>

      {/* Main Title */}
      <h1 className="text-5xl font-bold text-amber-400 tracking-wide">
        HEROICS
      </h1>
      <p className="text-xl text-slate-300 mt-3 italic">
        “Where campus legends are made.”
      </p>
      <p className="max-w-xl mx-auto text-slate-400 mt-4 leading-relaxed">
        Turn college clubs into Guilds, campus events into Quests, and level up your student profile by earning XP and Badges.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center gap-4">
        <Link
          to="/quests"
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-md transition"
        >
          Explore Quest Board
        </Link>
        <Link
          to="/dashboard"
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg border border-slate-700 transition"
        >
          Hero Dashboard
        </Link>
      </div>

      {/* 3 Feature Cards */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500 shadow-lg transition">
          <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mb-4">
            <Sword className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white">1. Accept Quests</h3>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Discover workshops, hackathons, and club meetups on campus and register in one click.
          </p>
        </div>

        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500 shadow-lg transition">
          <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white">2. Join Guilds</h3>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Become a member of active college clubs and help your Guild climb the campus leaderboard.
          </p>
        </div>

        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-emerald-500 shadow-lg transition">
          <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">3. Earn XP & Badges</h3>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Check in at events to earn XP points, level up your rank, and unlock rare badges.
          </p>
        </div>
      </div>
    </div>
  );
}
