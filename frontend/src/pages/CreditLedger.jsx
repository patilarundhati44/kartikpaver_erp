import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  BookOpen, 
  Search, 
  AlertTriangle,
  IndianRupee,
  SlidersHorizontal,
  CheckCircle,
  Clock,
  PlusCircle
} from 'lucide-react';

const CreditLedger = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('pending'); // 'all', 'pending', 'settled'
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSales = async () => {
    try {
      // Fetch all sales, filter to show only credit transactions (where is_credit is true)
      const res = await api.get('sales/');
      const allSales = res.data.results || res.data || [];
      const creditSales = allSales.filter(s => s.is_credit === true);
      setSales(creditSales);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch credit ledger records.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    setPaymentAmount('');
    setError('');
    setSuccess('');
    setShowPaymentModal(true);
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    const currentDue = parseFloat(selectedSale.due_amount);
    const collectAmt = parseFloat(paymentAmount);

    if (collectAmt > currentDue) {
      setError(`Cannot collect more than the outstanding due of ${formatCurrency(currentDue)}.`);
      return;
    }

    const newAmountPaid = parseFloat(selectedSale.amount_paid) + collectAmt;

    try {
      // Collect payment updates amount_paid. The backend automatically adjusts is_credit.
      await api.patch(`sales/${selectedSale.id}/`, {
        amount_paid: newAmountPaid
      });
      
      setSuccess(`Payment of ${formatCurrency(collectAmt)} recorded successfully!`);
      setShowPaymentModal(false);
      fetchSales(); // Refresh the list
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.amount_paid?.[0] || 
                     err.response?.data?.detail || 
                     'Failed to record payment.';
      setError(errMsg);
    }
  };

  // Filter list based on search and tab selection
  const filteredSales = sales.filter(s => {
    const matchesSearch = 
      (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      s.items?.some(item => 
        item.product_name.toLowerCase().includes(search.toLowerCase()) || 
        item.product_color.toLowerCase().includes(search.toLowerCase())
      );
      
    const due = parseFloat(s.due_amount);
    
    if (filterTab === 'pending') {
      return matchesSearch && due > 0;
    } else if (filterTab === 'settled') {
      return matchesSearch && due <= 0;
    } else {
      return matchesSearch;
    }
  });

  // Calculate Aggregates
  const totalOutstanding = sales.reduce((acc, s) => acc + parseFloat(s.due_amount), 0);
  const pendingCustomersCount = sales.filter(s => parseFloat(s.due_amount) > 0).length;
  const settledCustomersCount = sales.filter(s => parseFloat(s.due_amount) <= 0).length;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDateToDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">Credit Ledger</h2>
        <p className="text-xs text-slate-400 mt-1">Track outstanding balances from client dispatches, record incoming payments, and manage party ledger states.</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-200 text-xs flex items-center space-x-3">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-950/20 border border-green-900/50 rounded-xl text-green-200 text-xs flex items-center space-x-3">
          <span className="text-green-500">✓</span>
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-500">
                <IndianRupee size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">Total Outstanding</p>
                <h3 className="text-2xl font-black text-red-400 font-display mt-0.5">
                  {formatCurrency(totalOutstanding)}
                </h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-orange-950/40 border border-orange-500/20 rounded-xl text-orange-500">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">Pending Accounts</p>
                <h3 className="text-2xl font-black text-slate-100 font-display mt-0.5">
                  {pendingCustomersCount} <span className="text-xs text-slate-500 font-normal">parties</span>
                </h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-green-950/40 border border-green-500/20 rounded-xl text-green-500">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">Settled Accounts</p>
                <h3 className="text-2xl font-black text-slate-100 font-display mt-0.5">
                  {settledCustomersCount} <span className="text-xs text-slate-500 font-normal">cleared</span>
                </h3>
              </div>
            </div>

          </div>

          {/* Filtering & Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-slate-900 border border-slate-800/80 rounded-2xl">
            
            {/* Search */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 w-full md:max-w-xs">
              <Search className="text-slate-500 mr-2" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer or item..."
                className="bg-transparent border-none outline-none text-xs text-slate-100 w-full placeholder-slate-700"
              />
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl self-start md:self-auto">
              <button
                onClick={() => setFilterTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterTab === 'pending'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterTab('settled')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterTab === 'settled'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Settled
              </button>
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterTab === 'all'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Records
              </button>
            </div>

          </div>

          {/* Ledger Table */}
          {filteredSales.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
              <BookOpen className="mx-auto text-slate-700 mb-4" size={48} />
              <h3 className="text-slate-400 font-semibold font-display">No Credit Records Found</h3>
              <p className="text-xs text-slate-500 mt-1">Try changing filters or search terms.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-950/20">
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Customer Name</th>
                      <th className="py-4 px-6">Items Dispatch List</th>
                      <th className="py-4 px-6 text-right">Total Brass</th>
                      <th className="py-4 px-6 text-right">Total Bill</th>
                      <th className="py-4 px-6 text-right">Paid So Far</th>
                      <th className="py-4 px-6 text-right text-red-400">Due Amount</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredSales.map((s) => {
                      const due = parseFloat(s.due_amount);
                      const isUnpaid = due > 0;
                      return (
                        <tr key={s.id} className="hover:bg-slate-950/20 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-400 font-mono">
                            {formatDateToDisplay(s.sale_date)}
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-200">
                            {s.customer_name || <span className="text-slate-600 italic">Walk-in</span>}
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1 py-0.5">
                              {s.items && s.items.map((item, idx) => (
                                <div key={idx} className="flex items-center space-x-1.5 text-slate-300 text-xs">
                                  <span className="font-bold text-slate-200">{item.quantity.toLocaleString()}</span>
                                  <span className="text-slate-500">pcs</span>
                                  <span className="text-slate-400">{item.product_color} {item.product_name}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-semibold font-mono text-slate-400">
                            {parseFloat(s.total_brass) > 0 ? `${s.total_brass} Br` : '-'}
                          </td>
                          <td className="py-4 px-6 text-right font-bold font-mono text-slate-200">
                            {formatCurrency(s.sale_amount)}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-green-400 font-mono">
                            {formatCurrency(s.amount_paid)}
                          </td>
                          <td className="py-4 px-6 text-right font-black text-red-400 font-mono">
                            {formatCurrency(s.due_amount)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {isUnpaid ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-950/30 text-red-400 border border-red-900/40 uppercase tracking-wide">
                                Pending
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-950/20 text-green-400 border border-green-900/30 uppercase tracking-wide">
                                Cleared
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center">
                              {isUnpaid ? (
                                <button
                                  onClick={() => openPaymentModal(s)}
                                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-1.5 px-3 rounded-lg text-[10px] transition-all flex items-center space-x-1"
                                >
                                  <PlusCircle size={12} />
                                  <span>Collect Payment</span>
                                </button>
                              ) : (
                                <span className="text-slate-500 text-[10px] italic">Cleared</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Collect Payment Modal */}
      {showPaymentModal && selectedSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
                Collect Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCollectPayment} className="p-6 space-y-4">
              
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Name:</span>
                  <span className="font-bold text-slate-200">{selectedSale.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Invoice:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(selectedSale.sale_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Paid:</span>
                  <span className="font-mono text-green-400">{formatCurrency(selectedSale.amount_paid)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-semibold">
                  <span className="text-red-400">Current Due Amount:</span>
                  <span className="font-mono text-red-400">{formatCurrency(selectedSale.due_amount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Payment Amount Received (₹)*
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount collected..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              {/* Live Preview */}
              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                <div className="text-xs text-center text-slate-400 bg-slate-950/40 p-2 rounded-lg font-mono">
                  Remaining Due: {formatCurrency(parseFloat(selectedSale.due_amount) - parseFloat(paymentAmount))}
                </div>
              )}

              <div className="flex space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10"
                >
                  Collect & Clear
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreditLedger;
