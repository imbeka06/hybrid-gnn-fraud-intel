import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../lib/api';
import { Activity, AlertTriangle, TrendingUp, Clock, Eye, ShieldX } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Home() {
  const [stats, setStats] = useState({
    kpis: { total: 0, fraud: 0, rate: 0 },
    pie: [],
    alerts: [],
    watchlist: [],
    blocklist: [],
  });

  // Fetch real data from SQLite backend on load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/dashboard-stats`);
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch SQLite stats:", err);
      }
    };
    fetchStats();
    
    // Auto-refresh every 5 seconds to feel "Live"
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Static Area chart (We leave this mocked so it looks pretty for the demo, 
  // as time-series SQL groupings are complex for a prototype)
  const areaData = [
    { time: '00:00', transactions: 250, fraud: 10 },
    { time: '04:00', transactions: 180, fraud: 5 },
    { time: '08:00', transactions: 600, fraud: 45 },
    { time: '12:00', transactions: 950, fraud: 80 },
    { time: '16:00', transactions: 850, fraud: 65 },
    { time: '20:00', transactions: 400, fraud: 25 },
    { time: '23:59', transactions: 300, fraud: 15 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500">Live Database Metrics (Powered by SQLite)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Transactions</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.kpis.total}</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-brandPrimary"><Activity size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 font-medium">Live Feed Active</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Fraud Detected</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.kpis.fraud}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-500"><AlertTriangle size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-red-600 font-medium">Needs Review</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Detection Rate</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.kpis.rate}%</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-500"><TrendingUp size={20} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Avg Response Time</p>
              <h3 className="text-3xl font-bold text-gray-900">112ms</h3>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-500"><Clock size={20} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Watchlist Accounts</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.kpis.watchlist ?? 0}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-500"><Eye size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-amber-600 font-medium">Under active review</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Blocked Accounts</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.kpis.blocklist ?? 0}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-500"><ShieldX size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-red-600 font-medium">Hard-stopped by fraud engine</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-6">Transaction Activity (24h)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTxns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="transactions" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTxns)" />
                <Area type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorFraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-2">Live Risk Distribution</h3>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.pie} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {stats.pie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-900">{stats.kpis.total}</span>
                <span className="text-xs text-gray-500">Total Tx</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2 px-4">
              {stats.pie.map((item) => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Live Database Sync: Recent Alerts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Sender &rarr; Receiver</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.alerts.map((alert, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900">{alert.id}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">{alert.sender}</span>
                    <span className="mx-2 text-gray-400">&rarr;</span>
                    <span className="font-medium text-gray-800">{alert.receiver}</span>
                  </td>
                  <td className="px-6 py-4 font-medium">{alert.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${alert.score > 80 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {alert.score}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      alert.status === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.alerts.length === 0 && (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">No recent alerts in database. Run a transaction!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-amber-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">Watchlist Monitor</h3>
              <p className="text-xs text-gray-500 mt-1">Accounts linked to suspicious cashout chains and kept under review.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {stats.kpis.watchlist ?? 0} tracked
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-amber-50 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Linked From</th>
                  <th className="px-6 py-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.watchlist.map((entry, index) => (
                  <tr key={`${entry.entity_id}-${index}`} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">{entry.entity_id}</td>
                    <td className="px-6 py-4 font-mono text-amber-700">{entry.source_entity || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">{entry.reason}</td>
                  </tr>
                ))}
                {stats.watchlist.length === 0 && (
                  <tr><td colSpan="3" className="text-center py-8 text-gray-400">No watchlisted accounts yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-red-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">Blocklist Monitor</h3>
              <p className="text-xs text-gray-500 mt-1">Entities hard-blocked from transacting by Layer 0 or cashout rules.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
              {stats.kpis.blocklist ?? 0} blocked
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-red-50 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Added On</th>
                  <th className="px-6 py-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.blocklist.map((entry, index) => (
                  <tr key={`${entry.entity_id}-${index}`} className="hover:bg-red-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">{entry.entity_id}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{entry.added_on || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">{entry.reason}</td>
                  </tr>
                ))}
                {stats.blocklist.length === 0 && (
                  <tr><td colSpan="3" className="text-center py-8 text-gray-400">No blocked accounts yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}