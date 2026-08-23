import { useState, useEffect } from 'react';
import { useAlerts } from '../context/AlertsContext';
import axios from 'axios';
import API_BASE from '../lib/api';
import { ShieldAlert, CheckCircle, XCircle, Clock, Search, ChevronRight } from 'lucide-react';

export default function Alerts() {
  const { liveAlerts } = useAlerts();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
 
  // Fetch the flagged transactions from our SQLite database
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/dashboard-stats`);
        setAlerts(res.data.alerts);
        if (res.data.alerts.length > 0) {
          setSelectedAlert(res.data.alerts[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

//Merge incoming SSE alerts from context with the initial fetch, ensuring no duplicates and always showing the latest on top
useEffect(() => {
  if (liveAlerts.length === 0) return;
  const newest = liveAlerts[0]; // Layout prepends, so index 0 is always the latest

  setAlerts((prev) => {
    // Guard against duplicates
    if (prev.find((a) => a.id === newest.id)) return prev;
    return [newest, ...prev];
  });

  setSelectedAlert(newest); // Auto-open the new alert in the right panel
}, [liveAlerts]);

  // Simulate an analyst reviewing and resolving the ticket
 const handleResolve = async (id, action) => {
    try {
      // Tell the backend to update the SQLite database
      await axios.post(`${API_BASE}/resolve-alert/${id}?action=${action}`);
      
      // Now remove it from the UI list
      const updatedAlerts = alerts.filter(a => a.id !== id);
      setAlerts(updatedAlerts);
      
      if (updatedAlerts.length > 0) {
        setSelectedAlert(updatedAlerts[0]);
      } else {
        setSelectedAlert(null);
      }
    } catch (err) {
      console.error("Failed to resolve alert in DB:", err);
      alert("Error saving your decision to the database.");
    }
  };
  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fraud Review Queue</h1>
        <p className="text-gray-500">Tier 3 Human Analyst Investigation Portal</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* LEFT COLUMN: The Queue */}
        <div className="w-1/3 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock size={18} className="text-brandPrimary" /> Pending Review
            </h3>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loading ? (
              <p className="text-center text-gray-400 mt-10 animate-pulse">Loading queue...</p>
            ) : alerts.length === 0 ? (
              <div className="text-center mt-10">
                <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
                <p className="text-gray-500 font-medium">Inbox Zero!</p>
                <p className="text-sm text-gray-400">All transactions resolved.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedAlert?.id === alert.id 
                    ? 'border-brandPrimary bg-indigo-50 shadow-sm' 
                    : 'border-gray-100 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-gray-500">{alert.id}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      alert.score > 80 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {alert.score}% Risk
                    </span>
                  </div>
                  <div className="font-medium text-gray-900 text-sm mb-1">{alert.amount}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    {alert.sender} <ChevronRight size={12} /> {alert.receiver}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Ticket Details */}
        <div className="w-2/3 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
          {selectedAlert ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Transaction Investigation</h2>
                  <p className="text-gray-500 font-mono text-sm">{selectedAlert.id}</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleResolve(selectedAlert.id, 'approve')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-green-500 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
                  >
                    <CheckCircle size={18} /> Mark as Safe
                  </button>
                  <button 
                    onClick={() => handleResolve(selectedAlert.id, 'reject')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <XCircle size={18} /> Confirm Fraud
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Sender Entity</p>
                    <p className="font-medium text-gray-900">{selectedAlert.sender}</p>
                    <p className="text-sm text-gray-500 mt-2">Account Age: 1,200 Days</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Receiver Entity</p>
                    <p className="font-medium text-gray-900">{selectedAlert.receiver}</p>
                    <p className="text-sm text-gray-500 mt-2">Account Age: 14 Days</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Search size={18} className="text-brandPrimary" /> Stacked Hybrid Analysis
                  </h3>
                  <div className="space-y-4 p-5 border border-red-100 bg-red-50 rounded-lg">
                    <div className="flex justify-between items-center pb-3 border-b border-red-100">
                      <span className="text-gray-700 font-medium">Meta-Learner Probability</span>
                      <span className="font-bold text-red-600 text-lg">{selectedAlert.score}%</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-red-100">
                      <span className="text-gray-700 font-medium">System Flag</span>
                      <span className="font-bold text-gray-900">{selectedAlert.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium block mb-1">GNN Topological Indicator</span>
                      <span className="text-sm text-gray-600">High velocity fan-in pattern detected. Receiver is connected to 4 known suspicious nodes within 2 hops.</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <ShieldAlert size={64} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">No Ticket Selected</p>
              <p className="text-sm">Select an alert from the queue to begin investigation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}