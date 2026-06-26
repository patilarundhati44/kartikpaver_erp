import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Calendar, 
  Printer, 
  Download, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Hammer,
  Truck
} from 'lucide-react';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('production');
  const [error, setError] = useState('');

  // Default dates: past 30 days
  useEffect(() => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    
    setStartDate(past.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const fetchReports = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`reports/summary/?start_date=${startDate}&end_date=${endDate}`);
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch reports. Please verify date parameters.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = (datasetName) => {
    if (!data) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `kartik_paver_${datasetName}_report_${startDate}_to_${endDate}.csv`;
    let rows = [];

    if (datasetName === 'production') {
      rows.push(["Production Date", "Product Name", "Color", "Category", "Quantity (pcs)"]);
      data.production.forEach(p => {
        rows.push([p.production_date, p.product_name, p.product_color, p.product_category, p.quantity]);
      });
    } else if (datasetName === 'sales') {
      rows.push(["Sale Date", "Product Name", "Color", "Quantity", "Sale Amount (INR)", "Customer Name"]);
      data.sales.forEach(s => {
        rows.push([s.sale_date, s.product_name, s.product_color, s.quantity, s.sale_amount, s.customer_name || "Walk-in"]);
      });
    } else if (datasetName === 'purchases') {
      rows.push(["Purchase Date", "Material Name", "Quantity", "Unit", "Amount Paid (INR)", "Supplier Name", "Notes"]);
      data.purchases.forEach(p => {
        rows.push([p.purchase_date, p.material_name, p.quantity, p.unit, p.purchase_amount, p.supplier_name || "", p.notes || ""]);
      });
    } else if (datasetName === 'expenses') {
      rows.push(["Expense Date", "Category", "Amount (INR)", "Description"]);
      data.expenses.forEach(e => {
        rows.push([e.expense_date, e.category, e.amount, e.description || ""]);
      });
    }

    // Process and trigger download
    const csvString = rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent + csvString);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      
      {/* Header controls (No print) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Factory Reports Console</h2>
          <p className="text-xs text-slate-400 mt-1">Export transaction histories in CSV/Excel sheets or generate printable PDF statements.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={!data}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Printer size={15} />
            <span>Print Report (PDF)</span>
          </button>
          
          <button
            onClick={() => exportToCSV(activeTab)}
            disabled={!data}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-orange-500/10 disabled:opacity-50"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Selectors Toolbar (No print) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl no-print">
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">From Date</label>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Calendar className="text-slate-500 mr-2" size={16} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-slate-100 w-full focus:ring-0"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">To Date</label>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Calendar className="text-slate-500 mr-2" size={16} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-slate-100 w-full focus:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={fetchReports}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-6 rounded-xl text-xs transition-all border border-slate-700/60"
          >
            Apply Date Range
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-200 text-xs flex items-center space-x-3 no-print">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* --- PRINT ONLY HEADER BLOCK (Strictly styled via CSS as hidden on screen, shown on print) --- */}
      <div className="hidden print:block print-container border-b-2 border-slate-300 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">KARTIK PAVER INDUSTRIES</h1>
            <p className="text-xs text-slate-600 mt-1">Latur MIDC Road, Latur, Maharashtra - 413512</p>
            <p className="text-[10px] text-slate-500 font-mono">Tel: +91 94220 00000 | Email: kartikpaver@gmail.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-orange-600 uppercase tracking-widest font-mono">Factory Summary Statement</h2>
            <p className="text-xs text-slate-600 mt-1 font-mono">Period: {startDate} to {endDate}</p>
            <p className="text-[9px] text-slate-400 font-mono">Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>
        
        {/* Aggregated Totals row in Printed PDF */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 text-xs">
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Production</span>
            <span className="text-base font-black text-slate-800">{(data?.totals?.production || 0).toLocaleString()} blocks</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Sales Revenue</span>
            <span className="text-base font-black text-slate-800">{formatCurrency(data?.totals?.sales)}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Raw Purchases</span>
            <span className="text-base font-black text-slate-800">{formatCurrency(data?.totals?.purchases)}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Operating Expenses</span>
            <span className="text-base font-black text-slate-800">{formatCurrency(data?.totals?.expenses)}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : !data ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl no-print">
          <Calendar className="mx-auto text-slate-700 mb-4" size={48} />
          <h3 className="text-slate-400 font-semibold font-display">Enter a Date Range</h3>
          <p className="text-xs text-slate-500 mt-1">Select start and end parameters and click Apply to compile reports.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Summary Cards Grid (No print) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 no-print">
            
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex items-center space-x-3">
              <div className="p-2.5 bg-orange-950/40 rounded-xl text-orange-500"><Hammer size={18} /></div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Production</span>
                <span className="text-sm font-bold text-slate-200 font-mono">{(data.totals.production).toLocaleString()} pcs</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex items-center space-x-3">
              <div className="p-2.5 bg-green-950/40 rounded-xl text-green-500"><TrendingUp size={18} /></div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Sales Revenue</span>
                <span className="text-sm font-bold text-slate-200 font-mono">{formatCurrency(data.totals.sales)}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-950/40 rounded-xl text-indigo-500"><Truck size={18} /></div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Raw Purchases</span>
                <span className="text-sm font-bold text-slate-200 font-mono">{formatCurrency(data.totals.purchases)}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex items-center space-x-3">
              <div className="p-2.5 bg-red-950/40 rounded-xl text-red-500"><CreditCard size={18} /></div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Operating Expenses</span>
                <span className="text-sm font-bold text-slate-200 font-mono">{formatCurrency(data.totals.expenses)}</span>
              </div>
            </div>

          </div>

          {/* Tab Selection Bar (No print) */}
          <div className="flex border-b border-slate-800 space-x-6 no-print">
            {[
              { id: 'production', label: 'Production Log', count: data.production.length },
              { id: 'sales', label: 'Sales Orders', count: data.sales.length },
              { id: 'purchases', label: 'Raw Purchases', count: data.purchases.length },
              { id: 'expenses', label: 'Expenses', count: data.expenses.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-orange-500 text-orange-500' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Active Tab Table Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl print:bg-white print:border-none">
            
            {activeTab === 'production' && (
              <table className="w-full text-left border-collapse print-table">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-950/20 print:bg-slate-100 print:text-black">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Product Description</th>
                    <th className="py-4 px-6">Color</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs print:divide-slate-200">
                  {data.production.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/10 print:text-black">
                      <td className="py-3 px-6 font-mono font-semibold print:text-black">{new Date(p.production_date).toLocaleDateString('en-GB')}</td>
                      <td className="py-3 px-6 font-bold text-slate-300 print:text-black">{p.product_name}</td>
                      <td className="py-3 px-6 print:text-black">{p.product_color}</td>
                      <td className="py-3 px-6 text-slate-500 print:text-slate-600 font-mono text-[10px]">{p.product_category}</td>
                      <td className="py-3 px-6 text-right font-black font-mono text-slate-300 print:text-black">{p.quantity.toLocaleString()} pcs</td>
                    </tr>
                  ))}
                  {data.production.length === 0 && (
                    <tr><td colSpan="5" className="py-10 text-center text-slate-500">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'sales' && (
              <table className="w-full text-left border-collapse print-table">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-950/20 print:bg-slate-100 print:text-black">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Product Details</th>
                    <th className="py-4 px-6 text-right">Qty</th>
                    <th className="py-4 px-6 text-right">Sale Amount</th>
                    <th className="py-4 px-6">Customer Organization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs print:divide-slate-200">
                  {data.sales.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/10 print:text-black">
                      <td className="py-3 px-6 font-mono font-semibold print:text-black">{new Date(s.sale_date).toLocaleDateString('en-GB')}</td>
                      <td className="py-3 px-6 font-bold text-slate-300 print:text-black">{s.product_color} {s.product_name}</td>
                      <td className="py-3 px-6 text-right font-mono print:text-black">{s.quantity.toLocaleString()}</td>
                      <td className="py-3 px-6 text-right font-black font-mono text-slate-300 print:text-black">{formatCurrency(s.sale_amount)}</td>
                      <td className="py-3 px-6 text-slate-400 print:text-black">{s.customer_name || 'Walk-in'}</td>
                    </tr>
                  ))}
                  {data.sales.length === 0 && (
                    <tr><td colSpan="5" className="py-10 text-center text-slate-500">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'purchases' && (
              <table className="w-full text-left border-collapse print-table">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-950/20 print:bg-slate-100 print:text-black">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Material</th>
                    <th className="py-4 px-6 text-right">Quantity</th>
                    <th className="py-4 px-6 text-right">Purchase Cost</th>
                    <th className="py-4 px-6">Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs print:divide-slate-200">
                  {data.purchases.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/10 print:text-black">
                      <td className="py-3 px-6 font-mono font-semibold print:text-black">{new Date(p.purchase_date).toLocaleDateString('en-GB')}</td>
                      <td className="py-3 px-6 font-bold text-orange-400 print:text-black">{p.material_name}</td>
                      <td className="py-3 px-6 text-right font-mono print:text-black">{p.quantity} <span className="text-slate-500 font-normal text-[10px]">{p.unit}</span></td>
                      <td className="py-3 px-6 text-right font-black font-mono text-slate-300 print:text-black">{formatCurrency(p.purchase_amount)}</td>
                      <td className="py-3 px-6 text-slate-400 print:text-black">{p.supplier_name || '-'}</td>
                    </tr>
                  ))}
                  {data.purchases.length === 0 && (
                    <tr><td colSpan="5" className="py-10 text-center text-slate-500">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'expenses' && (
              <table className="w-full text-left border-collapse print-table">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-950/20 print:bg-slate-100 print:text-black">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6 text-right">Expense Cost</th>
                    <th className="py-4 px-6">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs print:divide-slate-200">
                  {data.expenses.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/10 print:text-black">
                      <td className="py-3 px-6 font-mono font-semibold print:text-black">{new Date(e.expense_date).toLocaleDateString('en-GB')}</td>
                      <td className="py-3 px-6 font-bold text-slate-300 print:text-black">{e.category}</td>
                      <td className="py-3 px-6 text-right font-black font-mono text-slate-300 print:text-black">{formatCurrency(e.amount)}</td>
                      <td className="py-3 px-6 text-slate-400 print:text-black">{e.description || '-'}</td>
                    </tr>
                  ))}
                  {data.expenses.length === 0 && (
                    <tr><td colSpan="4" className="py-10 text-center text-slate-500">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default Reports;
