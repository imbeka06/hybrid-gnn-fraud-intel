import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../lib/api';
import { Eye, ShieldX, CheckCircle2, RefreshCw } from 'lucide-react';

function StatCard({ label, value, sub, icon, colorClass }) {
  return (
    <div className={`bg-gray-800 border ${colorClass} rounded-xl p-5 flex items-start gap-4`}>
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm font-medium text-gray-300">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function WatchAndBlock() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/ai-analyst-summary`);
      setData(res.data);
    } catch (err) {
      setError('Could not connect to the backend. Make sure uvicorn is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-amber-600">
            <Eye className="text-amber-600" size={26} />
            Watch & Block
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Dedicated review surface for entities under observation and entities fully blocked by the fraud engine.
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm bg-gray-800 text-white hover:bg-gray-700 px-3 py-2 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Watchlist Accounts"
            value={data?.watchlist_count ?? 0}
            sub="Downstream entities under active review"
            icon={<Eye className="text-amber-400" size={22} />}
            colorClass="border-amber-700"
          />
          <StatCard
            label="Blocked Accounts"
            value={data?.blocklist_count ?? 0}
            sub="Hard-stopped by fraud rules"
            icon={<ShieldX className="text-red-400" size={22} />}
            colorClass="border-red-700"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h2 className="text-base font-bold mb-1 text-gray-900">Watchlist Review Surface</h2>
          <p className="text-xs text-gray-600 mb-4">
            Downstream accounts linked to suspicious fast-cashout chains. Their next transactions are routed for review.
          </p>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg h-14 animate-pulse" />
              ))}
            </div>
          ) : data?.watchlist?.length === 0 ? (
            <div className="bg-gray-800 border border-amber-700 rounded-xl p-8 text-center">
              <CheckCircle2 className="text-amber-400 mx-auto mb-3" size={36} />
              <p className="text-sm font-medium text-gray-300">No watchlisted accounts yet</p>
              <p className="text-xs text-gray-500 mt-1">Run the mule fan-in then fan-out case to populate this list.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-amber-700">
              <table className="w-full text-sm">
                <thead className="bg-amber-950/50 text-amber-200 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Entity</th>
                    <th className="px-4 py-3 text-left">Linked From</th>
                    <th className="px-4 py-3 text-left">Added On</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {(data?.watchlist ?? []).map((entry, index) => (
                    <tr key={`${entry.entity_id}-${index}`} className="bg-gray-800 hover:bg-gray-750 transition">
                      <td className="px-4 py-3 font-mono text-xs text-white">{entry.entity_id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-amber-300">{entry.source_entity || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{entry.added_on || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{entry.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-base font-bold mb-1 text-gray-900">Blocklist Enforcement Surface</h2>
          <p className="text-xs text-gray-600 mb-4">
            Entities fully blocked by the fraud engine and stopped before normal scoring continues.
          </p>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg h-14 animate-pulse" />
              ))}
            </div>
          ) : data?.blocklist?.length === 0 ? (
            <div className="bg-gray-800 border border-red-700 rounded-xl p-8 text-center">
              <CheckCircle2 className="text-red-400 mx-auto mb-3" size={36} />
              <p className="text-sm font-medium text-gray-300">No blocked entities yet</p>
              <p className="text-xs text-gray-500 mt-1">Blocked mules and confirmed fraudsters will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-red-700">
              <table className="w-full text-sm">
                <thead className="bg-red-950/50 text-red-200 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Entity</th>
                    <th className="px-4 py-3 text-left">Added On</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {(data?.blocklist ?? []).map((entry, index) => (
                    <tr key={`${entry.entity_id}-${index}`} className="bg-gray-800 hover:bg-gray-750 transition">
                      <td className="px-4 py-3 font-mono text-xs text-white">{entry.entity_id}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{entry.added_on || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{entry.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
