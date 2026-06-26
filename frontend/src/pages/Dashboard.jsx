import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  Layers,
  Hammer,
  TrendingUp,
  Truck,
  CreditCard,
  Percent,
  AlertTriangle,
  History,
  ArrowRight,
  TrendingDown,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('dashboard/summary/');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Could not load dashboard summary. Please ensure backend is running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-200 text-sm flex items-start space-x-3">
        <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />
        <span>{error}</span>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const stats = [
    {
      title: 'Total Available Stock',
      value: `${(data?.total_available_stock || 0).toLocaleString()} units`,
      description: 'Sum of all colors & types',
      icon: Layers,
      color: 'text-blue-500',
      bg: 'bg-blue-950/20 border-blue-900/40',
      action: () => navigate('/inventory')
    },
    {
      title: "Today's Production",
      value: `${(data?.today?.production || 0).toLocaleString()} blocks`,
      description: `MTD: ${(data?.monthly?.production || 0).toLocaleString()}`,
      icon: Hammer,
      color: 'text-orange-500',
      bg: 'bg-orange-950/20 border-orange-900/40',
      action: () => navigate('/production')
    },
    {
      title: "Today's Sales Revenue",
      value: formatCurrency(data?.today?.sales_amount),
      description: `MTD: ${formatCurrency(data?.monthly?.sales_amount)}`,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-950/20 border-green-900/40',
      action: () => navigate('/sales')
    },
    {
      title: "Today's Raw Purchases",
      value: formatCurrency(data?.today?.purchases_amount),
      description: `MTD: ${formatCurrency(data?.monthly?.purchases_amount)}`,
      icon: Truck,
      color: 'text-indigo-500',
      bg: 'bg-indigo-950/20 border-indigo-900/40',
      action: () => navigate('/purchases')
    },
    {
      title: "Today's Factory Expenses",
      value: formatCurrency(data?.today?.expenses_amount),
      description: `MTD: ${formatCurrency(data?.monthly?.expenses_amount)}`,
      icon: CreditCard,
      color: 'text-red-500',
      bg: 'bg-red-950/20 border-red-900/40',
      action: () => navigate('/expenses')
    },
    {
      title: 'Monthly Estimated Profit',
      value: formatCurrency(data?.monthly?.estimated_profit),
      description: `All-time: ${formatCurrency(data?.all_time?.estimated_profit)}`,
      icon: Percent,
      color: data?.monthly?.estimated_profit >= 0 ? 'text-emerald-500' : 'text-rose-500',
      bg: data?.monthly?.estimated_profit >= 0 ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-rose-950/20 border-rose-900/40',
      action: () => navigate('/analytics')
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-orange-500/10 to-transparent -z-10"></div>
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-display">Factory Operations Overview</h2>
          <p className="text-xs text-slate-400 mt-1">Kartik Paver Industries ERP — Latur MIDC Factory Office</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3 text-xs font-mono text-slate-400">
          <span>Date: <strong>17-06-2026</strong></span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">System: <strong>Cloud Connected (PostgreSQL)</strong></span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              onClick={item.action}
              className={`border rounded-2xl p-6 cursor-pointer hover:scale-[1.01] transition-all flex justify-between items-start ${item.bg}`}
            >
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">{item.title}</p>
                <h3 className="text-2xl font-black text-slate-100 font-display">{item.value}</h3>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
              <div className={`p-3 rounded-xl bg-slate-950/50 ${item.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Low Stock Alerts */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold tracking-wider text-slate-300 font-mono uppercase flex items-center space-x-2">
              <AlertTriangle className="text-orange-500" size={16} />
              <span>Low Stock Alerts</span>
            </h3>
            {data?.low_stock_alerts?.length > 0 && (
              <span className="px-2 py-0.5 bg-orange-950/40 border border-orange-900/50 rounded text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                {data.low_stock_alerts.length} Warnings
              </span>
            )}
          </div>

          {data?.low_stock_alerts?.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <span className="text-3xl">✅</span>
              <p className="mt-2 text-sm text-slate-500">All products have healthy stock levels.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest">
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Color</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-right">Current Stock</th>
                    <th className="pb-3 text-right">Min. Threshold</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {data?.low_stock_alerts?.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-950/20">
                      <td className="py-3 font-semibold text-slate-300">{alert.name}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ 
                            backgroundColor: alert.color.toLowerCase() === 'grey' ? '#6b7280' : 
                                            alert.color.toLowerCase() === 'red' ? '#ef4444' : 
                                            alert.color.toLowerCase() === 'yellow' ? '#eab308' : '#cbd5e1'
                          }}></span>
                          <span>{alert.color}</span>
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{alert.category}</td>
                      <td className="py-3 text-right font-black text-orange-400">{alert.current_stock.toLocaleString()}</td>
                      <td className="py-3 text-right text-slate-500">{alert.threshold.toLocaleString()}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/20 text-red-400 border border-red-900/30">
                          Low Stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activities Logs */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold tracking-wider text-slate-300 font-mono uppercase flex items-center space-x-2">
              <History className="text-indigo-500" size={16} />
              <span>Activity Log</span>
            </h3>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {data?.recent_activities?.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">No recent activities.</p>
            ) : (
              data?.recent_activities?.map((log) => (
                <div key={log.id} className="text-xs p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-orange-400 font-mono">{log.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-normal">{log.details}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/20 text-[10px] text-slate-500">
                    <span>By: {log.username || 'System'}</span>
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      
    </div>
  );
};

export default Dashboard;
