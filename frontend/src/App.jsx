import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AlertsProvider } from './context/AlertsContext';
import { SampleDataProvider } from './context/SampleDataContext';
import Layout from './components/Layout';
import Home from './pages/Home'; // t
import Transactions from './pages/Transaction';
import FraudNetwork from './pages/FraudNetwork'; 
import Alerts from './pages/Alerts';
import Models from './pages/Models';
import AIBot from './pages/AIBot';
import AIAnalyst from './pages/AIAnalyst';
import WatchAndBlock from './pages/WatchAndBlock';
import USSDSimulator from './pages/USSDSimulator';
import StandaloneMobile from './pages/StandaloneMobile';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';



function App() {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Layout><Home /></Layout>} />
          <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
          <Route path="/network" element={<Layout><FraudNetwork /></Layout>} />
          <Route path="/alerts" element={<Layout><Alerts /></Layout>} />
          <Route path="/models" element={<Layout><Models /></Layout>} />
          <Route path="/ai-bot" element={<Layout><AIBot /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="*" element={<div>Page under construction</div>} />
      </Routes>
    </Router>
  );
}

export default App;
