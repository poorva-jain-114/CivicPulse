import React, { useState } from 'react';
import { LogOut, Shield, User, Hammer, Users, AlertTriangle, CheckCircle, RefreshCcw, BellRing, Trash } from 'lucide-react';

export default function AdminDashboard({ user, incidents, alerts, onAssign, onEscalate, onLogout, setPage }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'escalated' | 'resolved' | 'spam'
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [assignedOfficer, setAssignedOfficer] = useState('officer_roads');

  // Filter complaints based on status / flags
  const filteredIncidents = incidents.filter(inc => {
    if (activeTab === 'escalated') return inc.escalated === true;
    if (activeTab === 'resolved') return inc.status === 'Resolved' || inc.status === 'Verified';
    if (activeTab === 'spam') return inc.isSpam === true;
    return !inc.isSpam; // 'all' shows all standard non-spam tickets
  });

  const handleSelectIncident = (inc) => {
    setSelectedIncident(inc);
    // Suggest default officer based on department
    if (inc.department.includes('Sanitation') || inc.department.includes('Public Health')) {
      setAssignedOfficer('officer_sanitation');
    } else {
      setAssignedOfficer('officer_roads');
    }
  };

  const handleAssignOfficer = () => {
    if (!selectedIncident) return;
    onAssign(selectedIncident._id || selectedIncident.id, assignedOfficer);
    setSelectedIncident(null);
  };

  const handleSimulateEscalate = () => {
    if (!selectedIncident) return;
    onEscalate(selectedIncident._id || selectedIncident.id);
    // Update selected incident state locally for immediate display
    setSelectedIncident(prev => ({ ...prev, escalated: true }));
  };

  return (
    <div className="flex-grow flex flex-col">
      
      {/* Header */}
      <header className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/30 text-red-400 font-extrabold text-lg">
            WO
          </div>
          <div>
            <h1 className="text-lg font-bold">Civic Pulse</h1>
            <p className="text-[10px] text-slate-400">Ward Officer & Commissioner Supervision Panel • {user.ward}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick link to Analytics Dashboard */}
          <button 
            onClick={() => setPage('analytics')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-white font-bold transition-all"
          >
            📊 Command Dashboard
          </button>
          
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-xs text-white font-semibold">{user.username} (Admin)</span>
          </div>

          <button 
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
        
        {/* Left Side: Incidents Table */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Ward Grievances Database</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage SLA timelines, officer deployment, and cluster parameters.</p>
              </div>
              
              {/* Tab Toggles */}
              <div className="flex flex-wrap gap-1.5">
                {['all', 'escalated', 'resolved', 'spam'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setSelectedIncident(null); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                      activeTab === tab
                        ? 'bg-gov-navy text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'all' ? 'Active Issues' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Incident Rows */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Routed Department</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Assigned Officer</th>
                    <th className="py-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">No grievances found matching this filter scope.</td>
                    </tr>
                  ) : (
                    filteredIncidents.map(inc => (
                      <tr 
                        key={inc._id || inc.id} 
                        className={`hover:bg-slate-50/70 transition-all cursor-pointer ${
                          selectedIncident?._id === inc._id ? 'bg-indigo-50/30' : ''
                        }`}
                        onClick={() => handleSelectIncident(inc)}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-700">{inc.title}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]">{inc.description}</div>
                          {inc.isClusterMaster && inc.confirmations > 1 && (
                            <span className="inline-block bg-indigo-50 text-indigo-700 text-[9px] px-1 rounded mt-0.5 font-semibold">
                              👥 Clustered ({inc.confirmations} Reports)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            inc.priority >= 75 ? 'bg-red-100 text-red-800' : 'text-slate-700'
                          }`}>
                            {inc.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-medium">{inc.department}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.status === 'Verified' || inc.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inc.escalated
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {inc.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono">
                          {inc.assignedOfficer ? `@${inc.assignedOfficer}` : 'Unassigned'}
                        </td>
                        <td className="py-3 px-3">
                          <button 
                            className="text-indigo-600 font-bold hover:underline"
                            onClick={(e) => { e.stopPropagation(); handleSelectIncident(inc); }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </section>

        {/* Right Side: Command Options */}
        <section className="lg:col-span-4">
          {selectedIncident ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5 sticky top-6">
              <div>
                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider block">Oversight Panel</span>
                <h3 className="text-base font-bold text-slate-800">{selectedIncident.title}</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Description: {selectedIncident.description}</p>
              </div>

              {/* Before image display */}
              <div className="rounded-lg overflow-hidden border border-slate-200 h-28 bg-slate-50">
                <img src={selectedIncident.beforeImage} alt="Grievance Scene" className="w-full h-full object-cover" />
              </div>

              {/* Escalated banner if active */}
              {selectedIncident.escalated && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs space-y-1">
                  <h4 className="font-bold flex items-center gap-1">
                    <BellRing className="w-4 h-4 text-red-500 animate-bounce" />
                    SLA Escalation Triggered
                  </h4>
                  <p className="text-[10px] text-slate-600 leading-normal">
                    This ticket has exceeded the 48-hour response threshold. Auto-escalated to Municipal Commissioner. High priority oversight registered.
                  </p>
                </div>
              )}

              {/* Cluster items list */}
              {selectedIncident.isClusterMaster && selectedIncident.confirmations > 1 && (
                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-xs">
                  <span className="font-bold text-indigo-900 block mb-1">Clustered Coordinates</span>
                  <div className="text-[10px] text-slate-600 space-y-1">
                    <p>• Reporting Citizen Coordinates: ({selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude.toFixed(4)})</p>
                    <p>• {selectedIncident.confirmations - 1} secondary neighbor nodes merged within 100-meter radius.</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!selectedIncident.isSpam && selectedIncident.status !== 'Resolved' && selectedIncident.status !== 'Verified' ? (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  {/* Assigment Form */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Field Officer</label>
                    <div className="flex gap-2">
                      <select
                        value={assignedOfficer}
                        onChange={(e) => setAssignedOfficer(e.target.value)}
                        className="flex-grow bg-slate-50 border border-slate-200 text-xs px-2.5 py-2 rounded-xl focus:outline-none"
                      >
                        <option value="officer_roads">Roads Dept: @officer_roads</option>
                        <option value="officer_sanitation">Sanitation Dept: @officer_sanitation</option>
                      </select>
                      <button
                        onClick={handleAssignOfficer}
                        className="bg-gov-navy text-white text-xs px-3.5 py-2 rounded-xl hover:bg-slate-800 transition-all font-semibold active:scale-95"
                      >
                        Deploy
                      </button>
                    </div>
                  </div>

                  {/* Simulate Escalation */}
                  {!selectedIncident.escalated && (
                    <button
                      onClick={handleSimulateEscalate}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs py-2.5 rounded-xl transition-all font-semibold flex items-center justify-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Simulate 48h SLA Escalation
                    </button>
                  )}
                </div>
              ) : selectedIncident.isSpam ? (
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-2">
                  <span className="font-bold text-slate-800 block">AI Spam Guard Block Logs</span>
                  <p className="text-[10px] text-slate-500 italic">"{selectedIncident.brief}"</p>
                  <div className="text-[10px] text-slate-400">Archived automatically to prevent database ingestion congestion.</div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs space-y-1.5">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Resolution Proof Validated
                  </h4>
                  <p className="text-[10px] text-slate-700 leading-normal">
                    <strong>Report:</strong> {selectedIncident.resolutionBrief}<br />
                    <strong>Status:</strong> Works verified by Sarthi computer vision comparison.Original reporter and confirming users points credited.
                  </p>
                  {selectedIncident.afterImage && (
                    <div className="rounded-lg overflow-hidden border border-emerald-100 h-20 bg-slate-50 mt-1">
                      <img src={selectedIncident.afterImage} alt="Resolved Scene" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/50 border-dashed rounded-2xl p-8 text-center flex flex-col justify-center items-center h-64 sticky top-6">
              <Shield className="w-8 h-8 text-slate-300" />
              <h3 className="font-semibold text-slate-700 text-xs mt-2">No Incident Selected</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Click on any row in the grievances database table to inspect coordinate logs, deploy officers, or simulate SLA escalations.</p>
            </div>
          )}
        </section>

      </main>

    </div>
  );
}
