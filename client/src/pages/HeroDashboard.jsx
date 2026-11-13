import { Award, Shield, Star, Flame } from 'lucide-react';

export default function HeroDashboard() {
  const hero = {
    name: 'Naitik',
    role: 'Campus Vanguard',
    level: 5,
    currentXp: 700,
    nextLevelXp: 1000,
    guild: 'Tech & Innovation Guild',
    questsCompleted: 8,
    badges: [
      { id: 1, name: 'First Quest', desc: 'Attended first campus event' },
      { id: 2, name: 'Hackathon Pro', desc: 'Completed a 24-hour hackathon' },
      { id: 3, name: 'Guild Member', desc: 'Joined an active student club' },
    ],
  };

  const progressPercent = (hero.currentXp / hero.nextLevelXp) * 100;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Top Hero Profile Card */}
      <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Left: Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 font-bold text-2xl flex items-center justify-center">
              {hero.name[0]}
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-400 text-xs font-bold">
                Level {hero.level} • {hero.role}
              </span>
              <h1 className="text-3xl font-bold mt-2">{hero.name}</h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-blue-400">
                <Shield className="w-4 h-4" /> {hero.guild}
              </p>
            </div>
          </div>

          {/* Right: Quick Stats */}
          <div className="flex gap-4">
            <div className="px-5 py-3 bg-slate-800 rounded-lg text-center border border-slate-700">
              <p className="text-2xl font-bold text-amber-400">{hero.currentXp}</p>
              <p className="text-xs text-slate-400">Total XP</p>
            </div>
            <div className="px-5 py-3 bg-slate-800 rounded-lg text-center border border-slate-700">
              <p className="text-2xl font-bold text-emerald-400">{hero.questsCompleted}</p>
              <p className="text-xs text-slate-400">Quests Done</p>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300 flex items-center gap-1 font-medium">
              <Flame className="w-4 h-4 text-amber-400" /> Level {hero.level + 1} Progress
            </span>
            <span className="font-bold text-amber-400">
              {hero.currentXp} / {hero.nextLevelXp} XP
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

      {/* Earned Badges Section */}
      <h2 className="text-xl font-bold mt-10 mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-amber-400" />
        Earned Badges ({hero.badges.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hero.badges.map((badge) => (
          <div
            key={badge.id}
            className="p-5 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500 flex items-center gap-4 shadow-md transition"
          >
            <div className="p-3 rounded-lg bg-slate-800 text-amber-400">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white">{badge.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
