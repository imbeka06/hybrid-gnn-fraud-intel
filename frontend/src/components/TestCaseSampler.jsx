import { useState, useEffect } from 'react';
import { Beaker, BarChart3, Database } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../lib/api';
import { useSampleData } from '../context/SampleDataContext';

export default function TestCaseSampler({ onCaseSelect }) {
  const { loadedSample, clearLoadedSample, checkingStatus } = useSampleData();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('stacked_hybrid');
  const [error, setError] = useState(null);

  // Fetch test cases
  useEffect(() => {
    axios.get(`${API_BASE}/fraud-test-cases`)
      .then(res => {
        setCases(res.data.cases);
        if (res.data.cases.length > 0) {
          setSelectedCase(res.data.cases[0].id);
        }
      })
      .catch(err => console.error('Error fetching test cases:', err));
  }, []);

  const currentCase = cases.find(c => c.id === selectedCase);
  const fraudTypeBreakdown = prediction?.fraud_type_breakdown || [];

  const handleRunTestCases = async () => {
    if (!loadedSample && !currentCase) return;

    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = loadedSample
        ? await axios.post(`${API_BASE}/api/inference/live-sample`, {
            model,
          })
        : await axios.post(`${API_BASE}/api/models/run-live-test`, {
            model,
            case_id: currentCase.id,
            sample: currentCase.data,
          });
      setPrediction(response.data);
      onCaseSelect?.(response.data);
    } catch (err) {
      console.error('Error running live test:', err);
      const detail = err.response?.data?.detail;
      const backendMessage = typeof detail === 'string'
        ? detail
        : detail?.message || (detail?.missing_columns ? `Missing columns: ${detail.missing_columns.join(', ')}` : null);
      setError(backendMessage || (loadedSample
        ? 'Could not run live inference on the loaded sample data.'
        : 'Could not run live test for the selected model and case.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearSamples = async () => {
    setLoading(true);
    setError(null);
    try {
      await clearLoadedSample();
      setPrediction(null);
    } catch (err) {
      console.error('Error clearing samples:', err);
      setError('Could not clear temporary sample data.');
    } finally {
      setLoading(false);
    }
  };

  const getCaseColor = (fraudType) => {
    if (fraudType.includes('Network')) return 'border-purple-200 bg-purple-50';
    if (fraudType.includes('Tabular')) return 'border-orange-200 bg-orange-50';
    return 'border-green-200 bg-green-50';
  };

  const getFraudTypeLabel = (fraudType) => {
    if (fraudType.includes('Network')) return 'Network Fraud';
    if (fraudType.includes('Tabular')) return 'Tabular Fraud';
    return 'Legitimate';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Beaker className="text-brandPrimary" size={24} />
          Test Case Sampler
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Simulate different fraud scenarios and see which models catch them
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Model to Test
          </label>
          <div className="flex gap-2">
            {['xgboost', 'gnn', 'stacked_hybrid'].map((m) => (
              <button
                key={m}
                onClick={() => setModel(m)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  model === m
                    ? 'bg-brandPrimary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {m === 'xgboost' ? 'XGBoost' : m === 'gnn' ? 'GNN' : 'Hybrid'}
              </button>
            ))}
          </div>
          <button
            onClick={handleRunTestCases}
            disabled={(!loadedSample && !currentCase) || loading || checkingStatus}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? 'Running Test Cases...' : loadedSample ? 'Run Test Cases on Loaded Sample' : 'Run Test Cases'}
          </button>
          <button
            onClick={handleClearSamples}
            disabled={!loadedSample || loading}
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear Samples
          </button>
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {loadedSample ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Sample data loaded: {loadedSample.source_name}. Ready for out-of-sample testing.
            <div className="mt-1 text-xs text-emerald-800">
              Rows: {loadedSample.row_count} | Session: {loadedSample.session_id}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No sample data loaded. Go to Transactions, upload a file, then click "Load Sample Transaction".
          </div>
        )}

        {/* Case Selection Grid */}
        {!loadedSample && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Test Case ({cases.length} available)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {cases.map((caseItem) => (
                <button
                  key={caseItem.id}
                  onClick={() => setSelectedCase(caseItem.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedCase === caseItem.id
                      ? 'border-brandPrimary bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${getCaseColor(caseItem.description)}`}
                >
                  <div className="font-bold text-gray-900">{caseItem.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{caseItem.id}</div>
                  <div className="text-xs text-gray-500 mt-1">{caseItem.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Case Details */}
        {currentCase && !loadedSample && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Database size={18} />
              Case Data: {currentCase.name}
            </h3>

            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              {Object.entries(currentCase.data).map(([key, value]) => (
                <div key={key} className="bg-white p-2 rounded border border-gray-200">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-semibold text-gray-900 ml-1">{value}</span>
                </div>
              ))}
            </div>

            {/* Prediction Result */}
            {prediction && !loadedSample && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  prediction.predicted === prediction.true_label
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">
                    Prediction: {prediction.predicted === 1 ? 'FRAUD' : 'LEGITIMATE'}
                  </span>
                  <span className="text-sm font-semibold">
                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {prediction.explanation}
                </div>
                {prediction.topology_explanation && (
                  <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded p-2">
                    {prediction.topology_explanation}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-600">
                  True Label: {prediction.true_label === 1 ? 'FRAUD' : 'LEGITIMATE'} •{' '}
                  {prediction.caught ? 'Caught' : prediction.missed ? 'Missed' : prediction.correct ? '✓ Correct' : '✗ Incorrect'}
                </div>
              </div>
            )}

            {loading && <div className="text-center text-gray-500 text-sm">Running live inference...</div>}
          </div>
        )}

        {prediction && loadedSample && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 size={18} />
              Out-of-Sample Inference Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mb-3">
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="text-gray-600">Rows:</span>
                <span className="font-semibold text-gray-900 ml-1">{prediction.total_samples ?? 0}</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="text-gray-600">Total Fraud Cases:</span>
                <span className="font-semibold text-gray-900 ml-1">{prediction.total_fraud_cases ?? prediction.fraud_rows ?? 0}</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="text-gray-600">Fraud Rows:</span>
                <span className="font-semibold text-gray-900 ml-1">{prediction.fraud_rows ?? 0}</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="text-gray-600">Cases Caught:</span>
                <span className="font-semibold text-emerald-700 ml-1">{prediction.cases_caught_count ?? 0}</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="text-gray-600">Cases Missed:</span>
                <span className="font-semibold text-red-700 ml-1">{prediction.cases_missed_count ?? 0}</span>
              </div>
            </div>
            <div className="text-xs text-gray-700 mb-2 space-y-1">
              <div>Model: {prediction.model} | Zone: {prediction.zone}</div>
              <div>Artifact: {prediction.model_source || 'unknown'}{prediction.artifact_path ? ` | Path: ${prediction.artifact_path}` : ''}</div>
              {prediction.predict_feature_count ? (
                <div>Feature columns sent to predict(): {prediction.predict_feature_count}</div>
              ) : null}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {fraudTypeBreakdown.map((group) => (
                <div key={group.fraud_type} className="rounded border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">{group.fraud_type}</p>
                    <span className="text-xs text-gray-500">Fraud Cases: {group.total_fraud_cases}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">
                      Caught: {group.cases_caught_count}
                    </div>
                    <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-red-800">
                      Missed: {group.cases_missed_count}
                    </div>
                  </div>
                  <div className="text-xs text-gray-700 space-y-1 max-h-24 overflow-auto">
                    {(group.cases_missed || []).slice(0, 2).map((item) => (
                      <div key={`group-missed-${group.fraud_type}-${item.transaction_id}`}>{item.explanation}</div>
                    ))}
                    {(group.cases_missed || []).length === 0 && (group.cases_caught || []).slice(0, 1).map((item) => (
                      <div key={`group-caught-${group.fraud_type}-${item.transaction_id}`}>{item.explanation}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {fraudTypeBreakdown.length === 0 && (
              <div className="rounded border border-gray-200 bg-white p-3 text-xs text-gray-600">
                No fraud-type breakdown was returned for this run.
              </div>
            )}
          </div>
        )}

        {/* Case Info Badge */}
        {currentCase && !loadedSample && (
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-2">Fraud Indicators:</p>
              <ul className="space-y-1">
                {currentCase.network_indicator && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Network-based indicator present
                  </li>
                )}
                {currentCase.tabular_indicator && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Tabular-based indicator present
                  </li>
                )}
                {!currentCase.network_indicator && !currentCase.tabular_indicator && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    No fraud indicators (Legitimate)
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
