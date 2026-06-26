import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  AlertTriangle 
} from 'lucide-react';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('analytics/summary/');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Could not compile analytics dataset. Ensure backend has seeded transactions.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
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

  // Curated color themes for Recharts
  const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#6b7280'];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Prepare Profit Margin calculation
  const totalRevenue = data?.financials?.total_sales || 0;
  const totalCost = (data?.financials?.total_purchases || 0) + (data?.financials?.total_expenses || 0);
  const netProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Custom tooltips styling for dark mode
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
          <p className="text-slate-400 font-bold mb-1">{label}</p>
          {payload.map((item, idx) => (
            <p key={idx} style={{ color: item.color || item.fill }}>
              {item.name}: {formatCurrency(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">Business Analytics & Trends</h2>
        <p className="text-xs text-slate-400 mt-1">Interactive reports tracking margins, category performance, and 15-day factory cashflows.</p>
      </div>

      {/* Analytics KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Cumulative Profit / Loss</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className={`text-2xl font-black font-display ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(netProfit)}
            </h3>
            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
              netProfit >= 0 ? 'bg-green-950/20 text-green-400 border border-green-900/30' : 'bg-red-950/20 text-red-400 border border-red-900/30'
            }`}>
              {netProfit >= 0 ? 'In Profit' : 'Deficit'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Revenue: {formatCurrency(totalRevenue)} | Costs: {formatCurrency(totalCost)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Net Profit Margin</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className={`text-2xl font-black font-display ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {profitMarginPercent}%
            </h3>
            <Percent size={20} className="text-slate-600" />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Returns per unit invoice generated</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Cost distribution ratio</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-black text-slate-100 font-display">
              {totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(0) : 0}%
            </h3>
            <DollarSign size={20} className="text-slate-600" />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Purchases & expenses relative to sales revenue</p>
        </div>

      </div>

      {/* main cashflow area graph */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 font-display">15-Day Cashflow Timeline</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Tracking daily sales bills against material buys and expenses.</p>
        </div>
        
        <div className="h-80 w-full text-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data?.timeline || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                tickFormatter={(str) => {
                  const parts = str.split('-');
                  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : str;
                }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                tickFormatter={(val) => `₹${val/1000}k`}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
              <Area 
                type="monotone" 
                name="Sales Revenue" 
                dataKey="sales" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorSales)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                name="Buys & Expenses" 
                dataKey="costs" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorCosts)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row of sub charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Expenses Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 font-display">Expense Allocations</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Sum of operating expenses grouped by categories.</p>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.expense_distribution || []}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <YAxis type="category" dataKey="category" stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="amount" name="Amount Spent" fill="#f97316" radius={[0, 6, 6, 0]}>
                  {data?.expense_distribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Category sales shares */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 font-display">Category Sales Share</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Revenue contributions grouped by product categories.</p>
          </div>
          
          <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-around">
            {data?.category_shares?.length === 0 ? (
              <p className="text-xs text-slate-500">No category sales recorded yet.</p>
            ) : (
              <>
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.category_shares || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="category"
                      >
                        {data?.category_shares?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Pie legend */}
                <div className="space-y-2 text-xs">
                  {data?.category_shares?.map((entry, index) => (
                    <div key={entry.category} className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-slate-400 font-mono">{entry.category}:</span>
                      <span className="font-bold text-slate-200">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
