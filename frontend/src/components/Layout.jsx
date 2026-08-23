// src/components/Layout.jsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAlerts } from '../context/AlertsContext';
import { Shield, LayoutDashboard, Receipt, Network, Bell, BarChart3, FileText, Settings, User, ShieldAlert, BrainCircuit, Smartphone, Eye } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();

  //Add unread count state + SSE listener
  const {unreadCount, setUnreadCount, toasts} = useAlerts();

   // Reset badge count when analyst visits the Alerts page
  useEffect(() => {
    if (location.pathname === '/alerts') setUnreadCount(0);
  }, [location.pathname]);

  const menuItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Fraud Network', path: '/network', icon: Network },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Models', path: '/models', icon: BarChart3 },
    { name: 'AI Bot', path: '/ai-bot', icon: User },
    { name: 'AI Analyst', path: '/ai-analyst', icon: BrainCircuit },
    { name: 'Watch & Block', path: '/watch-block', icon: Eye },
    { name: 'USSD Simulator', path: '/ussd-sim', icon: Smartphone },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-brandDark text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Shield className="text-brandPrimary mr-3" size={24} />
          <span className="font-bold text-sm tracking-wider">HYBRID-GNN<br/>FRAUD-INTEL</span>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brandPrimary text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <span className="flex items-center">
                      <Icon className="mr-3" size={18} />
                      {item.name}
                    </span>

                    {/* Badge on Alerts sidebar item */}
                    {item.name === 'Alerts' && unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 m-4 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">System Status</p>
          <div className="flex items-center text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
            All Systems Operational
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="w-96">
            <input
              type="text"
              placeholder="Search transactions, users..."
              className="w-full bg-gray-100 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brandPrimary outline-none"
            />
          </div>
          <div className="flex items-center space-x-4">

            {/*  Bell icon with red badge */}
            <div className="relative cursor-pointer">
              <Bell
                className="text-gray-500 hover:text-brandPrimary transition-colors"
                size={20}
                onClick={() => setUnreadCount(0)}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">AI Analyst</p>
                <p className="text-xs text-gray-500">Tier 2 Logic Engine</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-brandPrimary flex items-center justify-center text-white">
                <User size={16} />
              </div>
            </div>
          </div>
        </header>

        {/*Pass liveAlerts down so Alerts.jsx can use them without needing another SSE connection*/}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-8">
          {children}
        </main>
      </div>

      {/*Toast block- now reads from context*/}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="flex items-start gap-3 bg-white border border-red-200 shadow-lg rounded-xl p-4 w-80 animate-slide-in">
            <ShieldAlert size={20} className="text-red-500 mt-0.5 shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-gray-800">New Fraud Alert</p>
              <p className="text-xs text-gray-500 font-mono">{toast.id}</p>
              <p className="text-xs text-gray-600 mt-1">{toast.amount}.<span className="text-red-600 font-semibold">{toast.score}% Risk</span></p>
          </div>  
        </div>
      ))}
    </div>
  </div>
 );
}
