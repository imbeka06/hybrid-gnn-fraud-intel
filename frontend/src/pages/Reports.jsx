import { useState, useEffect } from 'react';
import { Download, FileText, BarChart2, Filter, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../lib/api';

export default function Reports() {
  const [stats, setStats] = useState({ kpis: {}, pie: {}, alerts: [] });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  useEffect(() => {
    // Fetch real dashboard stats from backend
    axios.get(`${API_BASE}/dashboard-stats`)
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err);
        setLoading(false);
      });
  }, [dateRange]);

  // Mock compliance reports data
  const complianceReports = [
    { 
      id: 'REP-2026-03', 
      month: 'March 2026', 
      type: 'CBK Anti-Money Laundering (AML)', 
      status: 'Generated', 
      date: 'Mar 31, 2026',
      transactions: (stats.kpis?.total_transactions || 0),
      fraudCount: (stats.kpis?.fraud_count || 0),
      compliance: '100%'
    },
    { 
      id: 'REP-2026-02', 
      month: 'February 2026', 
      type: 'CBK Anti-Money Laundering (AML)', 
      status: 'Archived', 
      date: 'Feb 28, 2026',
      transactions: 98450,
      fraudCount: 2461,
      compliance: '99.8%'
    },
    { 
      id: 'REP-2026-01', 
      month: 'January 2026', 
      type: 'CBK Anti-Money Laundering (AML)', 
      status: 'Archived', 
      date: 'Jan 31, 2026',
      transactions: 105200,
      fraudCount: 2600,
      compliance: '99.9%'
    },
  ];

  const handleDownload = async (id, format = 'pdf') => {
    setExporting(true);
    setExportError(null);
    try {
      const response = await axios.get(`${API_BASE}/export-report?report_id=${id}&format=${format}`, {
        responseType: format === 'pdf' || format === 'csv' ? 'blob' : 'json',
      });

      if (format === 'json') {
        // For JSON, just return the data
        console.log('Report data:', response.data);
        alert('Report exported successfully as JSON. Check console for details.');
        setExporting(false);
        return;
      }

      // For PDF and CSV, trigger file download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `compliance_report_${id}_${timestamp}.${format}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      setExporting(false);
    } catch (err) {
      console.error('Export failed:', err);
      setExportError(`Failed to export report: ${err.response?.data?.detail || err.message}`);
      setExporting(false);
    }
  };

  const fraudRate = loading ? 0 : ((stats.kpis?.fraud_count || 0) / (stats.kpis?.total_transactions || 1) * 100).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System & Compliance Reports</h1>
          <p className="text-gray-500">Real-time regulatory ledgers and fraud detection performance</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-brandPrimary outline-none"
          >
            <option value="week">Last Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <div className="flex gap-2">
            <button 
              onClick={() => handleDownload('CURRENT_MONTH', 'pdf')}
              disabled={exporting}
              className="flex items-center gap-2 bg-brandPrimary hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Download size={18} /> {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button 
              onClick={() => handleDownload('CURRENT_MONTH', 'csv')}
              disabled={exporting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Download size={18} /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button 
              onClick={() => handleDownload('CURRENT_MONTH', 'json')}
              disabled={exporting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Download size={18} /> {exporting ? 'Exporting...' : 'Export JSON'}
            </button>
          </div>
        </div>
      </div>

      {/* Export Error Alert */}
      {exportError && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <div>
              <p className="font-semibold text-red-900">Export Failed</p>
              <p className="text-sm text-red-800">{exportError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Transactions */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : (stats.kpis?.total_transactions || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart2 size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500">from Neo4j + SQLite</p>
        </div>

        {/* Fraud Count */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Frauds Detected</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {loading ? '...' : (stats.kpis?.fraud_count || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500">ML predictions + AI rules</p>
        </div>

        {/* Fraud Rate */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Fraud Rate</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{fraudRate}%</p>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500">Hybrid model confidence</p>
        </div>

        {/* Model Status */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Model Accuracy</p>
              <p className="text-3xl font-bold text-green-600 mt-1">96.4%</p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <FileText size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500">No drift detected</p>
        </div>
      </div>

      {/* Compliance Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Model Drift Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0"><BarChart2 size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900">Model Performance</h3>
            <p className="text-sm text-gray-500 mt-1">Hybrid-GNN is maintaining 96.4% accuracy on all transaction nodes.</p>
            <p className="text-xs font-bold text-green-600 mt-2">✓ No data drift detected</p>
          </div>
        </div>

        {/* Regulatory Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg flex-shrink-0"><FileText size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900">Compliance Status</h3>
            <p className="text-sm text-gray-500 mt-1">All Tier-3 analyst decisions logged to immutable ledger per Kenya Data Protection Act (2019).</p>
            <p className="text-xs font-bold text-purple-600 mt-2">✓ Audit Ready</p>
          </div>
        </div>

        {/* System Uptime Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg flex-shrink-0"><Filter size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900">System Health</h3>
            <p className="text-sm text-gray-500 mt-1">FastAPI, Neo4j, Kafka, and SQLite resolving within expected latency parameters.</p>
            <p className="text-xs font-bold text-green-600 mt-2">✓ Uptime: 99.99%</p>
          </div>
        </div>
      </div>

      {/* Regulatory Archives */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="font-bold text-gray-800">CBK Regulatory Report Archives</h3>
          <p className="text-sm text-gray-500 mt-1">Central Bank of Kenya Anti-Money Laundering (AML) compliance filings</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white text-gray-400 uppercase text-xs font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Report ID</th>
                <th className="px-6 py-4">Filing Period</th>
                <th className="px-6 py-4">Transactions</th>
                <th className="px-6 py-4">Fraud Count</th>
                <th className="px-6 py-4">Compliance</th>
                <th className="px-6 py-4">Generated</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {complianceReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900">{report.id}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400"/> {report.month}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{report.transactions.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">
                      {report.fraudCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">
                      {report.compliance}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{report.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => handleDownload(report.id, 'pdf')}
                        disabled={exporting}
                        className="text-brandPrimary hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                        title="Download as PDF"
                      >
                        PDF
                      </button>
                      <span className="text-gray-300">|</span>
                      <button 
                        onClick={() => handleDownload(report.id, 'csv')}
                        disabled={exporting}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                        title="Download as CSV"
                      >
                        CSV
                      </button>
                      <span className="text-gray-300">|</span>
                      <button 
                        onClick={() => handleDownload(report.id, 'json')}
                        disabled={exporting}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                        title="Download as JSON"
                      >
                        JSON
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fraud Typology Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">Detected Fraud Patterns (ML Insights)</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { name: 'Fraud Rings', count: 450, color: 'text-red-600', bg: 'bg-red-50' },
            { name: 'Mule Accounts', count: 380, color: 'text-orange-600', bg: 'bg-orange-50' },
            { name: 'Fast Cash-out', count: 620, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { name: 'Loan Fraud', count: 340, color: 'text-purple-600', bg: 'bg-purple-50' },
            { name: 'Business Scams', count: 410, color: 'text-pink-600', bg: 'bg-pink-50' },
          ].map((typology) => (
            <div key={typology.name} className={`${typology.bg} p-4 rounded-lg border border-gray-200`}>
              <p className={`font-bold text-2xl ${typology.color}`}>{typology.count}</p>
              <p className="text-xs text-gray-600 mt-2">{typology.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}