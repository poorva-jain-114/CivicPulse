import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sarthi_token') || '');
  const [page, setPage] = useState('login');
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('sarthi_theme') || 'light');
  const [auditLogs, setAuditLogs] = useState([]);
  const [lastLogId, setLastLogId] = useState('');

  // Auto-load user from token if saved
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('sarthi_user');
      if (savedUser && token && savedUser !== 'undefined') {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        routeByRole(parsed.role);
      }
    } catch (err) {
      console.error("Localstorage recovery failed:", err);
      localStorage.removeItem('sarthi_user');
      localStorage.removeItem('sarthi_token');
    }
  }, [token]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sarthi_theme', theme);
  }, [theme]);

  const routeByRole = (role) => {
    if (role === 'citizen') setPage('citizen');
    else if (role === 'officer') setPage('officer');
    else if (role === 'admin') setPage('admin');
    else if (role === 'analytics') setPage('analytics');
    else setPage('login');
  };

  // Toast auto-clear
  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  useEffect(() => {
    if (globalSuccess) {
      const timer = setTimeout(() => setGlobalSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalSuccess]);

  // Fetch incidents & alerts & analytics data from backend
  const fetchData = async () => {
    if (!token) return;
    try {
      // 1. Fetch incidents
      const incRes = await fetch(`${API_BASE}/incidents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (incRes.ok) {
        const data = await incRes.json();
        setIncidents(data);
      }

      // 2. Fetch alerts
      const alertRes = await fetch(`${API_BASE}/analytics/predictive-risks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (alertRes.ok) {
        const data = await alertRes.json();
        setAlerts(data);
      }

      // 3. Fetch summary metrics
      const sumRes = await fetch(`${API_BASE}/analytics/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sumRes.ok) {
        const data = await sumRes.json();
        setAnalyticsSummary(data);
      }

      // 4. Fetch Audit Logs
      const auditRes = await fetch(`${API_BASE}/incidents/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (auditRes.ok) {
        const logsData = await auditRes.json();
        setAuditLogs(logsData);

        // Toast WebSockets Notifications simulator
        if (logsData.length > 0) {
          if (!lastLogId) {
            setLastLogId(logsData[0]._id || logsData[0].id);
          } else {
            const newLogs = [];
            for (const log of logsData) {
              if ((log._id || log.id) === lastLogId) break;
              newLogs.push(log);
            }
            if (newLogs.length > 0) {
              newLogs.reverse().forEach(log => {
                setGlobalSuccess(`🛡️ Sarthi OS: [${log.action}] ${log.details}`);
              });
              setLastLogId(logsData[0]._id || logsData[0].id);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync with API backend:', err);
    }
  };

  // Poll server for updates every 10 seconds
  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Handles logging out
  const handleLogout = () => {
    localStorage.removeItem('sarthi_token');
    localStorage.removeItem('sarthi_user');
    setToken('');
    setUser(null);
    setPage('login');
  };

  // Submit Complaint
  const handleCreateComplaint = async (formData) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setGlobalError(data.reason || data.message || 'Submission failed');
        // Still fetch to see archived spam if it was saved
        fetchData();
        return { success: false, ...data };
      }

      setGlobalSuccess(data.message || 'Grievance submitted successfully!');
      
      // Update local points if returned
      if (data.incident && user) {
        const pointsGained = data.clustered ? 5 : 15;
        const updatedUser = { ...user, points: (user.points || 0) + pointsGained };
        setUser(updatedUser);
        localStorage.setItem('sarthi_user', JSON.stringify(updatedUser));
      }
      
      fetchData();
      return { success: true, ...data };
    } catch (err) {
      setGlobalError('Network error connecting to Sarthi AI API.');
      return { success: false, message: err.message };
    }
  };

  // Upvote / Confirm Ticket
  const handleUpvote = async (incidentId) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.message);
        return;
      }
      setGlobalSuccess(data.message);
      
      // Update points locally
      if (user) {
        const updatedUser = { ...user, points: (user.points || 0) + 10 };
        setUser(updatedUser);
        localStorage.setItem('sarthi_user', JSON.stringify(updatedUser));
      }
      fetchData();
    } catch (err) {
      setGlobalError('Connection failed.');
    }
  };

  // Resolve Ticket (Officer Upload)
  const handleResolve = async (incidentId, resolveData) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(resolveData)
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.message);
        return { success: false };
      }
      setGlobalSuccess(data.message);
      fetchData();
      return { success: true, ...data };
    } catch (err) {
      setGlobalError('Resolution submission failed.');
      return { success: false };
    }
  };

  // Assign Officer (Admin Action)
  const handleAssign = async (incidentId, officerUsername) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ officerUsername })
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.message);
        return;
      }
      setGlobalSuccess(data.message);
      fetchData();
    } catch (err) {
      setGlobalError('Assignment failed.');
    }
  };

  // Escalation simulator
  const handleEscalate = async (incidentId) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/escalate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.message);
        return;
      }
      setGlobalSuccess(data.message);
      fetchData();
    } catch (err) {
      setGlobalError('Escalation failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gov-bg flex flex-col justify-between">
      {/* Toast Notifications */}
      {globalError && (
        <div className="fixed top-4 right-4 z-50 max-w-sm glassmorphism bg-red-50 border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-start gap-2 animate-bounce">
          <span className="font-bold text-red-500">⚠️</span>
          <div>
            <p className="text-xs font-semibold">Sarthi AI Guard Alert</p>
            <p className="text-xs">{globalError}</p>
          </div>
        </div>
      )}

      {globalSuccess && (
        <div className="fixed top-4 right-4 z-50 max-w-sm glassmorphism bg-emerald-50 border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg flex items-start gap-2 animate-pulse">
          <span className="font-bold text-emerald-500">🛡️</span>
          <div>
            <p className="text-xs font-semibold">Sarthi System Alert</p>
            <p className="text-xs">{globalSuccess}</p>
          </div>
        </div>
      )}

      {/* Render current page */}
      <div className="flex-grow flex flex-col">
        {page === 'login' && (
          <Login 
            setToken={setToken} 
            setUser={setUser} 
            API_BASE={API_BASE}
            setGlobalError={setGlobalError}
            setGlobalSuccess={setGlobalSuccess}
            theme={theme}
            setTheme={setTheme}
          />
        )}
        
        {page === 'citizen' && user && (
          <CitizenDashboard
            user={user}
            incidents={incidents}
            onCreateComplaint={handleCreateComplaint}
            onUpvote={handleUpvote}
            onLogout={handleLogout}
            setPage={setPage}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {page === 'officer' && user && (
          <OfficerDashboard
            user={user}
            incidents={incidents}
            onResolve={handleResolve}
            onLogout={handleLogout}
            setPage={setPage}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {page === 'admin' && user && (
          <AdminDashboard
            user={user}
            incidents={incidents}
            alerts={alerts}
            auditLogs={auditLogs}
            onAssign={handleAssign}
            onEscalate={handleEscalate}
            onLogout={handleLogout}
            setPage={setPage}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {page === 'analytics' && user && (
          <AnalyticsDashboard
            user={user}
            incidents={incidents}
            alerts={alerts}
            summary={analyticsSummary}
            onLogout={handleLogout}
            setPage={setPage}
            theme={theme}
            setTheme={setTheme}
          />
        )}
      </div>

      {/* Corporate Gov Footer */}
      <footer className="bg-gov-navy text-slate-400 py-3 text-center text-xs border-t border-slate-800">
        <p>© 2026 Ministry of Municipal Administration & Information Technology. Powered by Sarthi AI.</p>
        <p className="text-[10px] text-slate-500 mt-1">Autonomous Civic Operating System v1.0.0-Stateless Production Release</p>
      </footer>
    </div>
  );
}
