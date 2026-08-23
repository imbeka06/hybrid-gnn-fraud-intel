import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Signal, Wifi, Battery, ChevronDown, ChevronUp } from 'lucide-react';
import API_BASE from '../lib/api';

// ─── localStorage helpers (double-entry wallet ledger) ──────────────────────
// device_id is NOT persisted — it lives in React useRef so it:
//   • resets on every page refresh (new users start clean)
//   • stays the same when "Swap SIM" is clicked (Case Study 4 trap still fires)
const LS = {
  LEDGER_KEY: 'wallet_balances',
  DEFAULT_BALANCE: 500000,
  _readLedger: () => {
    try {
      const raw = localStorage.getItem('wallet_balances');
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  },
  _writeLedger: (ledger) => {
    localStorage.setItem('wallet_balances', JSON.stringify(ledger));
  },
  ensureWallet: (phone) => {
    const key = String(phone || '').trim();
    if (!key) return LS.DEFAULT_BALANCE;
    const ledger = LS._readLedger();
    if (typeof ledger[key] !== 'number' || Number.isNaN(ledger[key])) {
      ledger[key] = LS.DEFAULT_BALANCE;
      LS._writeLedger(ledger);
    }
    return parseFloat(ledger[key].toFixed(2));
  },
  getBalance: (phone) => {
    const key = String(phone || '').trim();
    if (!key) return LS.DEFAULT_BALANCE;
    return LS.ensureWallet(key);
  },
  debitAndCredit: (senderPhone, recipientPhone, amount) => {
    const senderKey = String(senderPhone || '').trim();
    const recipientKey = String(recipientPhone || '').trim();
    const amt = parseFloat(amount || 0);
    const ledger = LS._readLedger();

    if (!senderKey || !recipientKey || Number.isNaN(amt) || amt <= 0) {
      return LS.DEFAULT_BALANCE;
    }

    if (typeof ledger[senderKey] !== 'number' || Number.isNaN(ledger[senderKey])) {
      ledger[senderKey] = LS.DEFAULT_BALANCE;
    }
    if (typeof ledger[recipientKey] !== 'number' || Number.isNaN(ledger[recipientKey])) {
      ledger[recipientKey] = LS.DEFAULT_BALANCE;
    }

    ledger[senderKey] = parseFloat((ledger[senderKey] - amt).toFixed(2));
    ledger[recipientKey] = parseFloat((ledger[recipientKey] + amt).toFixed(2));
    LS._writeLedger(ledger);
    return ledger[senderKey];
  },
};


// ─── Phase constants ──────────────────────────────────────────────────────────
const P = {
  LOGIN: 'LOGIN',
  MENU: 'MENU',
  SEND_RECIPIENT: 'SEND_RECIPIENT',
  SEND_AMOUNT: 'SEND_AMOUNT',
  SEND_PIN: 'SEND_PIN',
  PROCESSING: 'PROCESSING',
  WARN: 'WARN',
  RESULT: 'RESULT',
  BALANCE: 'BALANCE',
  UNAVAILABLE: 'UNAVAILABLE',
};

// ─── Utilities ────────────────────────────────────────────────────────────────
const currentTime = () =>
  new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

const txId = () => 'MPE' + Math.random().toString(36).substr(2, 9).toUpperCase();

const fmtMoney = (n) => 'Ksh ' + Number(n).toLocaleString('en-KE');


// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBar({ time }) {
  return (
    <div className="flex items-center justify-between px-4 py-1 text-white text-xs">
      <span className="font-medium">{time}</span>
      <div className="flex items-center gap-1">
        <Signal size={12} />
        <Wifi size={12} />
        <Battery size={12} />
      </div>
    </div>
  );
}

