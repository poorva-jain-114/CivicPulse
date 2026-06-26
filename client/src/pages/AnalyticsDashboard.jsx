import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { LogOut, BarChart2, ShieldAlert, Award, MapPin, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import Map from '../components/Map';

// Register ChartJS modules
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsDashboard({ user, incidents, alerts, summary, onLogout, setPage }) {

  // Prepare fallback data if summary is loading
  const stats = summary?.totals || { total: 0, resolved: 0, open: 0, inProgress: 0, escalated: 0, spam: 0 };
  const deptStats = summary?.departmentStats || [];
  const wardScores = summary?.wardScores || {};

  // 1. Doughnut Chart: Grievance Status
  const statusChartData = {
    labels: ['Open', 'In Progress', 'Resolved & Verified'],
    datasets: [
      {
        data: [stats.open, stats.inProgress, stats.resolved],
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  // 2. Bar Chart: Department SLA Performance
  const deptChartData = {
    labels: deptStats.map(d => d.name.split(' ')[0]), // Short names
    datasets: [
      {
        label: 'SLA Score (%)',
        data: deptStats.map(d => d.slaScore),
        backgroundColor: deptStats.map(d => d.slaScore >= 80 ? '#10B981' : d.slaScore >= 60 ? '#F59E0B' : '#EF4444'),
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 9 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 } }
      }
    }
  };

  return (
    <div className="flex-grow flex flex-col">
      {/* Header */}
      <header className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/30 text-teal-400 font-extrabold text-lg">
            AC
          </div>
          <div>
            <h1 className="text-lg font-bold">Civic Pulse</h1>
            <p className="text-[10px] text-slate-400">Sarthi AI Autonomous Command Center • Nationwide GovTech OS</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setPage('admin')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-white font-bold transition-all"
          >
            📋 Operations Database
          </button>
          
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
            <BarChart2 className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-white font-semibold">Analytics Command Mode</span>
          </div>

          <button 
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Command Dashboard Layout */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
        
        {/* TOP ROW: Aggregated metrics cards */}
        <section className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reports</span>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-600 font-bold text-sm">#</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Resolved</span>
              <p className="text-2xl font-extrabold text-gov-emerald mt-1">{stats.resolved}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600">✓</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escalated Inbox</span>
              <p className="text-2xl font-extrabold text-gov-crimson mt-1">{stats.escalated}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 text-red-600">🚨</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spam Blocked</span>
              <p className="text-2xl font-extrabold text-slate-500 mt-1">{stats.spam}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-150 text-slate-400">🛡️</div>
          </div>
        </section>

        {/* MIDDLE ROW LEFT: Map */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Geographic Anomaly Heatmap</h2>
              <p className="text-[11px] text-slate-500">Real-time GPS coordinate mapping of civic incidents in Pune. Dark borders represent clustered incidents.</p>
            </div>
            <div className="h-[350px]">
              <Map incidents={incidents} />
            </div>
          </div>
          
          {/* Predictive risk alerts list */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-gov-crimson animate-bounce" />
              Sarthi AI Predictive Infrastructure Risk Alerts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Machine learning anomaly forecasting pipelines predicting localized utility collapses.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {alerts.map((al, idx) => (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    al.severity === 'High' 
                      ? 'bg-red-50/55 border-red-200 hover:border-red-400' 
                      : 'bg-amber-50/55 border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        al.severity === 'High' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {al.severity} Severity
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 font-mono">{al.ward}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{al.title}</h4>
                    <p className="text-[10px] text-slate-600 mt-1.5 leading-normal">{al.description}</p>
                  </div>
                  
                  <div className="border-t border-slate-200/50 pt-2 flex items-center justify-between text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Sarthi AI Forecast</span>
                    <span className="text-slate-500">72h SLA Window</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MIDDLE ROW RIGHT: Charts & SLA score boards */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* Status Breakdown Doughnut Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold text-slate-800">Grievance Life Cycle Ratio</h2>
            <div className="h-44 relative mt-4">
              <Doughnut data={statusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } } }} />
            </div>
          </div>

          {/* Department SLA performance */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold text-slate-800">Department SLA Performance</h2>
            <div className="h-44 mt-4 relative">
              <Bar data={deptChartData} options={chartOptions} />
            </div>
          </div>

          {/* Ward safety indices */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold text-slate-800">Ward Safety & Health Rating</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Aggregated rating scores based on ticket closure SLAs.</p>
            
            <div className="space-y-3 mt-4">
              {Object.entries(wardScores).map(([wardName, rating]) => (
                <div key={wardName} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-600">{wardName}</span>
                    <span className="text-slate-800">{rating}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        rating >= 85 ? 'bg-emerald-500' : rating >= 70 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${rating}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
