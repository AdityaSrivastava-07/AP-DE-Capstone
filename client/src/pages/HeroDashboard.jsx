import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Shield, Star, Flame } from 'lucide-react';

const API_URL = 'http://localhost:5001';

export default function HeroDashboard({ token, user }) {
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.hero) {
          setProfile(data.hero);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [token]);

  if (!token) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-2xl font-bold">Sign in to view your Hero Profile</h2>
          <p className="text-slate-400 text-sm">
            Track your live XP, level progress, and earned quest badges.
          </p>
          <Link
            to="/login"
            className="inline-block px-5 py-2.5 rounded-lg bg-amber-400 text-slate-950 font-semibold text-sm hover:bg-amber-300"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !profile) {
    return <div className="max-w-5xl mx-auto px-6 py-10 text-slate-400">Loading hero profile...</div>;
  }

  const nextLevelXp = profile.level * 500;
  const progressPercent = Math.min(100, (profile.xp / nextLevelXp) * 100);
  const badges = profile.badges || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 font-bold text-2xl flex items-center justify-center">
              {profile.name?.[0] || 'H'}
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-400 text-xs font-bold">
                Level {profile.level} • {profile.role}
              </span>
              <h1 className="text-3xl font-bold mt-2">{profile.name}</h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-blue-400">
                <Shield className="w-4 h-4" />{' '}
                {profile.ledGuild?.name ? `Leads ${profile.ledGuild.name}` : 'Campus Hero'}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="px-5 py-3 bg-slate-800 rounded-lg text-center border border-slate-700">
              <p className="text-2xl font-bold text-amber-400">{profile.xp}</p>
              <p className="text-xs text-slate-400">Total XP</p>
            </div>
            <div className="px-5 py-3 bg-slate-800 rounded-lg text-center border border-slate-700">
              <p className="text-2xl font-bold text-emerald-400">{badges.length}</p>
              <p className="text-xs text-slate-400">Quests Done</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300 flex items-center gap-1 font-medium">
              <Flame className="w-4 h-4 text-amber-400" /> Level {profile.level + 1} Progress
            </span>
            <span className="font-bold text-amber-400">
              {profile.xp} / {nextLevelXp} XP
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-3 bg-amber-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mt-10 mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-amber-400" />
        Earned Badges ({badges.length})
      </h2>

      {badges.length === 0 ? (
        <p className="text-slate-400 text-sm">
          No badges earned yet. Check in at a quest venue to earn your first badge!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="p-5 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500 flex items-center gap-4 shadow-md transition"
            >
              <div className="p-3 rounded-lg bg-slate-800 text-amber-400">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">{badge.quest?.title || 'Quest Badge'}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  +{badge.quest?.xpReward ?? 50} XP earned
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}