// ─── USSD Panel (generic screen template) ────────────────────────────────────
// Line prefix conventions:
//   '#text'  → bold heading (green-200)
//   '!text'  → error / red warning
//   ''       → spacer
//   'text'   → normal green line
function USSDPanel({ lines = [], input, onInput, onSend, onBack, placeholder = '', sending = false, inputType = 'text' }) {
  return (
    <div className="p-4 h-full flex flex-col" style={{ fontFamily: 'monospace', color: '#00ff41' }}>
      <div className="text-xs mb-3 pb-2 border-b border-green-900 flex justify-between items-center">
        <span>Safaricom</span>
        <span className="text-green-600">*334#</span>
      </div>
      <div className="flex-1 space-y-1 text-xs overflow-y-auto">
        {lines.map((line, i) => {
          if (line === '') return <div key={i} className="h-2" />;
          if (line.startsWith('!')) return <div key={i} className="text-red-400">{line.slice(1)}</div>;
          if (line.startsWith('#')) return <div key={i} className="text-green-200 font-bold">{line.slice(1)}</div>;
          return <div key={i} className="text-green-400">{line}</div>;
        })}
      </div>
      {input !== undefined && (
        <div className="mt-3">
          <div className="border border-green-800 rounded px-2 py-1 flex items-center gap-2 bg-black/40">
            <span className="text-green-600 text-xs">›</span>
            <input
              autoFocus
              type={inputType}
              value={input}
              onChange={(e) => onInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none text-green-300 text-xs placeholder-green-900"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {onBack && (
              <button
                onClick={onBack}
                className="flex-1 text-xs py-1 border border-green-900 rounded text-green-700 hover:text-green-400 transition"
              >
                Back
              </button>
            )}
            <button
              onClick={onSend}
              disabled={sending}
              className="flex-1 text-xs py-1 bg-green-900 border border-green-700 rounded text-green-300 hover:bg-green-800 transition disabled:opacity-50"
            >
              {sending ? 'Processing…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Processing screen ────────────────────────────────────────────────────────
function ProcessingScreen() {
  return (
    <div className="p-4 h-full flex flex-col items-center justify-center gap-4" style={{ fontFamily: 'monospace', color: '#00ff41' }}>
      <div className="text-xs text-green-600 mb-2">Safaricom · *334#</div>
      <div className="text-2xl animate-pulse">🛡</div>
      <div className="text-sm text-green-300">Screening transaction…</div>
      <div className="text-xs text-green-700 text-center">Hybrid GNN + XGBoost<br />fraud engine running</div>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Developer / Panelist Cheat Sheet ────────────────────────────────────────
const CHEAT_CASES = [
  {
    n: 1,
    title: 'Normal Retail (Baseline)',
    steps: 'Send Ksh 500 to 0711223344.',
    expected: 'Should PASS — balance drops.',
  },
  {
    n: 2,
    title: 'Progressive AML Funnel (Alice)',
    steps:
      'Step 1: Send any amount to Alice (0712354702). Swap SIM → log in as Alice, send money out.\n' +
      'Step 2: Repeat the full loop 2 more times (send to Alice → Alice sends out).\n' +
      'Step 3: Swap back to any account, try to send money TO Alice → ⚠ WARNING friction screen fires.\n' +
      'Step 4: Log in as Alice, try to send money once more → AI permanently blocks Alice & watchlists all her downstream accounts.',
    expected: 'Strikes 1-3: silent watchlist. Strike 4 outgoing: permanent BLOCK + downstream watchlist.',
  },
  {
    n: 3,
    title: 'Mule SIM Swap (Blocklist)',
    steps: 'Send Ksh 1,000 to MULE_123.',
    expected: 'Layer 0 blocks instantly — known fraudster.',
  },
  {
    n: 4,
    title: 'High-Value Wash-Wash (Compliance)',
    steps: 'Send Ksh 150,000 to any number.',
    expected: 'Tier 2 flags for Manual Review.',
  },
  {
    n: 5,
    title: 'Rapid Reversal / Ping-Pong Fraud',
    steps:
      'Step 1: Log in as A (0711000001), send Ksh 5,000 to B (0722000002).\n' +
      'Step 2: Swap SIM → log in as B, send Ksh 5,000 BACK to A within 5 mins → BLOCKED, A watchlisted.\n' +
      'Step 3: Swap SIM → log in as A, send Ksh 5,000 to C (0733000003).\n' +
      'Step 4: Swap SIM → log in as C, send Ksh 5,000 back to A within 5 mins → A permanently BLOCKED.',
    expected: 'Strike 1: reversal blocked, mastermind (A) watchlisted. Strike 2: A permanently blocklisted.',
  },
];

function DevPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 w-full" style={{ maxWidth: 320, margin: '12px auto 0' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs text-gray-500 hover:text-gray-300 hover:border-gray-500 transition"
      >
        <span>🧪 Developer / Test Cases</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-2 bg-gray-950 border border-gray-800 rounded-xl p-3 space-y-3">
          <p className="text-xs text-gray-500 font-mono tracking-wider">PANELIST CHEAT SHEET</p>
          {CHEAT_CASES.map(c => (
            <div key={c.n} className="border border-gray-800 rounded-lg p-2 space-y-1">
              <div className="text-xs font-bold text-gray-300 font-mono">Case {c.n}: {c.title}</div>
              <div className="text-xs text-gray-400 font-mono whitespace-pre-line">↳ {c.steps}</div>
              <div className="text-xs text-green-700 font-mono">✓ {c.expected}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main exportable component ────────────────────────────────────────────────
// Props:
//   prefill — optional { phone, amount } to pre-populate fields and skip to
//             the recipient step (used by the Analyst Dashboard test-cases panel).
export default function USSDPhoneUI({ prefill = null }) {
  const [time] = useState(currentTime);

  // device_id: random per component mount (useRef = no cross-instance sharing).
  // Two phone simulators on the same page each get their own ID.
  // Swap SIM does NOT regenerate it — same ref, new sender → backend flags it.
  const deviceId = useRef('device_' + Math.random().toString(36).substr(2, 9)).current;

  // sender_id: React state only (also cleared on refresh — simulates SIM ejection).
  const [senderId, setSenderIdState] = useState(null);
  // Balance starts at 0 until login tells us which phone to load for.
  const [balance, setBalance] = useState(0);

  // State machine phase — always start at LOGIN on refresh (no active SIM)
  const [phase, setPhase] = useState(() => prefill ? P.SEND_RECIPIENT : P.LOGIN);

  // Input fields
  const [loginInput, setLoginInput] = useState('');
  const [menuInput, setMenuInput] = useState('');
  const [recipient, setRecipient] = useState(prefill?.phone ?? '');
  const [amount, setAmount] = useState(prefill?.amount ?? '');
  const [pin, setPin] = useState('');

  // Feedback
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  // Friction-layer state (ResultCode 2 — watchlist warning)
  const [warnInput, setWarnInput] = useState('');
  const [pendingPayload, setPendingPayload] = useState(null);

  // Load balance for prefill phone if provided
  useEffect(() => {
    if (prefill?.phone) {
      const normalizedPhone = prefill.phone.trim();
      setBalance(LS.getBalance(normalizedPhone));
      setSenderIdState(normalizedPhone);
    }
  }, []);

  // Auto-refresh balance while the balance screen is open.
  // This ensures that if another account sends money to this one while the
  // balance screen is already visible, the figure updates within ~1.5 s.
  useEffect(() => {
    if (phase !== P.BALANCE || !senderId) return;
    const refresh = () => {
      const fresh = LS.getBalance(senderId);
      setBalance(fresh);
    };
    refresh(); // immediate read when entering the screen
    const timer = setInterval(refresh, 1500);
    return () => clearInterval(timer);
  }, [phase, senderId]);

  // ── Identity handlers ────────────────────────────────────────────────────
  const handleLogin = () => {
    const val = loginInput.trim();
    if (!val) { setError('!Please enter a phone number.'); return; }
    // Load this account's persisted balance (defaults to 500,000 for new accounts)
    const acctBalance = LS.getBalance(val);
    setSenderIdState(val);
    setBalance(acctBalance);
    setLoginInput('');
    setError('');
    setPhase(P.MENU);
  };

  const handleSwapSIM = () => {
    // Keep device_id (same ref) but clear sender — new SIM, same physical phone.
    // This is what triggers the shared-device AUTO_FREEZE in Case Study 4.
    setSenderIdState(null);
    setBalance(0);
    setPhase(P.LOGIN);
    setLoginInput('');
    setError('');
    setResult(null);
  };

  // ── Menu handler ─────────────────────────────────────────────────────────
  const handleMenuSelect = () => {
    const opt = menuInput.trim();
    setMenuInput('');
    setError('');
    if (opt === '1') setPhase(P.SEND_RECIPIENT);
    else if (opt === '2' || opt === '3' || opt === '4') setPhase(P.UNAVAILABLE);
    else if (opt === '5') {
      setBalance(LS.getBalance(senderId));
      setPhase(P.BALANCE);
    }
    else setError('!Invalid option. Enter 1–5.');
  };

  // ── Core transaction submitter (shared by first attempt + override re-submit) ──
  const _submitTransaction = async (payload) => {
    const amt = parseFloat(payload.TransAmount);
    try {
      const res = await axios.post(`${API_BASE}/daraja-webhook`, payload);
      const data = res.data;
      if (data.ResultCode === 2) {
        // Friction layer: backend returned a watchlist warning
        setPendingPayload({ ...payload, override_warning: true });
        setWarnInput('');
        setPhase(P.WARN);
        return;
      }
      if (data.ResultCode === 0) {
        // Use payload values (not stale closure vars) so the ledger keys
        // are exactly what was submitted to the backend.
        const senderKey = senderId;
        const recipientKey = payload.BillRefNumber;
        const newBalance = LS.debitAndCredit(senderKey, recipientKey, amt);
        setBalance(newBalance);
      }
      setResult(data);
      setPhase(P.RESULT);
    } catch {
      setResult({
        ResultCode: 1,
        ResultDesc: 'Could not reach Fraud Intel backend. Is the server running?',
        TransID: payload.TransID,
        AIDecision: 'BACKEND_OFFLINE',
        RiskScore: 0,
      });
      setPhase(P.RESULT);
    }
  };

  // ── Send Money flow ──────────────────────────────────────────────────────
  const handleRecipient = () => {
    if (!recipient.trim()) { setError('!Enter a recipient number.'); return; }
    setError('');
    setPhase(P.SEND_AMOUNT);
  };

  const handleAmount = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('!Enter a valid amount.'); return; }
    if (amt > balance) { setError(`!Insufficient funds. Balance: ${fmtMoney(balance)}`); return; }
    setError('');
    setPhase(P.SEND_PIN);
  };

  const handlePin = async () => {
    if (!pin.trim()) { setError('!Enter your M-Pesa PIN.'); return; }
    setError('');
    setPin('');
    setPhase(P.PROCESSING);
    setSending(true);

    const builtPayload = {
      TransID: txId(),
      TransAmount: parseFloat(amount),
      MSISDN: senderId,
      BillRefNumber: recipient.trim(),
      TransTime: new Date().toISOString(),
      device_id: deviceId,
    };
    await _submitTransaction(builtPayload);
    setSending(false);
  };

  const handleWarnResponse = async () => {
    const opt = warnInput.trim();
    setWarnInput('');
    if (opt === '1' && pendingPayload) {
      // User confirmed — re-submit with override_warning: true
      setPhase(P.PROCESSING);
      setSending(true);
      await _submitTransaction(pendingPayload);
      setPendingPayload(null);
      setSending(false);
    } else if (opt === '2') {
      // User cancelled
      setPendingPayload(null);
      backToMenu();
    }
  };

  // ── Shared navigation ────────────────────────────────────────────────────
  const backToMenu = () => {
    setPhase(P.MENU);
    setRecipient('');
    setAmount('');
    setPin('');
    setError('');
    setResult(null);
    setMenuInput('');
  };

  // ── Phase renderer ───────────────────────────────────────────────────────
  const renderPhase = () => {
    switch (phase) {

      case P.LOGIN:
        return (
          <USSDPanel
            lines={[
              '#Welcome to M-Pesa Simulator',
              '',
              'Please enter your phone number',
              'to register your SIM:',
              '',
              error,
            ]}
            input={loginInput}
            onInput={setLoginInput}
            onSend={handleLogin}
            placeholder="e.g. 0712345678"
          />
        );

      case P.MENU:
        return (
          <USSDPanel
            lines={[
              '#Welcome to M-Pesa',
              '',
              '1. Send Money',
              '2. Withdraw Cash',
              '3. Buy Airtime',
              '4. Pay Bill',
              '5. Account Balance',
              '',
              'Enter option:',
              error,
            ]}
            input={menuInput}
            onInput={setMenuInput}
            onSend={handleMenuSelect}
            placeholder="1"
          />
        );

      case P.SEND_RECIPIENT:
        return (
          <USSDPanel
            lines={[
              '#Send Money',
              '',
              'Enter recipient number:',
              '',
              'Format: 0712345678',
              '        254712345678',
              '        +254712345678',
              '',
              error,
            ]}
            input={recipient}
            onInput={setRecipient}
            onSend={handleRecipient}
            onBack={backToMenu}
            placeholder="0712345678"
          />
        );

      case P.SEND_AMOUNT:
        return (
          <USSDPanel
            lines={[
              '#Send Money',
              '',
              `To: ${recipient}`,
              '',
              'Enter amount (Ksh):',
              '',
              `Balance: ${fmtMoney(balance)}`,
              '',
              error,
            ]}
            input={amount}
            onInput={setAmount}
            onSend={handleAmount}
            onBack={() => { setPhase(P.SEND_RECIPIENT); setError(''); }}
            placeholder="500"
          />
        );

      case P.SEND_PIN:
        return (
          <USSDPanel
            lines={[
              '#Confirm Transaction',
              '',
              `Send ${fmtMoney(parseFloat(amount || 0))}`,
              `To: ${recipient}`,
              '',
              'Enter M-Pesa PIN:',
              '',
              error,
            ]}
            input={pin}
            inputType="password"
            onInput={setPin}
            onSend={handlePin}
            onBack={() => { setPhase(P.SEND_AMOUNT); setError(''); }}
            placeholder="••••"
            sending={sending}
          />
        );

      case P.PROCESSING:
        return <ProcessingScreen />;

      case P.WARN:
        return (
          <USSDPanel
            lines={[
              '!⚠ WATCHLIST WARNING',
              '',
              `!Recipient ${recipient}`,
              '!is under fraud investigation.',
              '',
              'Do you wish to proceed?',
              '',
              '1. Yes — Send anyway',
              '2. No  — Cancel & go back',
              '',
            ]}
            input={warnInput}
            onInput={setWarnInput}
            onSend={handleWarnResponse}
            onBack={backToMenu}
            placeholder="1 or 2"
          />
        );

      case P.RESULT: {
        const blocked = result?.ResultCode !== 0;
        const accentColor = blocked ? '#ff4141' : '#00ff41';
        const borderColor = blocked ? '#7f1d1d' : '#14532d';
        const amt = parseFloat(amount || 0);
        return (
          <div className="p-4 h-full flex flex-col" style={{ fontFamily: 'monospace' }}>
            <div className="text-xs mb-3 pb-2 border-b border-gray-800 flex justify-between" style={{ color: '#00ff41' }}>
              <span>Safaricom</span><span className="text-green-600">*334#</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="text-3xl">{blocked ? '🚫' : '✅'}</div>
              <div className="text-sm font-bold" style={{ color: accentColor }}>
                {blocked ? '⚠ TRANSACTION BLOCKED' : '✓ TRANSACTION SUCCESSFUL'}
              </div>
              {!blocked && (
                <div className="text-xs text-green-300 leading-relaxed">
                  {fmtMoney(amt)} sent to {recipient}.<br />
                  New Balance: {fmtMoney(balance)}
                </div>
              )}
              {blocked && (
                <div className="text-xs text-red-400 leading-relaxed px-2">
                  High-Risk Fraud Metrics Detected.<br />
                  Your transaction was blocked by the AI engine.
                </div>
              )}
              <div className="w-full mt-1 border rounded p-3 text-left space-y-1" style={{ borderColor }}>
                <div className="text-xs text-gray-600">Transaction ID</div>
                <div className="text-xs text-green-400 break-all">{result?.TransID}</div>
                <div className="text-xs text-gray-600 mt-2">AI Decision</div>
                <div className="text-xs font-bold" style={{ color: accentColor }}>{result?.AIDecision}</div>
                <div className="text-xs text-gray-600 mt-2">Risk Score</div>
                <div className="text-xs" style={{ color: accentColor }}>{result?.RiskScore}%</div>
              </div>
            </div>
            <button
              onClick={backToMenu}
              className="mt-4 w-full text-xs py-2 border border-green-900 rounded text-green-700 hover:text-green-400 hover:border-green-700 transition"
            >
              Back to Main Menu
            </button>
          </div>
        );
      }

      case P.BALANCE:
        return (
          <USSDPanel
            lines={[
              '#M-Pesa Account',
              '',
              `Phone: ${senderId}`,
              '',
              '#Balance:',
              `  ${fmtMoney(balance)}`,
              '',
              '0. Back to Main Menu',
            ]}
            input={menuInput}
            onInput={(v) => setMenuInput(v)}
            onSend={backToMenu}
            onBack={backToMenu}
            placeholder="0"
          />
        );

      case P.UNAVAILABLE:
        return (
          <USSDPanel
            lines={[
              '#M-Pesa',
              '',
              'Service currently unavailable',
              'in simulation.',
              '',
              '0. Back',
            ]}
            input=""
            onInput={() => {}}
            onSend={backToMenu}
            onBack={backToMenu}
            placeholder="0"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative mx-auto" style={{ width: 320 }}>
        <div className="bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-700 p-3 pb-6">
          {/* Notch */}
          <div className="flex justify-center mb-1">
            <div className="w-20 h-5 bg-gray-800 rounded-full flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-600" />
              <div className="w-1 h-1 rounded-full bg-gray-500" />
            </div>
          </div>
          <StatusBar time={time} />
          {/* Screen */}
          <div className="mx-1 rounded-2xl overflow-hidden" style={{ background: '#0a0a12', minHeight: 480 }}>
            {renderPhase()}
          </div>
          {/* Home bar */}
          <div className="flex justify-center mt-3">
            <div className="w-24 h-1 bg-gray-600 rounded-full" />
          </div>
        </div>

        {/* Swap SIM — visible only when a SIM is registered */}
        {senderId && (
          <button
            onClick={handleSwapSIM}
            className="mt-3 w-full text-xs py-2 border border-yellow-900 rounded-xl text-yellow-700 hover:text-yellow-400 hover:border-yellow-600 transition bg-gray-950"
            style={{ fontFamily: 'monospace' }}
          >
            📱 Swap SIM Card
          </button>
        )}
      </div>

      {/* Panelist cheat sheet — collapsible, below the phone */}
      <DevPanel />
    </div>
  );
}

