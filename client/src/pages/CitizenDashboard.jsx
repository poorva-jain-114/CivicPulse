import React, { useState, useEffect } from 'react';
import { Mic, MicOff, LogOut, Award, PlusCircle, List, Trophy, MapPin, Image as ImageIcon, Send, ThumbsUp, CheckCircle, ShieldAlert, Sun, Moon } from 'lucide-react';
import Map from '../components/Map';

// Preset mock before images for quick testing
const MOCK_IMAGES = [
  { name: '🚧 Pothole', url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=400' },
  { name: '🗑️ Trash Pile', url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=400' },
  { name: '💡 Dark Spot', url: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=400' },
  { name: '💧 Water Leak', url: 'https://images.unsplash.com/photo-1542013936693-8848e574047e?q=80&w=400' }
];

export default function CitizenDashboard({ user, incidents, onCreateComplaint, onUpvote, onLogout, setPage, theme, setTheme }) {
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [beforeImage, setBeforeImage] = useState(MOCK_IMAGES[0].url);
  const [lang, setLang] = useState('en-US');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'my' | 'leaderboard'
  const [speechError, setSpeechError] = useState('');
  const [aiParsingResult, setAiParsingResult] = useState(null);

  // Web Speech API initialization
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsRecording(true);
      setSpeechError('');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setDescription(prev => (prev ? prev + ' ' + transcript : transcript));
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setSpeechError(`Speech error: ${event.error}. Try again or type.`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
  }

  const toggleRecording = () => {
    if (!recognition) {
      setSpeechError('Web Speech API is not supported in this browser. Please type.');
      return;
    }
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleMapClick = (clickLat, clickLng) => {
    setLat(Number(clickLat).toFixed(6));
    setLng(Number(clickLng).toFixed(6));
  };

  // Submit Grievance
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description) return;
    if (!lat || !lng) {
      alert('Please click on the map to pin the incident location coordinates.');
      return;
    }

    setSubmitting(true);
    setAiParsingResult(null);

    const payload = {
      description,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      beforeImage
    };

    const res = await onCreateComplaint(payload);
    setSubmitting(false);

    if (res?.success) {
      setDescription('');
      setLat('');
      setLng('');
      if (res.incident) {
        setAiParsingResult(res);
      }
    }
  };

  // Filter lists
  const myIncidents = incidents.filter(i => i.reportedBy === user.username);
  const activeFeedIncidents = incidents.filter(i => i.isClusterMaster && !i.isSpam);

  // Mock leaderboard ranking
  const leaderboard = [
    { username: 'Amit_Sharma', points: 340, rank: 1, ward: 'Ward 5' },
    { username: 'Priya_Patil', points: 295, rank: 2, ward: 'Ward 5' },
    { username: 'Rahul_Deshmukh', points: 210, rank: 3, ward: 'Ward 5' },
    { username: user.username, points: user.points || 0, rank: 4, ward: user.ward, current: true },
    { username: 'Sneha_Kulkarni', points: 95, rank: 5, ward: 'Ward 5' }
  ].sort((a, b) => b.points - a.points);

  const getReputationBadge = (pts) => {
    if (pts >= 300) return { name: 'Sarthi Champion', color: 'from-amber-500 to-yellow-500 text-white', icon: '🏆' };
    if (pts >= 150) return { name: 'Ward Guardian', color: 'from-purple-500 to-indigo-500 text-white', icon: '🔮' };
    if (pts >= 50) return { name: 'Civic Scout', color: 'from-emerald-500 to-teal-500 text-white', icon: '🛡️' };
    return { name: 'Civic Cadet', color: 'from-slate-400 to-slate-500 text-white', icon: '🔰' };
  };
  const badge = getReputationBadge(user.points || 0);

  return (
    <div className="flex-grow flex flex-col pb-16 md:pb-0">
      
      {/* Top Navbar */}
      <header className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 text-emerald-400 font-extrabold text-lg">
            CP
          </div>
          <div>
            <h1 className="text-lg font-bold">Civic Pulse</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-slate-400">Citizen Portal • {user.ward}</p>
              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-gradient-to-r ${badge.color}`}>
                {badge.icon} {badge.name}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-300 font-semibold">Civic Honor:</span>
            <span className="text-xs text-white font-extrabold">{user.points || 0} pts</span>
          </div>
          
          <button 
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
        
        {/* Left Side: Submit Form */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
                Report Civic Grievance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Sarthi AI automatically detects priority, routes departments, and clusters duplicates.</p>
            </div>

            {/* Voice Assistant Controls */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sarthi Voice Assistant</span>
                <span className="text-[11px] text-slate-600 font-medium">Languages: English, Hindi, Marathi</span>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={lang} 
                  onChange={(e) => setLang(e.target.value)}
                  className="bg-white border border-slate-200 text-xs px-2 py-1 rounded-lg focus:outline-none"
                  disabled={isRecording}
                >
                  <option value="en-US">English</option>
                  <option value="hi-IN">हिन्दी (Hindi)</option>
                  <option value="mr-IN">मराठी (Marathi)</option>
                  <option value="bn-IN">বাংলা (Bengali)</option>
                  <option value="ta-IN">தமிழ் (Tamil)</option>
                  <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
                  <option value="te-IN">తెలుగు (Telugu)</option>
                  <option value="pa-IN">ਪੰਜਾਬੀ (Punjabi)</option>
                </select>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-gov-crimson text-white animate-pulse' 
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                  title={isRecording ? "Stop Recording" : "Record Voice"}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {speechError && (
              <p className="text-[10px] text-gov-crimson font-medium bg-red-50 p-2 rounded-lg border border-red-100">{speechError}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Grievance Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Speak naturally or describe the issue... E.g., 'There are 3 large potholes near City Center School, the traffic is moving very slowly.'"
                  className="w-full min-h-[90px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Pin Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Latitude</label>
                  <input
                    type="text"
                    value={lat}
                    placeholder="Click map"
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none"
                    readOnly
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Longitude</label>
                  <input
                    type="text"
                    value={lng}
                    placeholder="Click map"
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none"
                    readOnly
                    required
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-400" />
                Tap anywhere on the ward map grid to capture GPS coordinates.
              </p>

              {/* Preset images loader */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Grievance Proof Image</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {MOCK_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBeforeImage(img.url)}
                      className={`py-1.5 px-1 rounded-lg border text-[10px] font-semibold text-center transition-all ${
                        beforeImage === img.url 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      {img.name}
                    </button>
                  ))}
                </div>

                {/* Custom Image Upload */}
                <div className="mb-3">
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <span>📁 Upload Custom Photo</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setBeforeImage(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                
                {beforeImage && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100 flex items-center justify-center">
                    <img src={beforeImage} alt="Grievance Proof" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gov-navy text-white text-sm font-semibold py-3 rounded-xl hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Sarthi AI processing payload...' : 'Route Complaint'}
              </button>
            </form>

            {/* AI parsed output presentation */}
            {aiParsingResult && (
              <div className="sarthi-glow bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs space-y-2 mt-2">
                <h3 className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Sarthi AI Parser Feedback
                </h3>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  <strong>Title:</strong> {aiParsingResult.incident.title}<br />
                  <strong>Routed Dept:</strong> {aiParsingResult.incident.department}<br />
                  <strong>Computed Priority:</strong> Score {aiParsingResult.incident.priority}/100<br />
                  <strong>Officer Brief:</strong> {aiParsingResult.incident.brief}
                </p>
                {aiParsingResult.clustered && (
                  <div className="bg-indigo-50 border border-indigo-100 p-2 rounded text-[11px] text-indigo-900 font-medium">
                    ⚠️ Sarthi detected a duplicate within 100 meters. Clustered under ID: <strong>{aiParsingResult.masterId.substring(0,8)}...</strong> (+5 pts awarded)
                  </div>
                )}
              </div>
            )}

          </div>
        </section>

        {/* Right Side: Map & Details Feed */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {/* Map display */}
          <div className="h-[300px] md:h-[350px]">
            <Map 
              incidents={incidents} 
              selectedLat={lat} 
              selectedLng={lng} 
              onMapClick={handleMapClick} 
            />
          </div>

          {/* Feed Tabs content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* Tabs header */}
            <div className="flex border-b border-slate-100 bg-slate-50">
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'feed'
                    ? 'border-emerald-500 text-emerald-600 bg-white font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <List className="w-4 h-4" />
                Localized Feed ({activeFeedIncidents.length})
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'my'
                    ? 'border-emerald-500 text-emerald-600 bg-white font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                My Submissions ({myIncidents.length})
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'leaderboard'
                    ? 'border-emerald-500 text-emerald-600 bg-white font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Ward Leaderboard
              </button>
            </div>

            {/* Tab Panels */}
            <div className="p-4 max-h-[300px] overflow-y-auto min-h-[200px]">
              
              {/* Localized Feed */}
              {activeTab === 'feed' && (
                <div className="space-y-4">
                  {activeFeedIncidents.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">No localized grievances reported in this ward grid.</p>
                  ) : (
                    activeFeedIncidents.map(inc => (
                      <div key={inc._id || inc.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <img src={inc.beforeImage || MOCK_IMAGES[0].url} alt="" className="w-16 h-16 object-cover rounded-lg border border-slate-200 mt-1" />
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-extrabold text-slate-500">{inc.category}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                inc.status === 'Verified' || inc.status === 'Resolved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inc.priority >= 75
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {inc.status}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-700">{inc.title}</h4>
                            <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">{inc.description}</p>
                            
                            {inc.confirmations > 1 && (
                              <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-1 text-[9px] font-medium mt-1">
                                👥 Clustered: {inc.confirmations} citizen confirmations
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col justify-between items-end gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200/60">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-medium">Priority Score</span>
                            <div className="text-sm font-extrabold text-slate-800">{inc.priority}/100</div>
                          </div>
                          
                          {inc.status !== 'Resolved' && inc.status !== 'Verified' ? (
                            <button
                              onClick={() => onUpvote(inc._id || inc.id)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-emerald-400 text-[10px] font-semibold text-slate-700 hover:text-emerald-700 rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              Confirm (+10 pts)
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                              ✓ Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* My Submissions */}
              {activeTab === 'my' && (
                <div className="space-y-4">
                  {myIncidents.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">You have not submitted any civic complaints yet.</p>
                  ) : selectedTicket ? (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 shadow-inner">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-bold text-slate-800">Timeline: {selectedTicket.title}</h4>
                        <button 
                          onClick={() => setSelectedTicket(null)}
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                          ← Back to List
                        </button>
                      </div>
                      
                      <div className="space-y-4 pt-2">
                        {/* 1. Submitted */}
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</div>
                            <div className="w-0.5 h-6 bg-emerald-500"></div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Grievance Submitted</p>
                            <p className="text-[9px] text-slate-400">Successfully filed on regional ward map</p>
                          </div>
                        </div>

                        {/* 2. Sarthi AI routing */}
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</div>
                            <div className="w-0.5 h-6 bg-emerald-500"></div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Sarthi AI Processing</p>
                            <p className="text-[9px] text-slate-400">Routed to: {selectedTicket.department}</p>
                          </div>
                        </div>

                        {/* 3. Dispatched */}
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              selectedTicket.status !== 'Open' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                            }`}>{selectedTicket.status !== 'Open' ? '✓' : '3'}</div>
                            <div className={`w-0.5 h-6 ${selectedTicket.status !== 'Open' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Dispatched</p>
                            <p className="text-[9px] text-slate-400">{selectedTicket.status !== 'Open' ? 'Job accepted by regional ward body' : 'Awaiting department acknowledgement'}</p>
                          </div>
                        </div>

                        {/* 4. Assigned */}
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              selectedTicket.assignedOfficer ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                            }`}>{selectedTicket.assignedOfficer ? '✓' : '4'}</div>
                            <div className={`w-0.5 h-6 ${selectedTicket.assignedOfficer ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Officer Assigned</p>
                            <p className="text-[9px] text-slate-400">{selectedTicket.assignedOfficer ? `Field engineer @${selectedTicket.assignedOfficer} deployed` : 'Awaiting engineer dispatch'}</p>
                          </div>
                        </div>

                        {/* 5. In Progress */}
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              selectedTicket.status === 'Resolved' || selectedTicket.status === 'Verified' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                            }`}>{selectedTicket.status === 'Resolved' || selectedTicket.status === 'Verified' ? '✓' : '5'}</div>
                            <div className={`w-0.5 h-6 ${selectedTicket.status === 'Resolved' || selectedTicket.status === 'Verified' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Resolution In-Progress</p>
                            <p className="text-[9px] text-slate-400">Site updates and clean-up execution active</p>
                          </div>
                        </div>

                        {/* 6. Fixed */}
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              selectedTicket.status === 'Verified' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                            }`}>{selectedTicket.status === 'Verified' ? '✓' : '6'}</div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Fixed & Verified</p>
                            <p className="text-[9px] text-slate-400">{selectedTicket.status === 'Verified' ? 'Sarthi AI computer vision proof comparison complete' : 'Awaiting double-blind resolution checks'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    myIncidents.map(inc => (
                      <div 
                        key={inc._id || inc.id} 
                        onClick={() => setSelectedTicket(inc)}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4 cursor-pointer hover:border-emerald-300 transition-all hover:bg-emerald-50/10"
                      >
                        <div className="flex items-start gap-3">
                          <img src={inc.beforeImage || MOCK_IMAGES[0].url} alt="" className="w-14 h-14 object-cover rounded-lg border border-slate-200 mt-0.5" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400">{inc.category}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                inc.status === 'Verified' || inc.status === 'Resolved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {inc.status}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-700">{inc.title}</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-1">{inc.description}</p>
                            
                            {inc.resolutionBrief && (
                              <p className="text-[9px] text-slate-400 bg-white p-1 rounded border border-slate-100 italic mt-1">
                                Resolution Proof Note: {inc.resolutionBrief}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-[9px] text-indigo-500 font-bold hover:underline">Track Timeline →</span>
                          <span className="text-[9px] text-slate-400">Routed Dept</span>
                          <p className="text-[9px] font-bold text-slate-700 truncate max-w-[120px]">{inc.department}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Leaderboard Panel */}
              {activeTab === 'leaderboard' && (
                <div className="divide-y divide-slate-100">
                  {leaderboard.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${
                        item.current ? 'bg-indigo-50/70 border border-indigo-100 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : idx === 1 
                            ? 'bg-slate-200 text-slate-800' 
                            : idx === 2 
                            ? 'bg-amber-100 text-amber-900' 
                            : 'bg-slate-50 text-slate-500'
                        }`}>
                          {item.rank}
                        </span>
                        <div>
                          <span className="text-xs text-slate-700">{item.username}</span>
                          {item.current && <span className="ml-1.5 text-[9px] font-extrabold uppercase bg-indigo-200 text-indigo-800 px-1 rounded">You</span>}
                          <p className="text-[9px] text-slate-400">{item.ward}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{item.points} points</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </section>

      </main>

      {/* Sticky Bottom Navigation for Mobile-first views */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg md:hidden flex justify-around py-2">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
            activeTab === 'feed' ? 'text-emerald-500' : 'text-slate-400'
          }`}
        >
          <List className="w-5 h-5" />
          Feed
        </button>
        <button 
          onClick={() => setActiveTab('my')}
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
            activeTab === 'my' ? 'text-emerald-500' : 'text-slate-400'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          Report
        </button>
        <button 
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
            activeTab === 'leaderboard' ? 'text-emerald-500' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-5 h-5" />
          Leaderboard
        </button>
      </nav>

    </div>
  );
}
