// src/components/Layout.jsx
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Receipt, Network, Bell, BarChart3, FileText, Settings, User } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();

  const menuItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Fraud Network', path: '/network', icon: Network },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Models', path: '/models', icon: BarChart3 },
    { name: 'AI Bot', path: '/ai-bot', icon: User },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-brandDark text-white flex flex-col">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Shield className="text-brandPrimary mr-3" size={24} />
          <span className="font-bold text-sm tracking-wider">HYBRID-GNN<br/>FRAUD-INTEL</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-brandPrimary text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="mr-3" size={18} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* System Status */}
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
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="w-96">
            <input 
              type="text" 
              placeholder="Search transactions, users..." 
              className="w-full bg-gray-100 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brandPrimary outline-none"
            />
          </div>
          <div className="flex items-center space-x-4">
            <Bell className="text-gray-500 cursor-pointer hover:text-brandPrimary" size={20} />
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

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
