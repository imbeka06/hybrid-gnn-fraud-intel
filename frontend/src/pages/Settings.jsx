import { useState, useEffect } from 'react';
import { User, Bell, Shield, Database, Mail, Key, Copy, RefreshCw, Lock, Plus, X, Edit2, Check, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Profile State
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  });
  const [profileDirty, setProfileDirty] = useState(false);
  
  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Notification State
  const [toggles, setToggles] = useState({
    highRisk: true,
    daily: true,
    system: false
  });
  
  // Security State
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  
  // Data Retention State
  const [dataRetention, setDataRetention] = useState(7);
  
  // API Keys State
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  
  // Email State
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [editingEmailText, setEditingEmailText] = useState('');
  
  // Email Preferences State
  const [emailPreferences, setEmailPreferences] = useState({
    highRiskAlerts: true,
    dailySummary: true,
    weeklyCompliance: true,
    maintenanceNotifications: false
  });

  // Load all settings on mount
  useEffect(() => {
    loadAllSettings();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadAllSettings = async () => {
    setInitialLoading(true);
    try {
      const [profileRes, notificationsRes, securityRes, dataRetentionRes, emailsRes, apiKeysRes, emailPrefsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/settings/profile`),
        fetch(`${API_BASE_URL}/settings/notifications`),
        fetch(`${API_BASE_URL}/settings/security`),
        fetch(`${API_BASE_URL}/settings/data-retention`),
        fetch(`${API_BASE_URL}/settings/emails`),
        fetch(`${API_BASE_URL}/settings/api-keys`),
        fetch(`${API_BASE_URL}/settings/email-preferences`)
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (notificationsRes.ok) setToggles(await notificationsRes.json());
      if (securityRes.ok) {
        const sec = await securityRes.json();
        setTwoFAEnabled(sec.twoFAEnabled);
      }
      if (dataRetentionRes.ok) {
        const dr = await dataRetentionRes.json();
        setDataRetention(dr.retentionYears);
      }
      if (emailsRes.ok) {
        const data = await emailsRes.json();
        setEmails(data.emails);
      }
      if (apiKeysRes.ok) {
        const data = await apiKeysRes.json();
        setApiKeys(data.apiKeys);
      }
      if (emailPrefsRes.ok) {
        setEmailPreferences(await emailPrefsRes.json());
      }
    } catch (error) {
      showNotification('Failed to load settings', 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  // Profile handlers
  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setProfileDirty(true);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setProfileDirty(false);
        showNotification('Profile saved successfully');
      } else {
        showNotification('Failed to save profile', 'error');
      }
    } catch (error) {
      showNotification('Error saving profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProfile = () => {
    loadAllSettings();
    setProfileDirty(false);
  };

  // Notification handlers
  const handleToggleNotification = async (key) => {
    const newToggles = { ...toggles, [key]: !toggles[key] };
    setToggles(newToggles);
    
    try {
      const res = await fetch(`${API_BASE_URL}/settings/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newToggles)
      });
      if (res.ok) {
        showNotification('Notification settings updated');
      }
    } catch (error) {
      showNotification('Failed to update settings', 'error');
    }
  };

  // 2FA handler
  const handleToggle2FA = async () => {
    const newValue = !twoFAEnabled;
    setTwoFAEnabled(newValue);
    
    try {
      const res = await fetch(`${API_BASE_URL}/settings/security/2fa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFAEnabled: newValue })
      });
      if (res.ok) {
        const status = newValue ? 'enabled' : 'disabled';
        showNotification(`2FA ${status}`);
      }
    } catch (error) {
      showNotification('Failed to update 2FA', 'error');
    }
  };

  // Password handler
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 12) {
      showNotification('Password must be at least 12 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings/security/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      if (res.ok) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showNotification('Password changed successfully');
      } else {
        showNotification('Failed to change password', 'error');
      }
    } catch (error) {
      showNotification('Error changing password', 'error');
    }
    setLoading(false);
  };

  // Data retention handler
  const handleDataRetentionChange = async (value) => {
    const newValue = parseInt(value);
    setDataRetention(newValue);
    
    try {
      const res = await fetch(`${API_BASE_URL}/settings/data-retention`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionYears: newValue })
      });
      if (res.ok) {
        showNotification('Data retention policy updated');
      }
    } catch (error) {
      showNotification('Failed to update retention policy', 'error');
    }
  };

  // Email handlers
  const handleAddEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      showNotification('Please enter a valid email', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      });
      if (res.ok) {
        const data = await res.json();
        setEmails([...emails, data.data]);
        setNewEmail('');
        showNotification('Email added successfully');
      }
    } catch (error) {
      showNotification('Failed to add email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmail = async (emailId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings/emails/${emailId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEmails(emails.filter(e => e.id !== emailId));
        showNotification('Email deleted successfully');
      }
    } catch (error) {
      showNotification('Failed to delete email', 'error');
    }
  };

  const handleUpdateEmail = async (emailId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings/emails/${emailId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editingEmailText })
      });
      if (res.ok) {
        setEmails(emails.map(e => e.id === emailId ? { ...e, email: editingEmailText } : e));
        setEditingEmailId(null);
        showNotification('Email updated successfully');
      }
    } catch (error) {
      showNotification('Failed to update email', 'error');
    }
  };

  const handleSetPrimaryEmail = async (emailId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings/emails/${emailId}/set-primary`, {
        method: 'POST'
      });
      if (res.ok) {
        const updated = emails.map(e => ({
          ...e,
          isPrimary: e.id === emailId
        }));
        setEmails(updated);
        showNotification('Primary email updated');
      }
    } catch (error) {
      showNotification('Failed to update primary email', 'error');
    }
  };

  // Email preferences handlers
  const handleEmailPreferenceChange = async (key) => {
    const newPreferences = { ...emailPreferences, [key]: !emailPreferences[key] };
    setEmailPreferences(newPreferences);
    
    try {
      const res = await fetch(`${API_BASE_URL}/settings/email-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      });
      if (res.ok) {
        showNotification('Email preferences updated');
      }
    } catch (error) {
      showNotification('Failed to update preferences', 'error');
    }
  };

  // API Keys handlers
  const handleGenerateAPIKey = async () => {
    if (!newKeyName) {
      showNotification('Please enter a key name', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys([...apiKeys, data.data]);
        setNewKeyName('');
        showNotification('API key generated successfully');
      }
    } catch (error) {
      showNotification('Failed to generate API key', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAPIKey = async (keyId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings/api-keys/${keyId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setApiKeys(apiKeys.filter(k => k.id !== keyId));
        showNotification('API key deleted successfully');
      }
    } catch (error) {
      showNotification('Failed to delete API key', 'error');
    }
  };

  const handleCopyAPIKey = (key) => {
    navigator.clipboard.writeText(key);
    showNotification('API key copied to clipboard');
  };

  // Data export handler
  const handleDownloadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings/export-data`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showNotification('Data exported successfully');
      }
    } catch (error) {
      showNotification('Failed to export data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Logout all sessions handler
  const handleLogoutAllSessions = async () => {
    if (window.confirm('This will log you out from all sessions. Continue?')) {
      try {
        const res = await fetch(`${API_BASE_URL}/settings/sessions/logout-all`, {
          method: 'POST'
        });
        if (res.ok) {
          showNotification('Signed out from all sessions');
          // In production, redirect to login
        }
      } catch (error) {
        showNotification('Failed to sign out', 'error');
      }
    }
  };

  const menuItems = [
    { name: 'Profile', icon: User },
    { name: 'Notifications', icon: Bell },
    { name: 'Security', icon: Shield },
    { name: 'Data & Privacy', icon: Database },
    { name: 'Email Preferences', icon: Mail },
    { name: 'API Keys', icon: Key },
  ];

  const Notification = () => {
    if (!notification) return null;
    const isError = notification.type === 'error';
    const Icon = isError ? AlertCircle : CheckCircle;
    return (
      <div aria-live="polite" className={`fixed top-4 right-4 z-50 p-4 rounded-lg flex items-center gap-3 ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} border ${isError ? 'border-red-200' : 'border-green-200'}`}>
        <Icon size={20} />
        <span className="font-medium">{notification.message}</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Notification />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your fraud detection system</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* LEFT INTERNAL SIDEBAR */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                    isActive 
                    ? 'bg-indigo-50 text-brandPrimary' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} /> {item.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 space-y-6">
          
          {/* PROFILE TAB */}
          {activeTab === 'Profile' && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Profile Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={profile.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={profile.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={profile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input 
                      type="text" 
                      value={profile.role}
                      onChange={(e) => handleProfileChange('role', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900" 
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={!profileDirty || loading}
                    className="bg-brandPrimary hover:bg-indigo-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? <Loader size={16} className="animate-spin" /> : null}
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={handleCancelProfile}
                    disabled={!profileDirty || loading}
                    className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'Notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                {/* Toggle 1 */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">High-risk transaction alerts</p>
                    <p className="text-sm text-gray-500">Get notified when high-risk transactions are detected</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggleNotification('highRisk')}
                    className={`w-12 h-6 rounded-full transition-colors relative ${toggles.highRisk ? 'bg-brandPrimary' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${toggles.highRisk ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                {/* Toggle 2 */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Daily summary reports</p>
                    <p className="text-sm text-gray-500">Receive daily fraud detection summaries</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggleNotification('daily')}
                    className={`w-12 h-6 rounded-full transition-colors relative ${toggles.daily ? 'bg-brandPrimary' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${toggles.daily ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                {/* Toggle 3 */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">System status updates</p>
                    <p className="text-sm text-gray-500">Get notified about system maintenance and updates</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggleNotification('system')}
                    className={`w-12 h-6 rounded-full transition-colors relative ${toggles.system ? 'bg-brandPrimary' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${toggles.system ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'Security' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield size={20} className="text-brandPrimary" /> Security Settings
              </h2>
              
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-bold text-gray-900 mb-2">Two-Factor Authentication (2FA)</h3>
                  <p className="text-sm text-gray-600 mb-4">Tier 3 Fraud Analysts require 2FA to access highly sensitive financial data containing PII. This prevents unauthorized dashboard access.</p>
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock size={20} className={twoFAEnabled ? 'text-green-600' : 'text-gray-400'} />
                      <span className="font-medium text-gray-900">{twoFAEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <button 
                      onClick={handleToggle2FA}
                      className={`w-14 h-7 rounded-full transition-colors relative ${twoFAEnabled ? 'bg-green-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${twoFAEnabled ? 'left-8' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-bold text-gray-900 mb-2">Password</h3>
                  <p className="text-sm text-gray-600 mb-4">Change your account password. Use at least 12 characters with uppercase, numbers, and symbols.</p>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        maxLength={64}
                        autoComplete="current-password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        maxLength={64}
                        autoComplete="new-password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900"
                        placeholder="Enter new password (min 12 characters)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        maxLength={64}
                        autoComplete="new-password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={handleChangePassword}
                    disabled={!passwordForm.currentPassword || !passwordForm.newPassword || loading}
                    className="bg-indigo-100 hover:bg-indigo-200 disabled:bg-gray-100 text-brandPrimary disabled:text-gray-400 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? <Loader size={16} className="animate-spin" /> : null}
                    Change Password
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Active Sessions</h3>
                  <p className="text-sm text-gray-600 mb-4">Current browser session active since 2026-04-10 14:30</p>
                  <button 
                    type="button"
                    onClick={handleLogoutAllSessions}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Sign Out All Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DATA & PRIVACY TAB */}
          {activeTab === 'Data & Privacy' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Database size={20} className="text-brandPrimary" /> Data & Privacy
              </h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                  <p className="text-sm text-gray-700"><strong>Kenya Data Protection Act (2019):</strong> Financial institutions cannot retain personal data indefinitely. This system enforces automatic deletion policies for regulatory compliance.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Data Retention Policy</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={dataRetention}
                      onChange={(e) => handleDataRetentionChange(e.target.value)}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brandPrimary"
                    />
                    <span className="font-bold text-gray-900 min-w-20">{dataRetention} years</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Automatically delete transaction logs after {dataRetention} years of inactivity.</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-900 mb-2">Privacy Controls</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>✓ Request your data (GDPR-style export)</li>
                    <li>✓ Delete your profile and associated records</li>
                    <li>✓ Opt-out of analytics collection</li>
                  </ul>
                  <button 
                    type="button"
                    onClick={handleDownloadData}
                    disabled={loading}
                    className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                  >
                    {loading ? <Loader size={16} className="animate-spin" /> : null}
                    Download My Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EMAIL PREFERENCES TAB */}
          {activeTab === 'Email Preferences' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Mail size={20} className="text-brandPrimary" /> Email Management
              </h2>
              
              <div className="space-y-6">
                {/* Add New Email */}
                <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                  <p className="text-sm font-bold text-gray-900 mb-3">Add New Email Address</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="analyst@example.com"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddEmail}
                      disabled={loading || !newEmail}
                      className="bg-brandPrimary hover:bg-indigo-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {loading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                      Add
                    </button>
                  </div>
                </div>

                {/* Email List */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-800">Active Email Addresses</p>
                  {emails.map(email => (
                    <div key={email.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 flex-1">
                        {editingEmailId === email.id ? (
                          <input
                            type="email"
                            value={editingEmailText}
                            onChange={(e) => setEditingEmailText(e.target.value)}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900"
                          />
                        ) : (
                          <div>
                            <p className="font-mono text-gray-900 font-medium">{email.email}</p>
                            {email.isPrimary && (
                              <button
                                onClick={() => handleSetPrimaryEmail(email.id)}
                                className="text-xs text-green-600 font-bold hover:underline cursor-pointer"
                              >
                                Primary Email
                              </button>
                            )}
                            {!email.isPrimary && (
                              <button
                                onClick={() => handleSetPrimaryEmail(email.id)}
                                className="text-xs text-gray-500 font-bold hover:text-green-600 hover:underline cursor-pointer"
                              >
                                Set as Primary
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {editingEmailId === email.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateEmail(email.id)}
                              className="text-green-600 hover:text-green-700 font-medium"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingEmailId(null)}
                              className="text-gray-400 hover:text-gray-600 font-medium"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingEmailId(email.id);
                                setEditingEmailText(email.email);
                              }}
                              className="text-brandPrimary hover:text-indigo-700 font-medium"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmail(email.id)}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Email Notification Preferences */}
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-sm font-bold text-gray-800 mb-4">Notification Delivery Preferences</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">High-Risk Transaction Alerts</p>
                        <p className="text-sm text-gray-500">Email sent immediately</p>
                      </div>
                      <button
                        onClick={() => handleEmailPreferenceChange('highRiskAlerts')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${emailPreferences.highRiskAlerts ? 'bg-brandPrimary' : 'bg-gray-200'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${emailPreferences.highRiskAlerts ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Daily Summary Report</p>
                        <p className="text-sm text-gray-500">Sent at 06:00 AM daily</p>
                      </div>
                      <button
                        onClick={() => handleEmailPreferenceChange('dailySummary')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${emailPreferences.dailySummary ? 'bg-brandPrimary' : 'bg-gray-200'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${emailPreferences.dailySummary ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Weekly Compliance Report</p>
                        <p className="text-sm text-gray-500">Sent on Monday mornings</p>
                      </div>
                      <button
                        onClick={() => handleEmailPreferenceChange('weeklyCompliance')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${emailPreferences.weeklyCompliance ? 'bg-brandPrimary' : 'bg-gray-200'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${emailPreferences.weeklyCompliance ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">System Maintenance Notifications</p>
                        <p className="text-sm text-gray-500">Sent 24 hours before maintenance</p>
                      </div>
                      <button
                        onClick={() => handleEmailPreferenceChange('maintenanceNotifications')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${emailPreferences.maintenanceNotifications ? 'bg-brandPrimary' : 'bg-gray-200'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${emailPreferences.maintenanceNotifications ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API KEYS TAB */}
          {activeTab === 'API Keys' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Key size={20} className="text-brandPrimary" /> API Keys
              </h2>
              
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-700"><strong>How It Works:</strong> The Hybrid-GNN is the ML engine. External apps (like the M-Pesa mobile app) use API keys to securely send transaction data to your FastAPI backend for fraud scoring in real-time.</p>
                </div>

                {/* New Key Input */}
                <div className="border border-gray-200 p-4 rounded-lg bg-gray-50 mb-6">
                  <p className="text-sm font-bold text-gray-900 mb-3">Generate New API Key</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Staging API Key"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAPIKey}
                      disabled={loading || !newKeyName}
                      className="bg-brandPrimary hover:bg-indigo-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {loading ? <Loader size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      Generate
                    </button>
                  </div>
                </div>

                {apiKeys.map(key => (
                  <div key={key.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{key.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Created: {key.created} | Last used: {key.lastUsed}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteAPIKey(key.id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded family-mono text-xs text-gray-700">
                      <code className="flex-1 truncate">{key.key}</code>
                      <button
                        onClick={() => handleCopyAPIKey(key.key)}
                        className="hover:text-brandPrimary transition-colors text-gray-500"
                        title="Copy to clipboard"
                      >
                        <Copy size={16} className="cursor-pointer" />
                      </button>
                    </div>
                  </div>
                ))}

                {apiKeys.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Key size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No API keys created yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}