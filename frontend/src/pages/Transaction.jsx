import { useState } from 'react';
import axios from 'axios';
import API_BASE from '../lib/api';
import { ShieldAlert, ShieldCheck, Activity, Search, Upload, BarChart3, Zap, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useSampleData } from '../context/SampleDataContext';

export default function Transactions() {
  const { setLoadedSample } = useSampleData();

  // State to hold the form data
  const [formData, setFormData] = useState({
    transaction_id: 'TXN_' + Math.floor(Math.random() * 1000000),
    sender_id: 'USER_123',
    receiver_id: 'USER_999',
    amount: 500,
    transactions_last_24hr: 1,
    hour: 14
  });

  // File upload state
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [selectedUploadedTx, setSelectedUploadedTx] = useState(null);
  const [uploadedTxComparison, setUploadedTxComparison] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);

  // State to hold the predictions
  const [prediction, setPrediction] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [apiHealthy, setApiHealthy] = useState(true);

  // Validate form inputs before submission
  const validateFormData = () => {
    const errors = [];
    
    if (!formData.sender_id?.trim()) errors.push('Sender ID is required');
    if (!formData.receiver_id?.trim()) errors.push('Receiver ID is required');
    if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) 
      errors.push('Amount must be a positive number');
    if (isNaN(parseInt(formData.transactions_last_24hr)) || parseInt(formData.transactions_last_24hr) < 0) 
      errors.push('Transaction count must be non-negative');
    if (isNaN(parseInt(formData.hour)) || parseInt(formData.hour) < 0 || parseInt(formData.hour) > 23) 
      errors.push('Hour must be between 0 and 23');
    
    return errors;
  };

  // Parse error response to provide user-friendly messages
  const parseErrorMessage = (err) => {
    let message = 'An error occurred';
    let details = null;

    if (err.code === 'ECONNABORTED') {
      message = 'Request timeout. Backend server may be slow or unresponsive.';
      details = 'Try again or check backend logs';
    } else if (err.response) {
      // API returned an error response
      const status = err.response.status;
      const data = err.response.data;

      if (status === 422) {
        message = 'Invalid input format. Please check your data.';
        details = data.detail?.[0]?.msg || JSON.stringify(data.detail);
      } else if (status === 500) {
        message = 'Backend server error. Please try again later.';
        details = data.detail || 'Contact administrator if problem persists';
      } else if (status === 404) {
        message = 'API endpoint not found. Backend may not be running.';
      } else {
        const detail = data.detail;
        if (typeof detail === 'object' && detail !== null && !Array.isArray(detail)) {
          message = typeof detail.message === 'string' ? detail.message : `Server error: ${status}`;
          if (Array.isArray(detail.missing_columns) && detail.missing_columns.length > 0) {
            details = `Missing columns: ${detail.missing_columns.join(', ')}`;
            if (Array.isArray(detail.received_columns) && detail.received_columns.length > 0) {
              details += `. Received: ${detail.received_columns.join(', ')}`;
            }
          } else {
            details = JSON.stringify(detail);
          }
        } else {
          message = `Server error: ${status}`;
          details = typeof detail === 'string' ? detail : (data.message || JSON.stringify(data));
        }
      }
    } else if (err.request && !err.response) {
      // Request was made but no response received
      message = 'Cannot connect to backend server';
      details = `Is FastAPI running on ${API_BASE}?`;
      setApiHealthy(false);
    } else if (err.message) {
      message = err.message;
    }

    return { message, details };
  };

  // Handle form input changes with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate input as user types
    if (name === 'hour') {
      const numValue = parseInt(value);
      if (value === '' || (numValue >= 0 && numValue <= 23)) {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === 'transactions_last_24hr' || name === 'amount') {
      const numValue = parseFloat(value);
      if (value === '' || numValue >= 0) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Select file locally first, then load it explicitly with "Load Sample Transaction".
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!['csv', 'pdf', 'docx', 'doc'].includes(fileExtension)) {
      setError('Invalid file type. Please upload CSV, PDF, or Word document.');
      setErrorDetails(`Received: ${file.name} (${file.type || 'unknown type'})`);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 10MB.');
      setErrorDetails(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setSelectedUploadFile(file);
    setUploadedFile(null);
    setExtractedTransactions([]);
    setSelectedUploadedTx(null);
    setUploadedTxComparison(null);
    setApiHealthy(true);
  };

  const handleLoadSampleTransaction = async () => {
    if (!selectedUploadFile) {
      setError('Please choose a CSV, PDF, or Word file first.');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', selectedUploadFile);

    try {
      setSampleLoading(true);
      setError(null);
      setErrorDetails(null);

      const response = await axios.post(`${API_BASE}/api/samples/load`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });

      if (!response.data.transactions || response.data.transactions.length === 0) {
        setError('No transactions found in file.');
        setErrorDetails('Please ensure the file contains valid transaction data.');
        return;
      }

      const sampleMeta = response.data.sample_meta || null;
      setUploadedFile(sampleMeta?.source_name || selectedUploadFile.name);
      setExtractedTransactions(response.data.transactions || []);
      setSelectedUploadedTx((response.data.transactions || [])[0] || null);
      if (sampleMeta) {
        setLoadedSample(sampleMeta);
      }
      setApiHealthy(true);
    } catch (err) {
      const { message, details } = parseErrorMessage(err);
      setError(message);
      setErrorDetails(details);
      console.error('Sample load error:', err);
    } finally {
      setSampleLoading(false);
    }
  };

  // Send the transaction to FastAPI with comparison and improved error handling
  const handlePredict = async (e) => {
    e.preventDefault();
    
    // Validate inputs before sending
    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      setError('Please fix the following issues:');
      setErrorDetails(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setPrediction(null);
    setComparison(null);
    
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        transactions_last_24hr: parseInt(formData.transactions_last_24hr),
        hour: parseInt(formData.hour)
      };

      // Get stacked hybrid prediction
      const hybridResponse = await axios.post(`${API_BASE}/predict`, payload, {
        timeout: 30000
      });
      
      if (!hybridResponse.data.risk_score || hybridResponse.data.decision === undefined) {
        throw new Error('Invalid response format from server');
      }
      
      setPrediction(hybridResponse.data);
      setApiHealthy(true);

      // Get model comparison
      try {
        const comparisonResponse = await axios.post(`${API_BASE}/run-transaction-comparison`, payload, {
          timeout: 30000
        });
        if (comparisonResponse.data) {
          setComparison(comparisonResponse.data);
          setShowComparison(true);
        }
      } catch (compErr) {
        // Show warning if comparison fails but prediction succeeded
        console.warn('Comparison failed:', compErr);
        setError('Prediction succeeded but model comparison failed.');
        setErrorDetails('This is non-critical; your fraud score is still valid.');
      }
    } catch (err) {
      const { message, details } = parseErrorMessage(err);
      setError(message);
      setErrorDetails(details);
      console.error('Prediction error:', err);
    }
    setLoading(false);
  };

  // Test selected uploaded transaction through all 3 models with improved error handling
  const handleTestUploadedTransaction = async () => {
    if (!selectedUploadedTx) {
      setError('Please select a transaction first.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setUploadedTxComparison(null);
    
    try {
      // Validate and prepare the transaction data
      const txData = {
        ...selectedUploadedTx,
        amount: parseFloat(selectedUploadedTx.amount),
        transactions_last_24hr: parseInt(selectedUploadedTx.transactions_last_24hr || 1),
        hour: parseInt(selectedUploadedTx.hour || 14),
        transaction_id: selectedUploadedTx.transaction_id || `TXN_${Date.now()}`,
        sender_id: selectedUploadedTx.sender_id || 'UNKNOWN',
        receiver_id: selectedUploadedTx.receiver_id || 'UNKNOWN'
      };

      const comparisonResponse = await axios.post(`${API_BASE}/run-transaction-comparison`, txData, {
        timeout: 30000
      });
      
      if (!comparisonResponse.data) {
        throw new Error('Empty response from comparison endpoint');
      }
      
      setUploadedTxComparison(comparisonResponse.data);
      setApiHealthy(true);
    } catch (err) {
      const { message, details } = parseErrorMessage(err);
      setError(message);
      setErrorDetails(details);
      console.error('Uploaded transaction test error:', err);
    }
    setLoading(false);
  };

  // Helper function to style the badge based on the AI's decision
  const getBadgeStyle = (decision) => {
    if (decision === 'AUTO_CLEARED_SAFE') return 'bg-green-100 text-green-800 border-green-200';
    if (decision === 'REQUIRE_HUMAN') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getModelColor = (score) => {
    if (score > 0.7) return 'text-red-600 bg-red-50';
    if (score > 0.4) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  // Error display component
  const ErrorAlert = ({ message, details, onClose, canRetry = false }) => (
    <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-900">{message}</p>
            {details && <p className="text-sm text-red-800 mt-1">{details}</p>}
            {!apiHealthy && (
              <button
                onClick={() => setApiHealthy(true)}
                className="text-sm text-red-700 underline mt-2 hover:text-red-900"
              >
                Check API again
              </button>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-red-600 hover:text-red-900 flex-shrink-0">
          <X size={18} />
        </button>
      </div>
    </div>
  );

  // Success message component
  const SuccessAlert = ({ message, onClose }) => (
    <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
          <p className="font-semibold text-green-900">{message}</p>
        </div>
        <button onClick={onClose} className="text-green-600 hover:text-green-900 flex-shrink-0">
          <X size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Live Transaction Monitor</h1>
        <p className="text-gray-600">Simulate transactions, extract from files, and compare all 3 models</p>
      </div>

      {/* GLOBAL ERROR ALERT */}
      {error && (
        <ErrorAlert
          message={error}
          details={errorDetails}
          onClose={() => { setError(null); setErrorDetails(null); }}
          canRetry={true}
        />
      )}

      {/* API HEALTH WARNING */}
      {!apiHealthy && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-600" size={20} />
            <div>
              <p className="font-semibold text-yellow-900">Backend API not responding</p>
              <p className="text-sm text-yellow-800">Make sure FastAPI is running: <code className="bg-yellow-100 px-2 py-1 rounded text-xs">python backend/main.py</code></p>
            </div>
          </div>
        </div>
      )}

      {/* FILE UPLOAD SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 border-b pb-4">
          <Upload className="text-blue-600" size={20} /> 
          Extract Transaction Data from File
        </h2>
        
        {sampleLoading && (
          <div className="mb-4 flex items-center gap-2 text-blue-600">
            <Activity size={16} className="animate-spin" />
            <p className="text-sm font-medium">Processing file...</p>
          </div>
        )}
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".csv,.pdf,.docx,.doc"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={sampleLoading}
          />
          <label htmlFor="file-upload" className={`cursor-pointer block ${sampleLoading ? 'opacity-50' : ''}`}>
            <Upload size={32} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-700 font-medium">Upload CSV, PDF, or Word doc</p>
            <p className="text-sm text-gray-500 mt-1">Click to browse or drag and drop (Max 10MB)</p>
          </label>
        </div>

        <button
          onClick={handleLoadSampleTransaction}
          disabled={!selectedUploadFile || sampleLoading}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {sampleLoading ? 'Loading Sample Transaction...' : 'Load Sample Transaction'}
        </button>

        {selectedUploadFile && !uploadedFile && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            File selected: {selectedUploadFile.name}. Click "Load Sample Transaction" to parse and stage it for Zone 2 testing.
          </div>
        )}

        {uploadedFile && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={18} />
              <div>
                <p className="text-sm font-semibold text-green-900">✓ File uploaded: {uploadedFile}</p>
                <p className="text-sm text-green-700">{extractedTransactions.length} records extracted</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TEST UPLOADED TRANSACTIONS SECTION */}
      {extractedTransactions.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 border-b pb-4">
            <Zap className="text-purple-600" size={20} /> 
            Test Uploaded Transactions Through All 3 Models
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transaction Selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Select Transaction to Test</label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {extractedTransactions.map((tx, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedUploadedTx(tx)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      selectedUploadedTx === tx
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-gray-50 hover:border-purple-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-900">
                      KES {parseFloat(tx.amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-600">
                      {tx.sender_id || 'USER_?'} → {tx.receiver_id || 'USER_?'}
                    </p>
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleTestUploadedTransaction}
                disabled={!selectedUploadedTx || loading}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-purple-300"
              >
                {loading ? 'Running Models...' : 'Test Selected Tx'}
              </button>
            </div>

            {/* Results for Uploaded Transaction */}
            <div className="lg:col-span-2">
              {!uploadedTxComparison && !loading && (
                <div className="flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-8 h-full">
                  <div className="text-center">
                    <Activity size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Select a transaction and run it through the models</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center text-purple-600 animate-pulse h-full">
                  <Activity size={40} className="mb-3" />
                  <p className="font-medium text-sm">Running all 3 models...</p>
                </div>
              )}

              {uploadedTxComparison && (
                <div className="space-y-4">
                  {/* Model Scores */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'XGBoost', score: uploadedTxComparison.models?.xgboost?.score },
                      { name: 'GNN', score: uploadedTxComparison.models?.gnn?.score },
                      { name: 'Hybrid', score: uploadedTxComparison.models?.stacked_hybrid?.score }
                    ].map(m => (
                      <div key={m.name} className={`p-4 rounded-lg border-2 ${
                        m.score > 0.7 ? 'border-red-200 bg-red-50' :
                        m.score > 0.4 ? 'border-orange-200 bg-orange-50' :
                        'border-green-200 bg-green-50'
                      }`}>
                        <p className="text-xs font-semibold text-gray-600 mb-1">{m.name}</p>
                        <p className="text-2xl font-bold" style={{
                          color: m.score > 0.7 ? '#dc2626' : m.score > 0.4 ? '#ea580c' : '#16a34a'
                        }}>
                          {(m.score * 100).toFixed(0)}%
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Consensus */}
                  <div className={`p-4 rounded-lg border-l-4 ${
                    uploadedTxComparison.consensus === 'FRAUD'
                      ? 'border-l-red-500 bg-red-50'
                      : 'border-l-green-500 bg-green-50'
                  }`}>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Consensus Verdict</p>
                    <p className={`text-lg font-bold ${
                      uploadedTxComparison.consensus === 'FRAUD'
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {uploadedTxComparison.consensus}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {uploadedTxComparison.models_flagged ?? '?'}/3 models flagged this
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: The Simulator Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 border-b pb-4">
            <Activity className="text-brandPrimary" size={20} /> 
            Simulate Transaction
          </h2>
          
          <form onSubmit={handlePredict} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Ksh)</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleChange} required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Velocity (Last 24h)</label>
                <input type="number" name="transactions_last_24hr" value={formData.transactions_last_24hr} onChange={handleChange} required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
                <input type="text" name="sender_id" value={formData.sender_id} onChange={handleChange} required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receiver ID</label>
                <input type="text" name="receiver_id" value={formData.receiver_id} onChange={handleChange} required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hour of Day</label>
              <input type="number" name="hour" min="0" max="23" value={formData.hour} onChange={handleChange} required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none" />
            </div>
            
            <button type="submit" disabled={loading} 
              className="w-full mt-6 bg-brandPrimary hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-indigo-300">
              {loading ? 'Running Stacked Hybrid Engine...' : 'Process Transaction & Compare Models'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: The AI Results */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 border-b pb-4">
            <Search className="text-brandPrimary" size={20} /> 
            Stacked Hybrid Result
          </h2>
          
          {!prediction && !loading && (
             <div className="flex-1 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-8">
               <div className="text-center">
                 <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                 <p>Waiting for transaction input...</p>
                 <p className="text-xs text-gray-400 mt-2">Enter details and click "Process Transaction"</p>
               </div>
             </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-brandPrimary animate-pulse">
              <Activity size={48} className="mb-4" />
              <p className="font-medium">Running all models...</p>
            </div>
          )}

          {prediction && (
            <div className={`p-6 rounded-lg border-l-4 shadow-sm bg-gray-50 ${
              prediction.decision === 'AUTO_CLEARED_SAFE' ? 'border-l-green-500' : 
              prediction.decision === 'REQUIRE_HUMAN' ? 'border-l-yellow-500' : 'border-l-red-500'
            }`}>
              <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Fraud Risk Score</p>
                  <h3 className="text-3xl font-bold text-gray-900">{(prediction.risk_score * 100).toFixed(1)}%</h3>
                </div>
                {prediction.decision === 'AUTO_CLEARED_SAFE' ? (
                  <ShieldCheck className="text-green-500" size={48} />
                ) : (
                  <ShieldAlert className={prediction.decision === 'AUTO_FREEZE' ? 'text-red-500' : 'text-yellow-500'} size={48} />
                )}
              </div>
              
              <div className="space-y-3">
                <p className="flex items-center gap-2">
                  <strong className="text-gray-700">System Action:</strong> 
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(prediction.decision)}`}>
                    {prediction.decision.replace(/_/g, ' ')}
                  </span>
                </p>
                <p><strong className="text-gray-700">AI Reasoning:</strong> <span className="text-gray-600">{prediction.reason}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODEL COMPARISON SECTION */}
      {comparison && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 border-b pb-4">
            <BarChart3 className="text-purple-600" size={20} />
            All 3 Models Comparison
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {['xgboost', 'gnn', 'stacked_hybrid'].map(model => {
              const modelData = comparison.models[model];
              const riskScore = modelData.score;
              
              return (
                <div key={model} className={`p-6 rounded-lg border-2 ${getModelColor(riskScore).replace('text-', 'border-').replace('bg-', '')}`}>
                  <p className="text-sm font-semibold text-gray-600 mb-2">{modelData.model_name}</p>
                  <div className="text-4xl font-bold mb-2" style={{
                    color: riskScore > 0.7 ? '#dc2626' : riskScore > 0.4 ? '#ea580c' : '#16a34a'
                  }}>
                    {(riskScore * 100).toFixed(1)}%
                  </div>
                  <p className={`text-sm font-bold ${riskScore > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                    {modelData.label}
                  </p>
                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        riskScore > 0.7 ? 'bg-red-600' : riskScore > 0.4 ? 'bg-orange-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${riskScore * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">Consensus</p>
            <p className="text-lg font-bold text-blue-700">{comparison.consensus}</p>
            <p className="text-xs text-blue-600 mt-1">
              {comparison.consensus === 'FRAUD' 
                ? 'Transaction flagged as fraud by majority of models' 
                : 'Transaction appears legitimate across all models'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}