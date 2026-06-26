import React, { useState, useEffect } from 'react';
import { Shield, MapPin, User, Building, BarChart2 } from 'lucide-react';

export default function Login({ setToken, setUser, API_BASE, setGlobalError, setGlobalSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Auto-seed database on load to ensure demo accounts are instantly functional
  useEffect(() => {
    const seedDatabase = async () => {
      setSeeding(true);
      try {
        const res = await fetch(`${API_BASE}/auth/seed`, {
          method: 'POST'
        });
        if (res.ok) {
          console.log('Sarthi DB seeded successfully.');
        }
      } catch (err) {
        console.error('Seeding connection failed:', err);
      } finally {
        setSeeding(false);
      }
    };
    seedDatabase();
  }, [API_BASE]);

  // Form submit handler
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.message || 'Login failed.');
        setLoading(false);
        return;
      }

      setGlobalSuccess(`Welcome back, ${data.user.username}!`);
      localStorage.setItem('sarthi_token', data.token);
      localStorage.setItem('sarthi_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setGlobalError('Unable to connect to the backend server. Please verify Express API is active on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  // Quick login card helper
  const handleQuickLogin = (uname, pass) => {
    setUsername(uname);
    setPassword(pass);
    // Submit using state updates in next tick
    setTimeout(() => {
      const btn = document.getElementById('login-submit-btn');
      if (btn) btn.click();
    }, 100);
  };

  const roles = [
    {
      title: 'Citizen Portal',
      desc: 'Submit complaints, check real-time status & earn points.',
      icon: <User className="w-5 h-5 text-indigo-600" />,
      user: 'citizen',
      pass: 'citizen123',
      color: 'border-indigo-100 hover:border-indigo-400 bg-indigo-50/30'
    },
    {
      title: 'Roads Dept Officer',
      desc: 'Review auto-assigned pothole briefs & upload resolved proof.',
      icon: <Building className="w-5 h-5 text-amber-600" />,
      user: 'officer_roads',
      pass: 'officer123',
      color: 'border-amber-100 hover:border-amber-400 bg-amber-50/30'
    },
    {
      title: 'Sanitation Officer',
      desc: 'Track street hygiene jobs, waste alerts, and verify work.',
      icon: <Building className="w-5 h-5 text-emerald-600" />,
      user: 'officer_sanitation',
      pass: 'officer123',
      color: 'border-emerald-100 hover:border-emerald-400 bg-emerald-50/30'
    },
    {
      title: 'Ward Commissioner',
      desc: 'Verify edge cases, manage escalations & supervise reports.',
      icon: <Shield className="w-5 h-5 text-red-600" />,
      user: 'admin',
      pass: 'admin123',
      color: 'border-red-100 hover:border-red-400 bg-red-50/30'
    },
    {
      title: 'Analytics Centre',
      desc: 'Analyze heatmaps, predictive failure zones & SLA charts.',
      icon: <BarChart2 className="w-5 h-5 text-teal-600" />,
      user: 'analytics',
      pass: 'analytics123',
      color: 'border-teal-100 hover:border-teal-400 bg-teal-50/30'
    }
  ];

  return (
    <div className="flex-grow flex items-center justify-center p-6 md:p-12 max-w-6xl mx-auto w-full">
      <div className="grid md:grid-cols-12 gap-8 w-full bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl">
        
        {/* Left Side: App Branding */}
        <div className="md:col-span-5 bg-gov-navy text-slate-100 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gov-blue/40 via-gov-navy to-gov-navy opacity-75 z-0"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-wider text-sm uppercase">
              <Shield className="w-5 h-5 animate-pulse" />
              Sarthi AI Powered
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mt-4 font-sans">
              Civic<br /><span className="text-emerald-400">Pulse</span>
            </h1>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Autonomous Civic Intelligence Operating System for modern municipal ecosystems.
            </p>
          </div>

          <div className="relative z-10 mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-emerald-400 text-xs font-bold">✓</span>
              <p className="text-xs text-slate-200">Zero-Friction Audio intake parser</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-emerald-400 text-xs font-bold">✓</span>
              <p className="text-xs text-slate-200">Auto duplicate & coordinate clustering</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-emerald-400 text-xs font-bold">✓</span>
              <p className="text-xs text-slate-200">Double-blind vision resolution checks</p>
            </div>
          </div>

          <div className="relative z-10 text-[10px] text-slate-400 mt-12">
            System running: <span className="text-emerald-400 font-semibold">Stateless Session Secure</span>.
            {seeding && <span className="ml-2 text-indigo-400 italic font-medium animate-pulse">(Auto-seeding DB...)</span>}
          </div>
        </div>

        {/* Right Side: Form & Quick login cards */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Access Control Terminal</h2>
          <p className="text-slate-500 text-xs mt-1">Sign in with registered credentials, or select a role profile below for instant testing.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Username / ID</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Enter municipal username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Security Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button 
              id="login-submit-btn"
              type="submit" 
              disabled={loading}
              className="w-full bg-gov-navy text-white text-sm font-semibold py-3 rounded-xl hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center justify-center shadow-md disabled:opacity-50"
            >
              {loading ? 'Authenticating Credentials...' : 'Access Portal'}
            </button>
          </form>

          {/* Quick Login Cards */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1-Click Evaluation Profiles</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
              {roles.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickLogin(r.user, r.pass)}
                  className={`flex items-start text-left gap-3 p-3 rounded-xl border transition-all ${r.color}`}
                >
                  <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100">
                    {r.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{r.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{r.desc}</p>
                    <span className="inline-block mt-1 text-[9px] text-slate-400 font-mono">id: {r.user}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
