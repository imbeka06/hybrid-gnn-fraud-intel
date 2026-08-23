import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../lib/api';
import {
  Brain,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Users,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

const DECISION_META = {
  AUTO_FREEZE: { label: 'Auto Freeze', color: 'bg-purple-600', text: 'text-purple-400', border: 'border-purple-500' },
  CONFIRMED_FRAUD: { label: 'Confirmed Fraud', color: 'bg-red-600', text: 'text-red-400', border: 'border-red-500' },
  REQUIRE_HUMAN: { label: 'Require Human', color: 'bg-yellow-600', text: 'text-yellow-400', border: 'border-yellow-500' },
  AUTO_CLEARED_SAFE: { label: 'Auto Cleared Safe', color: 'bg-green-600', text: 'text-green-400', border: 'border-green-500' },
  RESOLVED_SAFE: { label: 'Resolved Safe', color: 'bg-teal-600', text: 'text-teal-400', border: 'border-teal-500' },
  RESOLVED_FRAUD: { label: 'Resolved Fraud', color: 'bg-orange-600', text: 'text-orange-400', border: 'border-orange-500' },
};

const RULE_COLORS = {
  red: { badge: 'bg-red-900 text-red-300 border border-red-700', icon: <ShieldX size={20} className="text-red-400" />, pill: 'bg-red-600' },
  green: { badge: 'bg-green-900 text-green-300 border border-green-700', icon: <ShieldCheck size={20} className="text-green-400" />, pill: 'bg-green-600' },
  yellow: { badge: 'bg-yellow-900 text-yellow-300 border border-yellow-700', icon: <AlertTriangle size={20} className="text-yellow-400" />, pill: 'bg-yellow-600' },
  purple: { badge: 'bg-purple-900 text-purple-300 border border-purple-700', icon: <Lock size={20} className="text-purple-400" />, pill: 'bg-purple-600' },
};

function DecisionBadge({ decision }) {
  const meta = DECISION_META[decision] || { label: decision, color: 'bg-gray-600', text: 'text-gray-400', border: 'border-gray-500' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${meta.color} text-white`}>
      {meta.label}
    </span>
  );
}

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

// ─── pipeline step component ─────────────────────────────────────────────────

function PipelineStep({ step, label, sub, icon, isLast }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-gray-700 border border-gray-500 flex items-center justify-center">
          {icon}
        </div>
        {!isLast && <div className="w-px h-8 bg-gray-600 mt-1" />}
      </div>
      <div className="pb-8">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function AIAnalyst() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => { fetchData(); }, []);

  const dc = data?.decision_counts || {};

  return (
    <div className="p-6 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-600">
            <Brain className="text-blue-600" size={26} />
            AI Fraud Analyst — Tier 2 Review Engine
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            After the Stacked Hybrid model (Tier 1) scores a transaction, this analyst applies
            Kenyan M-Pesa business rules to make the final decision — confirming fraud, clearing false
            alarms, or escalating to a human.
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

      {/* ── Pipeline Diagram ── */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-base font-bold mb-5 text-white">How the Pipeline Works</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-0 gap-4">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-900 border border-blue-500 flex items-center justify-center mb-2">
              <Zap size={22} className="text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-white">Tier 1</p>
            <p className="text-xs text-gray-400 mt-0.5">Stacked Hybrid Model</p>
            <p className="text-xs text-gray-500 mt-1">GNN embeddings + XGBoost<br />outputs a risk score 0–1</p>
          </div>

          <ArrowRight size={20} className="text-gray-500 hidden sm:block mx-2" />

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="w-12 h-12 rounded-full bg-indigo-900 border border-indigo-500 flex items-center justify-center mb-2">
              <Brain size={22} className="text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-white">Tier 2</p>
            <p className="text-xs text-gray-400 mt-0.5">AI Analyst Rules Engine</p>
            <p className="text-xs text-gray-500 mt-1">Applies 5 Kenyan M-Pesa<br />behavioral rules</p>
          </div>

          <ArrowRight size={20} className="text-gray-500 hidden sm:block mx-2" />

          {/* Outcomes */}
          <div className="flex flex-col gap-1.5 flex-1">
            {[
              { label: 'AUTO_FREEZE', c: 'bg-purple-700', desc: 'Risk ≥ 85% → frozen instantly' },
              { label: 'CONFIRMED_FRAUD', c: 'bg-red-700', desc: 'Kenyan rule matched → confirmed' },
              { label: 'AUTO_CLEARED_SAFE', c: 'bg-green-700', desc: 'Normal behaviour → cleared' },
              { label: 'REQUIRE_HUMAN', c: 'bg-yellow-700', desc: 'Ambiguous → analyst reviews' },
            ].map(({ label, c, desc }) => (
              <div key={label} className={`${c} rounded px-3 py-1.5 flex items-center justify-between`}>
                <span className="text-xs font-semibold text-white">{label}</span>
                <span className="text-xs text-white/70 ml-2">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live Stats ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Auto Frozen"
            value={dc.AUTO_FREEZE ?? 0}
            sub="Severity ≥ 85%"
            icon={<Lock className="text-purple-400" size={22} />}
            colorClass="border-purple-700"
          />
          <StatCard
            label="Confirmed Fraud"
            value={dc.CONFIRMED_FRAUD ?? 0}
            sub="Rule-matched"
            icon={<ShieldX className="text-red-400" size={22} />}
            colorClass="border-red-700"
          />
          <StatCard
            label="Pending Human Review"
            value={dc.REQUIRE_HUMAN ?? 0}
            sub="Awaiting analyst"
            icon={<Users className="text-yellow-400" size={22} />}
            colorClass="border-yellow-700"
          />
          <StatCard
            label="Auto Cleared Safe"
            value={dc.AUTO_CLEARED_SAFE ?? 0}
            sub="False alarms removed"
            icon={<ShieldCheck className="text-green-400" size={22} />}
            colorClass="border-green-700"
          />
        </div>
      )}

      {/* ── Kenyan Business Rules ── */}
      <div>
        <h2 className="text-base font-bold mb-4 text-gray-900">The 5 Kenyan M-Pesa Business Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(data?.rules ?? []).map((rule) => {
            const rc = RULE_COLORS[rule.color] || RULE_COLORS.yellow;
            const decisionMeta = DECISION_META[rule.decision] || {};
            return (
              <div key={rule.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  {rc.icon}
                  <span className="text-sm font-semibold text-white">Rule {rule.id}: {rule.name}</span>
                </div>
                <p className="text-xs text-gray-400">{rule.description}</p>
                <div className={`text-xs font-mono rounded px-3 py-2 ${rc.badge}`}>
                  {rule.condition}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-gray-500">Decision:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${rc.pill} text-white`}>
                    {rule.decision}
                  </span>
                </div>
              </div>
            );
          })}
          {!data && !loading && (
            <p className="text-sm text-gray-500 col-span-full">Rules load from the backend — start uvicorn to see them.</p>
          )}
        </div>
      </div>

      {/* ── Topology Breakdown (from batch review_queue.csv) ── */}
      {data?.topology_breakdown?.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-1 text-gray-900">Batch Review Queue — Topology Breakdown</h2>
          <p className="text-xs text-gray-600 mb-4">
            Generated from <span className="font-mono">data/processed/review_queue.csv</span> — the output of the last
            stacked_hybrid.py run fed through AI Analyst rules.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-700 text-gray-300 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Fraud Topology</th>
                  <th className="px-4 py-3 text-center">In Queue</th>
                  <th className="px-4 py-3 text-center">Actual Fraud</th>
                  <th className="px-4 py-3 text-center text-green-400">Cleared (False Alarms)</th>
                  <th className="px-4 py-3 text-center text-red-400">Fraud Caught</th>
                  <th className="px-4 py-3 text-center text-yellow-400">Sent to Human</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.topology_breakdown.map((row) => (
                  <tr key={row.topology} className="bg-gray-800 hover:bg-gray-750 transition">
                    <td className="px-4 py-3 font-medium text-white">{row.topology}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{row.total_in_queue}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{row.actual_fraud}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-400 font-semibold">{row.false_alarms_cleared}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-red-400 font-semibold">{row.fraud_caught}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-yellow-400 font-semibold">{row.sent_to_human}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pending Human Review Queue ── */}
      <div>
        <h2 className="text-base font-bold mb-1 text-gray-900">Pending Human Review Queue</h2>
        <p className="text-xs text-gray-600 mb-4">
          Live transactions from SQLite that the AI could not resolve — awaiting analyst decision.
        </p>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg h-14 animate-pulse" />
            ))}
          </div>
        ) : data?.pending_cases?.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
            <CheckCircle2 className="text-green-400 mx-auto mb-3" size={36} />
            <p className="text-sm font-medium text-gray-300">No pending cases right now</p>
            <p className="text-xs text-gray-500 mt-1">The AI Analyst cleared or escalated all transactions in the queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-700 text-gray-300 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Transaction ID</th>
                  <th className="px-4 py-3 text-left">Sender → Receiver</th>
                  <th className="px-4 py-3 text-right">Amount (Ksh)</th>
                  <th className="px-4 py-3 text-center">Risk Score</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-center">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.pending_cases.map((c) => (
                  <tr key={c.id} className="bg-gray-800 hover:bg-gray-750 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.id}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {c.sender} <ArrowRight size={12} className="inline text-gray-500 mx-1" /> {c.receiver}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium">
                      {Number(c.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          c.risk_score >= 70
                            ? 'bg-red-900 text-red-300'
                            : c.risk_score >= 40
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-green-900 text-green-300'
                        }`}
                      >
                        {c.risk_score}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{c.reason}</td>
                    <td className="px-4 py-3 text-center">
                      <DecisionBadge decision={c.decision} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
