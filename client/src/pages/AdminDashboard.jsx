import { useEffect, useState } from 'react';
import { Shield, Swords, Users, ClipboardList } from 'lucide-react';

const API_URL = 'http://localhost:5001';

export default function AdminDashboard({ token, user }) {
  const [guilds, setGuilds] = useState([]);
  const [quests, setQuests] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [guildForm, setGuildForm] = useState({
    name: '',
    description: '',
    logoUrl: '',
    headId: user?.id ? String(user.id) : '',
  });

  const [questForm, setQuestForm] = useState({
    title: '',
    description: '',
    venue: '',
    capacity: '50',
    xpReward: '150',
    status: 'APPROVED',
    startTime: '2026-11-25T10:00',
    endTime: '2026-11-25T12:00',
    guildId: '',
  });

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [guildsRes, questsRes, heroesRes] = await Promise.all([
          fetch(`${API_URL}/manage/guilds`, { headers }),
          fetch(`${API_URL}/manage/quests`, { headers }),
          fetch(`${API_URL}/manage/heroes`, { headers }),
        ]);

        const [guildsData, questsData, heroesData] = await Promise.all([
          guildsRes.json(),
          questsRes.json(),
          heroesRes.json(),
        ]);

        if (guildsRes.ok) {
          setGuilds(guildsData.guilds || []);
          if (guildsData.guilds?.length && !questForm.guildId) {
            setQuestForm((prev) => ({ ...prev, guildId: String(guildsData.guilds[0].id) }));
          }
        }
        if (questsRes.ok) setQuests(questsData.quests || []);
        if (heroesRes.ok) setHeroes(heroesData.heroes || []);
      } catch {
        setMessage('Failed to load management data from server.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadAdminData();
    }
  }, [token]);

  async function handleCreateGuild(e) {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/manage/guilds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...guildForm,
          headId: guildForm.headId ? Number(guildForm.headId) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Failed to create guild.');
        return;
      }

      setGuilds((prev) => [...prev, { ...data.guild, _count: { quests: 0 } }]);
      setQuestForm((prev) => ({ ...prev, guildId: String(data.guild.id) }));
      setGuildForm({ name: '', description: '', logoUrl: '', headId: String(user?.id || '') });
      setMessage(data.message || 'Guild created!');
    } catch {
      setMessage('Error creating guild.');
    }
  }

  async function handleCreateQuest(e) {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/manage/quests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...questForm,
          capacity: Number(questForm.capacity),
          xpReward: Number(questForm.xpReward),
          guildId: Number(questForm.guildId),
          startTime: new Date(questForm.startTime).toISOString(),
          endTime: new Date(questForm.endTime).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Failed to create quest.');
        return;
      }

      setQuests((prev) => [
        ...prev,
        { ...data.quest, _count: { registrations: 0, badges: 0 } },
      ]);
      setQuestForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        venue: '',
      }));
      setMessage(data.message || 'Quest created!');
    } catch {
      setMessage('Error creating quest.');
    }
  }

  async function handleQuestStatusChange(questId, nextStatus) {
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/manage/quests/${questId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Failed to update quest status.');
        return;
      }

      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, status: data.quest?.status || nextStatus } : q))
      );
      setMessage(`Quest #${questId} status updated to ${nextStatus}.`);
    } catch {
      setMessage('Error updating quest status.');
    }
  }

  async function handleRoleChange(heroId, nextRole) {
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/manage/heroes/${heroId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Failed to update role.');
        return;
      }

      setHeroes((prev) =>
        prev.map((h) => (h.id === heroId ? { ...h, role: data.hero.role } : h))
      );
      setMessage(`Updated hero #${heroId} role to ${nextRole}.`);
    } catch {
      setMessage('Error updating hero role.');
    }
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-10 text-slate-400">Loading command console...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Command & Guild Console</h1>
        <p className="text-slate-400 mt-1">
          Manage guilds, publish campus quests, monitor attendance turnout, and assign hero roles.
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-lg bg-slate-900 border border-amber-500/50 text-amber-300 text-sm">
          {message}
        </div>
      )}

      {/* Creation Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleCreateGuild}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" /> Create Guild
          </h2>
          <input
            type="text"
            required
            placeholder="Guild name"
            value={guildForm.name}
            onChange={(e) => setGuildForm({ ...guildForm, name: e.target.value })}
            className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
          />
          <textarea
            required
            rows={2}
            placeholder="Guild description"
            value={guildForm.description}
            onChange={(e) => setGuildForm({ ...guildForm, description: e.target.value })}
            className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Logo URL (optional)"
              value={guildForm.logoUrl}
              onChange={(e) => setGuildForm({ ...guildForm, logoUrl: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            />
            <input
              type="number"
              placeholder="Guild Master User ID"
              value={guildForm.headId}
              onChange={(e) => setGuildForm({ ...guildForm, headId: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-semibold text-sm cursor-pointer"
          >
            Create Guild
          </button>
        </form>

        <form
          onSubmit={handleCreateQuest}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" /> Create Quest
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Quest title"
              value={questForm.title}
              onChange={(e) => setQuestForm({ ...questForm, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            />
            <select
              required
              value={questForm.guildId}
              onChange={(e) => setQuestForm({ ...questForm, guildId: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            >
              <option value="">Select Guild</option>
              {guilds.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            required
            rows={2}
            placeholder="Quest description"
            value={questForm.description}
            onChange={(e) => setQuestForm({ ...questForm, description: e.target.value })}
            className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Venue"
              value={questForm.venue}
              onChange={(e) => setQuestForm({ ...questForm, venue: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            />
            <input
              type="number"
              required
              min="1"
              placeholder="Capacity"
              value={questForm.capacity}
              onChange={(e) => setQuestForm({ ...questForm, capacity: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            />
            <input
              type="number"
              required
              min="0"
              placeholder="XP Reward"
              value={questForm.xpReward}
              onChange={(e) => setQuestForm({ ...questForm, xpReward: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="datetime-local"
              required
              value={questForm.startTime}
              onChange={(e) => setQuestForm({ ...questForm, startTime: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            />
            <input
              type="datetime-local"
              required
              value={questForm.endTime}
              onChange={(e) => setQuestForm({ ...questForm, endTime: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm cursor-pointer"
          >
            Publish Quest
          </button>
        </form>
      </div>

      {/* Quests Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-amber-400" /> Quests Management ({quests.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3 pr-4">Quest</th>
                <th className="py-3 px-4">Guild</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">XP</th>
                <th className="py-3 px-4">Registrations</th>
                <th className="py-3 px-4">Badges</th>
                <th className="py-3 pl-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {quests.map((quest) => (
                <tr key={quest.id}>
                  <td className="py-3 pr-4 font-semibold text-white">{quest.title}</td>
                  <td className="py-3 px-4 text-blue-400">{quest.guild?.name || '—'}</td>
                  <td className="py-3 px-4 text-slate-400">{quest.venue}</td>
                  <td className="py-3 px-4 text-amber-400 font-semibold">+{quest.xpReward} XP</td>
                  <td className="py-3 px-4">
                    {quest._count?.registrations ?? 0} / {quest.capacity}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">
                    {quest._count?.badges ?? 0}
                  </td>
                  <td className="py-3 pl-4">
                    <select
                      value={quest.status}
                      onChange={(e) => handleQuestStatusChange(quest.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guilds & Heroes Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Active Guilds ({guilds.length})</h2>
          <div className="space-y-3">
            {guilds.map((guild) => (
              <div
                key={guild.id}
                className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-white">{guild.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{guild.description}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-900 text-blue-400 border border-slate-800">
                  {guild._count?.quests ?? 0} Quests
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> Heroes Directory ({heroes.length})
          </h2>
          <div className="space-y-3">
            {heroes.map((hero) => (
              <div
                key={hero.id}
                className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center gap-3"
              >
                <div>
                  <p className="font-semibold text-white">{hero.name}</p>
                  <p className="text-xs text-slate-400">
                    {hero.email} • Lvl {hero.level} • {hero.xp} XP
                  </p>
                </div>
                <select
                  value={hero.role}
                  disabled={user?.role !== 'ADMIN'}
                  onChange={(e) => handleRoleChange(hero.id, e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white disabled:opacity-60"
                >
                  <option value="HERO">HERO</option>
                  <option value="GUILD_MASTER">GUILD_MASTER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}