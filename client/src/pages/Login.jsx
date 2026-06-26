import React, { useState, useEffect } from 'react';
import { Shield, MapPin, User, Building, BarChart2, Sun, Moon } from 'lucide-react';

export default function Login({ setToken, setUser, API_BASE, setGlobalError, setGlobalSuccess, theme, setTheme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ward, setWard] = useState('Ward 5');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Auto-seed database on load to ensure demo accounts are functional
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

  // Form submit handler (login)
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

  // Helper to send SMTP or simulated OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!mobileNumber || mobileNumber.length !== 10) {
      setGlobalError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email || !email.includes('@')) {
      setGlobalError('Please enter a valid email address.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, mobileNumber })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.message || 'Failed to dispatch OTP.');
        setLoading(false);
        return;
      }

      setOtpCode(data.otp);
      setOtpSent(true);
      
      if (data.sent) {
        setGlobalSuccess(`🛡️ Sarthi OTP Sent: Real email verification code sent to ${email}`);
      } else {
        setGlobalSuccess(`🛡️ Sarthi OTP (SMTP unconfigured, showing mock): Verification code for +91-${mobileNumber} is ${data.otp}`);
      }
    } catch (err) {
      setGlobalError('Failed to connect to the OTP dispatcher.');
    } finally {
      setLoading(false);
    }
  };

  // Register citizen handler
  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!username || !password || !mobileNumber || !email) return;

    if (!otpSent) {
      handleSendOtp(e);
      return;
    }

    if (otpInput !== otpCode) {
      setGlobalError('Incorrect OTP code. Please check the code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          role: 'citizen',
          ward,
          mobileNumber,
          email
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.message || 'Registration failed.');
        setLoading(false);
        return;
      }

      setGlobalSuccess('Registration successful! Please sign in using your credentials.');
      setIsRegister(false);
      setOtpSent(false);
      setOtpInput('');
      setOtpCode('');
      setMobileNumber('');
      setEmail('');
    } catch (err) {
      setGlobalError('Unable to connect to the registration server.');
    } finally {
      setLoading(false);
    }
  };

  // Quick login card helper
  const handleQuickLogin = (uname, pass) => {
    setIsRegister(false);
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
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-wider text-sm uppercase">
              <Shield className="w-5 h-5 animate-pulse" />
              Sarthi AI Powered
            </div>
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-750 text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
              title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative z-10">
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
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center font-sans">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isRegister ? 'Register Citizen Account' : 'Access Control Terminal'}
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            {isRegister 
              ? 'Create citizen credentials to report issues and earn honor points.' 
              : 'Sign in with registered credentials, or select a role profile below for instant testing.'}
          </p>

          <form onSubmit={isRegister ? handleRegister : handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Username / ID</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder={isRegister ? "Choose a unique username" : "Enter municipal username"}
                disabled={otpSent}
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
                disabled={otpSent}
                required
              />
            </div>

            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Enter your email ID"
                    disabled={otpSent}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Mobile Number</label>
                  <input 
                    type="tel" 
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Enter 10-digit mobile number"
                    disabled={otpSent}
                    required
                  />
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-indigo-600 font-extrabold animate-pulse">Enter 6-Digit OTP Code</label>
                    <input 
                      type="text" 
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono tracking-[0.4em] text-center text-lg font-bold"
                      placeholder="••••••"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Select Ward Location</label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all animate-none"
                    disabled={otpSent}
                  >
                    <option value="Ward 1">Ward 1 (Northern Zone)</option>
                    <option value="Ward 2">Ward 2 (Eastern Zone)</option>
                    <option value="Ward 3">Ward 3 (Western Zone)</option>
                    <option value="Ward 4">Ward 4 (Southern Zone)</option>
                    <option value="Ward 5">Ward 5 (Central Zone)</option>
                  </select>
                </div>
              </>
            )}
            
            <button 
              id="login-submit-btn"
              type="submit" 
              disabled={loading}
              className="w-full bg-gov-navy text-white text-sm font-semibold py-3 rounded-xl hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center justify-center shadow-md disabled:opacity-50 font-sans"
            >
              {loading 
                ? (isRegister ? 'Processing Account...' : 'Authenticating Credentials...') 
                : (isRegister ? (otpSent ? 'Verify OTP & Create Account' : 'Send Verification OTP') : 'Access Portal')}
            </button>
          </form>

          {/* Toggle register mode */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setOtpSent(false);
                setOtpInput('');
                setOtpCode('');
                setMobileNumber('');
                setEmail('');
                setUsername('');
                setPassword('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-2 transition-all"
            >
              {isRegister ? 'Already have an account? Sign In' : 'New Citizen? Register/Sign Up here'}
            </button>
          </div>

          {/* Quick Login Cards */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1-Click Evaluation Profiles</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[170px] overflow-y-auto pr-1">
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
