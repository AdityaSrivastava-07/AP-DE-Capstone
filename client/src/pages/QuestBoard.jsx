import { useEffect, useState } from 'react';
import { Calendar, MapPin, Zap, CheckCircle } from 'lucide-react';

const API_URL = 'http://localhost:5001';

export default function QuestBoard() {
  const [quests, setQuests] = useState([]);
  const [acceptedIds, setAcceptedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchQuests() {
      try {
        const res = await fetch(`${API_URL}/manage/quests`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch quests.');
        setQuests(data.quests || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchQuests();
  }, []);

  const handleAccept = (id) => {
    setAcceptedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
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

      {loading && <p className="text-slate-400">Loading quests...</p>}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {!loading && quests.length === 0 && (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-center">
          No quests posted yet. Guild Masters can create one in the Admin Console.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quests.map((quest) => {
          const isAccepted = acceptedIds.includes(quest.id);
          const formattedDate = new Date(quest.startTime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div
              key={quest.id}
              className="p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 shadow-lg flex flex-col justify-between transition"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
                    {quest.guild?.name || 'Campus Guild'}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-400">
                    <Zap className="w-4 h-4" /> +{quest.xpReward} XP
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white leading-snug">
                  {quest.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{quest.description}</p>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-sm text-slate-400">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" /> {formattedDate}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" /> {quest.venue}
                  </p>
                </div>
              </div>

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