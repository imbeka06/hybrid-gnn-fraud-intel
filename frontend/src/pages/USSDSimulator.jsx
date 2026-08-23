import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import USSDPhoneUI from '../components/USSDPhoneUI';

// ─── Analyst Dashboard wrapper ─────────────────────────────────────────────
// Phone UI on the left, analyst info panels on the right.

const TEST_CASES = [
  { label: 'Normal retail (should pass)',  phone: '0712345678', amount: '500' },
  { label: 'Micro-scam velocity test',     phone: '0700000001', amount: '50' },
  { label: 'High-value compliance flag',   phone: '0722000002', amount: '150000' },
  { label: 'Fuliza drain pattern',         phone: '0711000003', amount: '10000' },
];

export default function USSDSimulator() {
  const [prefill, setPrefill] = useState(null);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Smartphone className="text-green-600" size={26} />
          M-Pesa USSD Simulator
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Simulates a real Safaricom *334# USSD session. Each "Send Money" posts a
          Daraja-format payload to the AI fraud engine and shows the live decision on-screen.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start justify-center">
        {/* Reusable phone component — key forces remount on each test-case prefill */}
        <USSDPhoneUI key={JSON.stringify(prefill)} prefill={prefill} />

        <div className="lg:max-w-sm space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-3">How it works</h2>
            <ol className="space-y-2 text-xs text-gray-600 list-decimal list-inside">
              <li>Enter a recipient phone number and amount</li>
              <li>The simulator packages it as a Safaricom Daraja C2B payload</li>
              <li>POSTs to <code className="bg-gray-100 px-1 rounded">/daraja-webhook</code></li>
              <li><strong>Layer 0</strong> — blocklist pre-check (known fraudsters blocked instantly)</li>
              <li><strong>Tier 1</strong> — GNN + XGBoost hybrid model scores the transaction</li>
              <li><strong>Tier 2</strong> — AI Analyst applies Kenyan M-Pesa business rules</li>
              <li>Daraja <code className="bg-gray-100 px-1 rounded">ResultCode</code> 0 = Accept, 1 = Reject</li>
            </ol>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-3">Test Cases</h2>
            <div className="space-y-2 text-xs">
              {TEST_CASES.map(({ label, phone, amount }) => (
                <button
                  key={label}
                  onClick={() => setPrefill({ phone, amount })}
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
                >
                  <div className="font-medium text-gray-700">{label}</div>
                  <div className="text-gray-400 font-mono">{phone} · Ksh {Number(amount).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
