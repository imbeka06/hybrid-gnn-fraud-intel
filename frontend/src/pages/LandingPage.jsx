import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, BarChart3, Bell, FileUp, Network, Search, Shield, UserRound } from 'lucide-react';
import './LandingPage.css';

const workspaces = [
  { icon: FileUp, title: 'Transaction analysis', copy: 'Submit a transaction or upload a CSV, PDF, or Word document for structured analysis.', to: '/transactions' },
  { icon: Network, title: 'Fraud network', copy: 'Inspect transaction topology against mapped fraud scenarios and live graph activity.', to: '/network' },
  { icon: BarChart3, title: 'Model comparison', copy: 'Compare XGBoost, GNN, and stacked hybrid results before escalating a case.', to: '/models' },
];

export default function LandingPage() {
  return <div className="product-landing">
    <header className="product-nav">
      <Link to="/" className="product-brand"><Shield size={22} /><span>HYBRID-GNN<br />FRAUD-INTEL</span></Link>
      <nav><a href="#workspace">Platform</a><a href="#models">Models</a><a href="#operations">Operations</a></nav>
      <Link to="/dashboard" className="console-link">Open analyst console <ArrowRight size={16} /></Link>
    </header>
    <main>
      <section className="landing-hero">
        <div className="hero-content">
          <div className="system-badge"><span></span> Fraud intelligence workspace</div>
          <h1>Investigate fraud<br /><em>in context.</em></h1>
          <p>Hybrid-GNN Fraud-Intel brings transaction testing, graph analysis, model comparison, and alert review into one analyst workspace.</p>
          <div className="landing-actions"><Link to="/dashboard" className="landing-primary">Open dashboard <ArrowRight size={17} /></Link><Link to="/transactions" className="landing-secondary">Test a transaction</Link></div>
        </div>
        <DashboardPreview />
      </section>
      <section className="landing-status" id="operations"><div><span className="status-light"></span><b>System Status</b><p>All Systems Operational</p></div><div><b>Three model perspectives</b><p>Baseline XGBoost · Graph Neural Network · Stacked Hybrid</p></div><div><b>Graph-aware investigation</b><p>Users, agents, devices, institutions, and transaction relationships</p></div></section>
      <section className="workspace-section" id="workspace"><div className="section-heading"><p>ANALYST WORKSPACE</p><h2>Move from an alert<br />to an informed decision.</h2><span>Every workspace is built around the investigation flow already used by the platform.</span></div><div className="workspace-grid">{workspaces.map(({ icon: Icon, title, copy, to }) => <Link className="workspace-card" to={to} key={title}><div className="workspace-icon"><Icon size={21} /></div><h3>{title}</h3><p>{copy}</p><ArrowRight size={18} /></Link>)}</div></section>
      <section className="models-section" id="models"><div className="models-copy"><p>HYBRID DETECTION</p><h2>One transaction.<br />More than one view.</h2><p>The platform brings tabular features and graph structure together, then shows the evidence behind each model result.</p><Link to="/models">View model analysis <ArrowRight size={16} /></Link></div><div className="model-stack"><Model name="Baseline XGBoost" detail="Engineered transaction features" tag="Tabular signal" number="01" /><Model name="Graph Neural Network" detail="Relationship topology and neighbourhood context" tag="Graph signal" number="02" graph /><Model name="Stacked Hybrid" detail="Combined model perspective" tag="Consensus view" number="03" hybrid /></div></section>
    </main>
    <footer className="product-footer"><div className="product-brand"><Shield size={19} /><span>HYBRID-GNN<br />FRAUD-INTEL</span></div><p>Graph-based fraud intelligence system</p><Link to="/dashboard">Analyst console <ArrowRight size={14} /></Link></footer>
  </div>;
}

function Model({ name, detail, tag, number, graph, hybrid }) { return <div className={`model-card ${graph ? 'graph' : ''} ${hybrid ? 'hybrid' : ''}`}><span>{number}</span><div><b>{name}</b><small>{detail}</small></div><strong>{tag}</strong></div>; }
function PreviewMetric({ icon: Icon, label, value, type }) { return <div className="preview-metric"><div><small>{label}</small><b>{value}</b></div><span className={type}><Icon size={13} /></span></div>; }
function DashboardPreview() { return <div className="console-preview"><div className="preview-side"><Shield size={18} /><i></i><i className="active"></i><i></i><i></i></div><div className="preview-main"><div className="preview-header"><div className="preview-search"><Search size={12} /> Search transactions, users...</div><Bell size={14} /><div className="preview-avatar"><UserRound size={12} /></div></div><div className="preview-body"><div className="preview-title"><div><b>Platform Overview</b><small>Live Database Metrics</small></div><span>LIVE <i></i></span></div><div className="metric-row"><PreviewMetric icon={Activity} label="Total Transactions" value="12,847" type="blue" /><PreviewMetric icon={AlertTriangle} label="Fraud Detected" value="186" type="red" /><PreviewMetric icon={Activity} label="Detection Rate" value="1.45%" type="green" /></div><div className="analysis-row"><div className="activity-card"><b>Transaction Activity (24h)</b><div className="chart-lines"><svg viewBox="0 0 310 90" preserveAspectRatio="none"><path d="M0 72 L36 64 L73 70 L108 37 L145 49 L179 18 L217 32 L257 12 L310 27" /><path className="fraud-path" d="M0 82 L36 78 L73 80 L108 64 L145 69 L179 48 L217 64 L257 51 L310 63" /></svg></div></div><div className="network-card"><b>Live Risk Distribution</b><div className="mini-network"><span className="n1"></span><span className="n2"></span><span className="n3"></span><span className="n4"></span><span className="n5"></span></div></div></div><div className="alert-card"><div><b>Recent Alerts</b><small>Live Database Sync</small></div><div className="alert-line"><code>TXN_00981</code><span>USR_447 → AGT_021</span><strong>92%</strong><em>High</em></div><div className="alert-line"><code>TXN_00980</code><span>USR_120 → USR_804</span><strong>78%</strong><em className="medium">Medium</em></div></div></div></div></div>; }
