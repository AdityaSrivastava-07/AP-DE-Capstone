import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserPlus } from 'lucide-react';

const API_URL = 'http://localhost:5001';

export default function LoginPage({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('HERO');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isSignup ? '/auth/signup' : '/auth/login';
    const payload = isSignup
      ? { name: name.trim(), email: email.trim(), password, role }
      : { email: email.trim(), password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isSignup ? 'Signup failed.' : 'Login failed.'));
        return;
      }

      localStorage.setItem('heroics_token', data.token);
      localStorage.setItem('heroics_user', JSON.stringify(data.hero));
      onLoginSuccess({ token: data.token, user: data.hero });

      if (data.hero.role === 'GUILD_MASTER' || data.hero.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('Cannot reach server at http://localhost:5001.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xl">
            {isSignup ? <UserPlus className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            {isSignup ? 'Create Hero Account' : 'Hero Login'}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsSignup((prev) => !prev);
              setError('');
            }}
            className="text-xs text-amber-400 hover:underline cursor-pointer"
          >
            {isSignup ? 'Have an account? Sign In' : 'New hero? Sign Up'}
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-6">
          {isSignup
            ? 'Register a new student hero or guild master account.'
            : 'Sign in to access your quests, XP profile, or Guild Master controls.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="HERO">HERO (Standard Student)</option>
                <option value="GUILD_MASTER">GUILD_MASTER (Club Head)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-amber-400 text-slate-950 font-semibold hover:bg-amber-300 transition disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? isSignup
                ? 'Creating Account...'
                : 'Signing in...'
              : isSignup
              ? 'Sign Up'
              : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}