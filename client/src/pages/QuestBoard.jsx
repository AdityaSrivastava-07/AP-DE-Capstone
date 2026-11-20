import { useEffect, useState } from 'react';
import { Calendar, MapPin, Zap, CheckCircle, KeyRound, Ticket } from 'lucide-react';

const API_URL = 'http://localhost:5001';

export default function QuestBoard({ token }) {
  const [quests, setQuests] = useState([]);
  const [registrations, setRegistrations] = useState({}); // { [questId]: registration }
  const [checkInCodes, setCheckInCodes] = useState({}); // { [questId]: string }
  const [registeringId, setRegisteringId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [checkedInIds, setCheckedInIds] = useState([]);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuests() {
      try {
        const res = await fetch(`${API_URL}/manage/quests`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch quests.');
        setQuests(data.quests || []);
      } catch (err) {
        setFeedback({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    }
    fetchQuests();
  }, []);

  const handleAcceptQuest = async (questId) => {
    if (!token) {
      setFeedback({ type: 'error', message: 'Please sign in first to accept a quest.' });
      return;
    }

    setRegisteringId(questId);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch(`${API_URL}/attendance/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to register for quest.' });
        return;
      }

      const reg = data.registration;
      setRegistrations((prev) => ({ ...prev, [questId]: reg }));
      if (reg?.qrToken) {
        setCheckInCodes((prev) => ({ ...prev, [questId]: reg.qrToken }));
      }
      setFeedback({
        type: 'success',
        message: data.message || 'Quest accepted! Your check-in pass is ready.',
      });
    } catch {
      setFeedback({ type: 'error', message: 'Cannot reach server at http://localhost:5001.' });
    } finally {
      setRegisteringId(null);
    }
  };

  const handleCodeChange = (questId, value) => {
    setCheckInCodes((prev) => ({ ...prev, [questId]: value }));
  };

  const handleCheckIn = async (questId) => {
    if (!token) {
      setFeedback({ type: 'error', message: 'Please sign in first to check into a quest.' });
      return;
    }

    const checkInCode = (checkInCodes[questId] || '').trim();
    if (!checkInCode) {
      setFeedback({
        type: 'error',
        message: 'Accept the quest first or enter an event check-in code.',
      });
      return;
    }

    setSubmittingId(questId);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch(`${API_URL}/attendance/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questId, checkInCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Check-in failed.' });
        return;
      }

      setCheckedInIds((prev) => (prev.includes(questId) ? prev : [...prev, questId]));
      setFeedback({
        type: 'success',
        message: data.message || `Checked in! Earned +${data.xpEarned ?? 0} XP.`,
      });
    } catch {
      setFeedback({ type: 'error', message: 'Cannot reach attendance server at http://localhost:5001.' });
    } finally {
      setSubmittingId(null);
    }
  };

  const acceptedCount = Object.keys(registrations).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Active Quest Board</h1>
          <p className="text-slate-400 mt-1">
            Accept campus events to generate your check-in pass and earn XP rewards.
          </p>
        </div>
        <span className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-amber-400 font-semibold">
          {acceptedCount} Quests Accepted • {checkedInIds.length} Checked In
        </span>
      </div>

      {feedback.message && (
        <div
          className={`mb-6 p-3.5 rounded-lg border text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
              : 'bg-red-950/60 border-red-800 text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {loading && <p className="text-slate-400">Loading quests...</p>}

      {!loading && quests.length === 0 && (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-center">
          No quests posted yet. Guild Masters can create one in the Admin Console.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quests.map((quest) => {
          const registration = registrations[quest.id];
          const isAccepted = Boolean(registration);
          const isCheckedIn = checkedInIds.includes(quest.id);
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

                <h3 className="text-lg font-bold text-white leading-snug">{quest.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{quest.description}</p>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-sm text-slate-400">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" /> {formattedDate}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" /> {quest.venue}
                  </p>
                </div>

                {registration?.qrToken && (
                  <div className="mt-4 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <p className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Ticket className="w-3.5 h-3.5 text-amber-400" /> Your Check-In Pass
                    </p>
                    <p className="text-amber-300 font-mono text-[11px] truncate mt-1">
                      {registration.qrToken}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleAcceptQuest(quest.id)}
                  disabled={registeringId === quest.id || isAccepted}
                  className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:cursor-default ${
                    isAccepted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {isAccepted ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> Pass Issued
                    </>
                  ) : registeringId === quest.id ? (
                    'Registering...'
                  ) : (
                    'Accept Quest'
                  )}
                </button>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={checkInCodes[quest.id] || ''}
                      onChange={(e) => handleCodeChange(quest.id, e.target.value)}
                      placeholder="Pass or event code"
                      disabled={isCheckedIn}
                      className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-60"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCheckIn(quest.id)}
                    disabled={submittingId === quest.id || isCheckedIn}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isCheckedIn ? 'Verified' : submittingId === quest.id ? '...' : 'Check In'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}