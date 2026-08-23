import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../lib/api';
import { MessageCircle, BarChart3, Zap, HelpCircle, BookOpen } from 'lucide-react';

const AI_EXPLAIN_CACHE_KEY = 'aiBot:modelExplanations';

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(AI_EXPLAIN_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
};

export default function AIBot() {
  const modelOptions = ['xgboost', 'gnn', 'stacked_hybrid'];
  const [selectedModel, setSelectedModel] = useState('stacked_hybrid');
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [txExplanation, setTxExplanation] = useState(null);
  const [txLoading, setTxLoading] = useState(false);
  const [explanationCache, setExplanationCache] = useState(() => readCache());
  const requestIdRef = useRef(0);

  const modelStrengths = explanation?.strengths || [];
  const modelWeaknesses = explanation?.weaknesses || [];
  const performanceOnCases = explanation?.performance_on_cases || { caught: 0, missed: 0 };
  const modelAgreement = txExplanation?.model_agreement || {};
  const riskFactors = txExplanation?.risk_factors || [];
  const featureImportance = txExplanation?.feature_importance || [];

  // Fetch model explanation
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const cachedExplanation = explanationCache[selectedModel];

    if (cachedExplanation) {
      setExplanation(cachedExplanation);
      setLoading(false);
    } else {
      setLoading(true);
    }

    axios.get(`${API_BASE}/ai-explain-model/${selectedModel}`)
      .then(res => {
        if (requestId !== requestIdRef.current) return;
        setExplanation(res.data);
        const nextCache = {
          ...readCache(),
          [selectedModel]: res.data,
        };
        localStorage.setItem(AI_EXPLAIN_CACHE_KEY, JSON.stringify(nextCache));
        setExplanationCache(nextCache);
        setLoading(false);
      })
      .catch(err => {
        if (requestId !== requestIdRef.current) return;
        console.error('Error fetching explanation:', err);
        setLoading(false);
      });
  }, [selectedModel]);

  useEffect(() => {
    const cached = readCache();
    modelOptions
      .filter((model) => !cached[model])
      .forEach((model) => {
        axios.get(`${API_BASE}/ai-explain-model/${model}`)
          .then((res) => {
            const nextCache = {
              ...readCache(),
              [model]: res.data,
            };
            localStorage.setItem(AI_EXPLAIN_CACHE_KEY, JSON.stringify(nextCache));
            setExplanationCache(nextCache);
          })
          .catch((err) => {
            console.error(`Error prefetching ${model} explanation:`, err);
          });
      });
  }, []);

  const handleExplainTransaction = async (txId) => {
    if (!txId) return;
    setTxLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/ai/analyst/explain`, {
        transaction_id: txId,
        model: selectedModel,
      });
      setTxExplanation(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <MessageCircle className="text-purple-600" size={32} />
          AI Analyst Explainer
        </h1>
        <p className="text-gray-600 mt-2">
          Get detailed explanations of how models work, why transactions are flagged, and which model to deploy
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Selection (Left Sidebar) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 size={20} />
                Select Model
              </h2>
              <p className="text-xs text-gray-600 mt-1">Learn how each model works</p>
            </div>

            <div className="p-4 space-y-2">
              {[
                { value: 'xgboost', label: '🌳 XGBoost', activeClass: 'bg-orange-100 border-2 border-orange-500 text-orange-900' },
                { value: 'gnn', label: '🔗 GNN', activeClass: 'bg-purple-100 border-2 border-purple-500 text-purple-900' },
                { value: 'stacked_hybrid', label: '⚡ Stacked Hybrid', activeClass: 'bg-green-100 border-2 border-green-500 text-green-900' }
              ].map(model => (
                <button
                  key={model.value}
                  onClick={() => setSelectedModel(model.value)}
                  className={`w-full p-3 rounded-lg text-left font-medium transition-all ${
                    selectedModel === model.value
                      ? model.activeClass
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {model.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Model Explanation (Main Area) */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              Loading explanation...
            </div>
          ) : explanation ? (
            <>
              {/* Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{explanation.model_name}</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">What it does:</p>
                    <p className="text-gray-700">{explanation.what_it_does}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">How it works:</p>
                    <p className="text-gray-700">{explanation.how_it_works}</p>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="text-green-600" size={20} />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {modelStrengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <HelpCircle className="text-red-600" size={20} />
                    Weaknesses
                  </h3>
                  <ul className="space-y-2">
                    {modelWeaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{weakness}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Performance & Use Cases */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Best For</h3>
                  <p className="text-gray-700">{explanation.best_for}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Test Case Performance</h3>
                  <p className="text-sm text-gray-600">
                    Caught: <span className="font-bold text-green-600">{performanceOnCases.caught}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Missed: <span className="font-bold text-red-600">{performanceOnCases.missed}</span>
                  </p>
                </div>
              </div>

              {/* Improvement Tips */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="text-indigo-600" size={20} />
                  How to Improve This Model
                </h3>
                <p className="text-gray-700">{explanation.improvement_tips}</p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Transaction Explainer Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="text-purple-600" size={24} />
          Transaction Explanation
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Enter Transaction ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="TXN_123456"
              value={selectedTransaction || ''}
              onChange={(e) => setSelectedTransaction(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <button
              onClick={() => handleExplainTransaction(selectedTransaction || 'TXN_000')}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
            >
              Explain
            </button>
          </div>
        </div>

        {txLoading && <div className="text-sm text-gray-500">Explaining transaction...</div>}

        {txExplanation && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-2">What the transaction entails</p>
              <p className="text-sm text-gray-700">{txExplanation.what_transaction_entails || txExplanation.summary}</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-2">How the selected model interpreted it</p>
              <p className="text-sm text-gray-700">{txExplanation.model_interpretation || txExplanation.why_flagged}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(modelAgreement).map(([model, explanation_text]) => (
                <div key={model} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 capitalize mb-1">{model.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-700">{explanation_text}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-2">Risk Factors</p>
              <ul className="space-y-1">
                {riskFactors.map((factor, idx) => (
                  <li key={idx} className="text-sm text-gray-700">• {factor}</li>
                ))}
              </ul>
            </div>

            {featureImportance.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-2">Top Model Signals</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {featureImportance.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="bg-white rounded border border-slate-200 px-3 py-2 text-sm">
                      <span className="font-medium text-gray-800">{item.feature}</span>
                      <span className="text-gray-600 ml-2">{(Number(item.importance || 0) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-2">Action Recommended</p>
              {Array.isArray(txExplanation.recommended_actions || txExplanation.next_steps) ? (
                <ul className="space-y-1 text-sm text-gray-700">
                  {(txExplanation.recommended_actions || txExplanation.next_steps).map((step, idx) => (
                    <li key={idx}>• {step}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-700">{txExplanation.recommended_actions || txExplanation.next_steps}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
