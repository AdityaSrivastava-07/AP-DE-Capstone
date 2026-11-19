import { useEffect, useState } from 'react';
import { Shield, PlusCircle, Users, Compass } from 'lucide-react';

const API_URL = 'http://localhost:5001';

export default function AdminDashboard({ token, user }) {
  const [guilds, setGuilds] = useState([]);
  const [quests, setQuests] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Guild form state
  const [guildName, setGuildName] = useState('');
  const [guildDesc, setGuildDesc] = useState('');
  const [guildHeadId, setGuildHeadId] = useState(user?.id || '');

  // Quest form state
  const [questTitle, setQuestTitle] = useState('');
  const [questDesc, setQuestDesc] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [xpReward, setXpReward] = useState(100);
  const [startTime, setStartTime] = useState('2026-11-22T10:00');
  const [endTime, setEndTime] = useState('2026-11-22T12:00');
  const [questGuildId, setQuestGuildId] = useState('');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  async function loadManagementData() {
    setErrorMsg('');
    try {
      const [gRes, qRes, hRes] = await Promise.all([
        fetch(`${API_URL}/manage/guilds`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/manage/quests`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/manage/heroes`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const gData = await gRes.json();
      const qData = await qRes.json();
      const hData = await hRes.json();

      if (gRes.ok) {
        setGuilds(gData.guilds || []);
        if (gData.guilds?.length && !questGuildId) {
          setQuestGuildId(String(gData.guilds[0].id));
        }
      }
      if (qRes.ok) setQuests(qData.quests || []);
      if (hRes.ok) setHeroes(hData.heroes || []);
    } catch {
      setErrorMsg('Failed to load management data from backend.');
    }
  }

  useEffect(() => {
    if (token) loadManagementData();
  }, [token]);

  async function handleCreateGuild(e) {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');

    const res = await fetch(`${API_URL}/manage/guilds`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: guildName,
        description: guildDesc,
        headId: Number(guildHeadId) || user.id,
      }),
    });
    const data = await res.json();
    if (!res.ok) return setErrorMsg(data.error || 'Could not create guild.');

    setStatusMsg(`Guild "${data.guild.name}" created.`);
    setGuildName('');
    setGuildDesc('');
    loadManagementData();
  }

  async function handleCreateQuest(e) {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');

    const res = await fetch(`${API_URL}/manage/quests`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: questTitle,
        description: questDesc,
        venue,
        capacity: Number(capacity),
        xpReward: Number(xpReward),
        status: 'APPROVED',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        guildId: Number(questGuildId),
      }),
    });
    const data = await res.json();
    if (!res.ok) return setErrorMsg(data.error || 'Could not create quest.');

    setStatusMsg(`Quest "${data.quest.title}" created.`);
    setQuestTitle('');
    setQuestDesc('');
    setVenue('');
    loadManagementData();
  }

  async function handleRoleChange(heroId, newRole) {
    setStatusMsg('');
    setErrorMsg('');
    const res = await fetch(`${API_URL}/manage/heroes/${heroId}/role`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) return setErrorMsg(data.error || 'Could not update role.');

    setStatusMsg(`Updated ${data.hero.name} to ${data.hero.role}.`);
    loadManagementData();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-2xl">
          <Shield className="w-7 h-7" /> Command & Guild Console
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-amber-300 font-semibold">
          {user?.role}
        </span>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-sm">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Forms Grid: Add Guild + Add Quest */}
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={handleCreateGuild} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2 text-amber-400">
            <PlusCircle className="w-5 h-5" /> Add New Guild
          </h2>
          <input
            type="text"
            required
            placeholder="Guild Name (e.g., AI & Systems Guild)"
            value={guildName}
            onChange={(e) => setGuildName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
          />
          <textarea
            required
            rows={2}
            placeholder="Guild description"
            value={guildDesc}
            onChange={(e) => setGuildDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
          />
          <input
            type="number"
            placeholder="Head Hero ID (defaults to your ID)"
            value={guildHeadId}
            onChange={(e) => setGuildHeadId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-semibold text-sm hover:bg-amber-300"
          >
            Create Guild
          </button>
        </form>

        <form onSubmit={handleCreateQuest} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2 text-amber-400">
            <Compass className="w-5 h-5" /> Add New Quest
          </h2>
          <input
            type="text"
            required
            placeholder="Quest Title"
            value={questTitle}
            onChange={(e) => setQuestTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
          />
          <input
            type="text"
            required
            placeholder="Description"
            value={questDesc}
            onChange={(e) => setQuestDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              required
              placeholder="Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            />
            <input
              type="number"
              required
              placeholder="Capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            />
            <input
              type="number"
              required
              placeholder="XP Reward"
              value={xpReward}
              onChange={(e) => setXpReward(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            />
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            />
          </div>
          <select
            value={questGuildId}
            onChange={(e) => setQuestGuildId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
          >
            {guilds.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} (ID: {g.id})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-semibold text-sm hover:bg-amber-300"
          >
            Create Quest
          </button>
        </form>
      </div>

      {/* Heroes Roster & Active Quests Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 text-amber-400 mb-4">
          <Users className="w-5 h-5" /> Heroes Roster ({heroes.length}) • Quests ({quests.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">XP</th>
                <th className="py-2 pr-4">Level</th>
                <th className="py-2">Badges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {heroes.map((h) => (
                <tr key={h.id}>
                  <td className="py-2.5 pr-4 font-medium">{h.name}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{h.email}</td>
                  <td className="py-2.5 pr-4">
                    {user?.role === 'ADMIN' ? (
                      <select
                        value={h.role}
                        onChange={(e) => handleRoleChange(h.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
                      >
                        <option value="HERO">HERO</option>
                        <option value="GUILD_MASTER">GUILD_MASTER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800">{h.role}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-amber-300">{h.xp}</td>
                  <td className="py-2.5 pr-4">{h.level}</td>
                  <td className="py-2.5">{h._count?.badges ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}