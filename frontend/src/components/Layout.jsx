import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  LayoutDashboard,
  Box,
  Truck,
  Hammer,
  TrendingUp,
  ClipboardList,
  AlertTriangle,
  LogOut,
  Bell,
  Menu,
  X,
  CreditCard,
  Layers,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const Layout = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Bounce if not logged in
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // Fetch notifications for stock alerts
  const fetchNotifications = async () => {
    if (isAuthenticated) {
      try {
        const res = await api.get('notifications/');
        setNotifications(res.data.results || res.data || []);
        const unread = (res.data.results || res.data || []).filter(n => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error fetching notifications", err);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleMarkAllRead = async () => {
    try {
      await api.post('notifications/mark_all_read/');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`notifications/${id}/mark_read/`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-slate-400 font-display">Verifying Admin Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Box },
    { name: 'Raw Materials', path: '/purchases', icon: Truck },
    { name: 'Daily Production', path: '/production', icon: Hammer },
    { name: 'Sales Register', path: '/sales', icon: TrendingUp },
    { name: 'Credit Ledger', path: '/credit-ledger', icon: BookOpen },
    { name: 'Stock / Inventory', path: '/inventory', icon: Layers },
    { name: 'Expenses Log', path: '/expenses', icon: CreditCard },
    { name: 'Reports Generator', path: '/reports', icon: ClipboardList },
    { name: 'Business Analytics', path: '/analytics', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800/80 sticky top-0 h-screen z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🧱</span>
            <div>
              <h1 className="text-sm font-bold text-orange-500 tracking-wider">KARTIK PAVER</h1>
              <p className="text-[10px] text-slate-500 font-mono">ERP & FACTORY MANAGER</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500">Logged in as</p>
              <p className="text-sm font-semibold text-slate-300">{user?.username}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer for Mobile */}
      <aside className={`lg:hidden fixed top-0 bottom-0 left-0 w-64 bg-slate-900 border-r border-slate-800/80 z-40 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🧱</span>
            <div>
              <h1 className="text-sm font-bold text-orange-500 tracking-wider">KARTIK PAVER</h1>
              <p className="text-[10px] text-slate-500 font-mono">ERP & FACTORY MANAGER</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Admin</p>
              <p className="text-sm font-semibold text-slate-300">{user?.username}</p>
            </div>
            <button
              onClick={() => {
                setSidebarOpen(false);
                logout();
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-6 sticky top-0 z-10 no-print">
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50"
            >
              <Menu size={20} />
            </button>
            
            {/* Page Title */}
            <h2 className="text-lg font-bold text-slate-200 hidden md:block">
              {menuItems.find(item => item.path === location.pathname)?.name || 'Admin Panel'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            
            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 relative transition-all"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-orange-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 py-2 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                      <h3 className="text-xs font-bold text-slate-400 tracking-wider">NOTIFICATIONS</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-orange-500 hover:text-orange-400 font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-500">
                          No alerts or notifications.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`px-4 py-3 border-b border-slate-800/50 flex space-x-3 transition-colors ${
                              n.is_read ? 'opacity-60 bg-transparent' : 'bg-orange-950/10 hover:bg-orange-950/20'
                            }`}
                          >
                            <div className="mt-0.5">
                              {n.type === 'LOW_STOCK' ? (
                                <AlertTriangle size={14} className="text-orange-500" />
                              ) : (
                                <Box size={14} className="text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-300 leading-normal">{n.message}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {!n.is_read && (
                                  <button
                                    onClick={() => handleMarkRead(n.id)}
                                    className="text-[9px] text-orange-500 hover:text-orange-400"
                                  >
                                    Mark read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Stats shortcut */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-300">Factory Active</span>
            </div>
            
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
};

export default Layout;
