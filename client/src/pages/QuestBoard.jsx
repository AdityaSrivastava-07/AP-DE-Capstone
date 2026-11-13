import { useState } from 'react';
import { Calendar, MapPin, Zap, CheckCircle } from 'lucide-react';

const MOCK_QUESTS = [
  {
    id: 1,
    title: 'React & Tailwind Workshop',
    guild: 'Coding Guild',
    date: 'Nov 15, 2026',
    location: 'Auditorium B',
    xp: 200,
    tag: 'Beginner',
  },
  {
    id: 2,
    title: 'Campus Cybersecurity Hunt',
    guild: 'CyberSec Club',
    date: 'Nov 18, 2026',
    location: 'Computer Lab 3',
    xp: 350,
    tag: 'Challenge',
  },
  {
    id: 3,
    title: 'Open Source Sprint',
    guild: 'OpenSource Society',
    date: 'Nov 20, 2026',
    location: 'Innovation Hub',
    xp: 150,
    tag: 'Teamwork',
  },
];

export default function QuestBoard() {
  const [acceptedIds, setAcceptedIds] = useState([]);

  const handleAccept = (id) => {
    if (acceptedIds.includes(id)) {
      setAcceptedIds(acceptedIds.filter((item) => item !== id));
    } else {
      setAcceptedIds([...acceptedIds, id]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Active Quest Board</h1>
          <p className="text-slate-400 mt-1">
            Accept campus events and earn XP rewards upon attendance.
          </p>
        </div>
        <span className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-amber-400 font-semibold">
          {acceptedIds.length} Quests Accepted
        </span>
      </div>

      {/* Quest Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_QUESTS.map((quest) => {
          const isAccepted = acceptedIds.includes(quest.id);

          return (
            <div
              key={quest.id}
              className="p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 shadow-lg flex flex-col justify-between transition"
            >
              <div>
                {/* Guild & XP Row */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
                    {quest.guild}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-400">
                    <Zap className="w-4 h-4" /> +{quest.xp} XP
                  </span>
                </div>

                {/* Quest Title */}
                <h3 className="text-lg font-bold text-white leading-snug">
                  {quest.title}
                </h3>

                {/* Event Details */}
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-sm text-slate-400">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" /> {quest.date}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" /> {quest.location}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleAccept(quest.id)}
                className={`mt-6 w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition ${
                  isAccepted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {isAccepted ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Quest Accepted
                  </>
                ) : (
                  'Accept Quest'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
