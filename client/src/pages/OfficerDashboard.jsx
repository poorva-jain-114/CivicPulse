import React, { useState } from 'react';
import { LogOut, CheckCircle, ArrowRight, ShieldCheck, Image as ImageIcon, Sparkles, User, Hammer, Building, Sun, Moon } from 'lucide-react';
import Map from '../components/Map';

const RESOLUTION_PRESETS = [
  { name: '✅ Patched Road', url: 'https://images.unsplash.com/photo-1599740831464-67252fec2e31?q=80&w=400' },
  { name: '✅ Cleaned Spot', url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=400' },
  { name: '✅ Fixed Streetlight', url: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?q=80&w=400' }
];

export default function OfficerDashboard({ user, incidents, onResolve, onLogout, setPage, theme, setTheme }) {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [afterImage, setAfterImage] = useState(RESOLUTION_PRESETS[0].url);
  const [briefText, setBriefText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Filter incidents for this officer's department
  // If incident.department matches user.department, show it.
  const deptIncidents = incidents.filter(i => i.department === user.department && !i.isSpam);

  const handleStartResolve = (inc) => {
    setSelectedIncident(inc);
    setBriefText(`The team visited the site and resolved the issue. Work complete.`);
    setScanResult(null);
  };

  const executeResolutionWithCV = async () => {
    if (!afterImage || !briefText) {
      alert('Proof image and brief text are required.');
      return;
    }

    setScanning(true);
    setScanResult(null);

    // Simulate 2 seconds of Computer Vision processing
    setTimeout(async () => {
      const payload = {
        afterImage,
        resolutionBrief: briefText
      };

      const res = await onResolve(selectedIncident._id || selectedIncident.id, payload);
      setScanning(false);

      if (res?.success) {
        setScanResult(res.verification);
        // Clear forms after a delay
        setTimeout(() => {
          setSelectedIncident(null);
          setScanResult(null);
        }, 3000);
      }
    }, 2000);
  };

  return (
    <div className="flex-grow flex flex-col">
      {/* Header */}
      <header className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-400 font-extrabold text-lg">
            SO
          </div>
          <div>
            <h1 className="text-lg font-bold">Civic Pulse</h1>
            <p className="text-[10px] text-slate-400">Department Officer Workspace • {user.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme switcher */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
            <User className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-white font-semibold">{user.username}</span>
          </div>

          <button 
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
        
        {/* Left Side: Ticket List */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Hammer className="w-5 h-5 text-amber-500" />
              Assigned Municipal Briefs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">List of open grievances automatically routed to your department.</p>

            <div className="space-y-4 mt-6">
              {deptIncidents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-12">No grievances currently assigned to your department.</p>
              ) : (
                deptIncidents.map(inc => (
                  <div 
                    key={inc._id || inc.id} 
                    className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                      selectedIncident?._id === inc._id 
                        ? 'border-amber-400 bg-amber-50/20 shadow-sm' 
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        inc.status === 'Verified' || inc.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inc.priority >= 75
                          ? 'bg-red-100 text-red-800 animate-pulse'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {inc._id?.substring(0, 8) || inc.id?.substring(0, 8)}</span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{inc.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{inc.description}</p>
                    </div>

                    {/* Sarthi parsed summary */}
                    <div className="bg-slate-100 p-3 rounded-lg border border-slate-200/50">
                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block">Sarthi AI Officer Brief</span>
                      <p className="text-xs text-slate-700 italic mt-0.5 leading-relaxed">"{inc.brief}"</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-medium">Impact priority:</span>
                        <span className={`text-xs font-bold ${inc.priority >= 75 ? 'text-red-600' : 'text-slate-700'}`}>{inc.priority}/100</span>
                      </div>
                      
                      {inc.status !== 'Resolved' && inc.status !== 'Verified' ? (
                        <button
                          onClick={() => handleStartResolve(inc)}
                          className="px-3 py-1.5 bg-gov-navy hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-[0.98]"
                        >
                          Address Grievance
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          ✓ Resolved Proof Logged
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Side: Resolution Proof Form */}
        <section className="lg:col-span-5">
          {selectedIncident ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 sticky top-6">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Workspace Terminal</span>
                <h2 className="text-lg font-bold text-slate-800">Submit Work Proof</h2>
                <p className="text-xs text-slate-500 mt-0.5">For ticket: <strong>{selectedIncident.title}</strong></p>
              </div>

              {/* Before and After display */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100 relative">
                  <img src={selectedIncident.beforeImage} alt="Before" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-[8px] text-white px-1.5 py-0.5 rounded font-bold uppercase">Before</span>
                </div>
                <div className="rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100 relative">
                  <img src={afterImage} alt="After" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-emerald-600 text-[8px] text-white px-1.5 py-0.5 rounded font-bold uppercase">After Fix</span>
                </div>
              </div>

              {/* Map Location GPS tracker */}
              <div className="h-40 rounded-xl overflow-hidden border border-slate-200 relative shadow-sm">
                <Map 
                  incidents={[selectedIncident]} 
                  center={[selectedIncident.latitude, selectedIncident.longitude]} 
                  zoom={15} 
                />
              </div>

              {/* Presets selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Select Resolved Proof Photo</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {RESOLUTION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAfterImage(preset.url)}
                      className={`p-1.5 rounded-lg border text-[10px] font-medium text-center transition-all ${
                        afterImage === preset.url
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* Custom Resolution Image Upload */}
                <div className="mt-2">
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>📁 Upload Custom Resolution Photo</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setAfterImage(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Resolution brief */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Resolution Summary</label>
                <textarea
                  value={briefText}
                  onChange={(e) => setBriefText(e.target.value)}
                  className="w-full min-h-[70px] px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  required
                />
              </div>

              {/* Double-Blind CV scanning layout */}
              {scanning && (
                <div className="sarthi-glow bg-slate-900 text-emerald-400 p-4 rounded-xl text-center space-y-2 border border-slate-800">
                  <Sparkles className="w-5 h-5 mx-auto animate-spin" />
                  <h3 className="text-xs font-bold tracking-wider text-white">SARTHI COMPUTER VISION ACTIVE</h3>
                  <div className="text-[10px] font-mono text-slate-300 space-y-1 text-left max-w-xs mx-auto">
                    <p className="animate-pulse">◌ Scanning before/after profiles...</p>
                    <p className="animate-pulse">◌ Running contour matching algorithms...</p>
                    <p className="animate-pulse">◌ Calculating pixel differences...</p>
                  </div>
                </div>
              )}

              {scanResult && (
                <div className={`p-4 rounded-xl text-xs border ${
                  scanResult.verified 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <h3 className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Double-Blind Verification Result
                  </h3>
                  <p className="text-[11px] font-semibold mt-1">Status: {scanResult.verified ? 'VERIFIED (Work Complete)' : 'FLAGGED'}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Confidence: {scanResult.confidence}% similarity match. {scanResult.details}</p>
                </div>
              )}

              {!scanning && !scanResult && (
                <button
                  onClick={executeResolutionWithCV}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verify Resolution & Resolve
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/50 border-dashed rounded-2xl p-8 text-center flex flex-col justify-center items-center h-64 sticky top-6">
              <Building className="w-8 h-8 text-slate-300" />
              <h3 className="font-semibold text-slate-700 text-xs mt-2">Terminal Offline</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Select an assigned grievance from the municipal list to initiate work resolution proof submission.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
