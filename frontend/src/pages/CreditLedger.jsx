import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  BookOpen, 
  Search, 
  AlertTriangle,
  IndianRupee,
  CheckCircle,
  Clock,
  PlusCircle,
  Trash2,
  Building2,
  Calendar
} from 'lucide-react';

const CreditLedger = () => {
  // Navigation tabs
  const [activeMainTab, setActiveMainTab] = useState('sales_credit'); // 'sales_credit', 'loans'
  
  // Sales Credit State
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesFilterTab, setSalesFilterTab] = useState('pending'); // 'all', 'pending', 'settled'
  
  // Payment Modal State (for Sales Credit)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // Loans State
  const [loans, setLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [loansSearch, setLoansSearch] = useState('');
  
  // Loan Form Modal State
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState({
    id: null, // null for new loan
    company_name: '',
    loan_amount: '',
    installment_amount: '',
    loan_date: new Date().toISOString().split('T')[0]
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch Sales Credits
  const fetchSales = async () => {
    try {
      setSalesLoading(true);
      const res = await api.get('sales/');
      const allSales = res.data.results || res.data || [];
      const creditSales = allSales.filter(s => s.is_credit === true);
      setSales(creditSales);
      setSalesLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch credit ledger records.');
      setSalesLoading(false);
    }
  };

  // Fetch Loans
  const fetchLoans = async () => {
    try {
      setLoansLoading(true);
      const res = await api.get('loans/');
      const allLoans = res.data.results || res.data || [];
      setLoans(allLoans);
      setLoansLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch loan records.');
      setLoansLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchLoans();
  }, []);

  // Collect Payment Handlers
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
      await api.patch(`sales/${selectedSale.id}/`, {
        amount_paid: newAmountPaid
      });
      
      setSuccess(`Payment of ${formatCurrency(collectAmt)} recorded successfully!`);
      setShowPaymentModal(false);
      fetchSales(); 
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.amount_paid?.[0] || 
                     err.response?.data?.detail || 
                     'Failed to record payment.';
      setError(errMsg);
    }
  };

  // Loan Action Handlers
  const openAddLoanModal = () => {
    setLoanForm({
      id: null,
      company_name: '',
      loan_amount: '',
      installment_amount: '',
      loan_date: new Date().toISOString().split('T')[0]
    });
    setError('');
    setSuccess('');
    setShowLoanModal(true);
  };

  const handleSaveLoan = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loanForm.company_name.trim()) {
      setError('Company name is required.');
      return;
    }
    if (parseFloat(loanForm.loan_amount) <= 0) {
      setError('Loan amount must be greater than zero.');
      return;
    }
    if (parseFloat(loanForm.installment_amount) <= 0) {
      setError('Installment amount must be greater than zero.');
      return;
    }

    try {
      if (loanForm.id) {
        // Edit Mode
        await api.put(`loans/${loanForm.id}/`, loanForm);
        setSuccess('Loan details updated successfully!');
      } else {
        // Create Mode
        await api.post('loans/', loanForm);
        setSuccess('New loan record registered successfully!');
      }
      setShowLoanModal(false);
      fetchLoans();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save loan record.');
    }
  };

  const handleDeleteLoan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this loan record?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`loans/${id}/`);
      setSuccess('Loan record deleted successfully.');
      fetchLoans();
    } catch (err) {
      console.error(err);
      setError('Failed to delete loan record.');
    }
  };

  // Filter Sales
  const filteredSales = sales.filter(s => {
    const matchesSearch = 
      (s.customer_name && s.customer_name.toLowerCase().includes(salesSearch.toLowerCase())) ||
      s.items?.some(item => 
        item.product_name.toLowerCase().includes(salesSearch.toLowerCase()) || 
        item.product_color.toLowerCase().includes(salesSearch.toLowerCase())
      );
      
    const due = parseFloat(s.due_amount);
    
    if (salesFilterTab === 'pending') {
      return matchesSearch && due > 0;
    } else if (salesFilterTab === 'settled') {
      return matchesSearch && due <= 0;
    } else {
      return matchesSearch;
    }
  });

  // Filter Loans
  const filteredLoans = loans.filter(l => 
    l.company_name.toLowerCase().includes(loansSearch.toLowerCase())
  );

  // Sales Dues Aggregates
  const totalOutstanding = sales.reduce((acc, s) => acc + parseFloat(s.due_amount), 0);
  const pendingCustomersCount = sales.filter(s => parseFloat(s.due_amount) > 0).length;
  const settledCustomersCount = sales.filter(s => parseFloat(s.due_amount) <= 0).length;

  // Loans Aggregates
  const totalLoansValue = loans.reduce((acc, l) => acc + parseFloat(l.loan_amount), 0);
  const totalInstallmentsMonthly = loans.reduce((acc, l) => acc + parseFloat(l.installment_amount), 0);
  const activeLoansCount = loans.length;

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Credit & Loan Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">Track outstanding customer balances, record payments, and manage active business loans.</p>
        </div>

        {/* Main Tab Switcher */}
        <div className="flex bg-slate-900 p-1 border border-slate-800 rounded-xl">
          <button
            onClick={() => {
              setActiveMainTab('sales_credit');
              setError('');
              setSuccess('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeMainTab === 'sales_credit'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen size={14} />
            <span>Sales Credit Ledger</span>
          </button>
          <button
            onClick={() => {
              setActiveMainTab('loans');
              setError('');
              setSuccess('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeMainTab === 'loans'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 size={14} />
            <span>Business Loans Tracker</span>
          </button>
        </div>
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

      {/* SALES CREDIT TAB */}
      {activeMainTab === 'sales_credit' && (
        <>
          {salesLoading ? (
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
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    placeholder="Search customer or item..."
                    className="bg-transparent border-none outline-none text-xs text-slate-100 w-full placeholder-slate-700"
                  />
                </div>

                {/* Quick Filter Tabs */}
                <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl self-start md:self-auto">
                  <button
                    onClick={() => setSalesFilterTab('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      salesFilterTab === 'pending'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setSalesFilterTab('settled')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      salesFilterTab === 'settled'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Settled
                  </button>
                  <button
                    onClick={() => setSalesFilterTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      salesFilterTab === 'all'
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
                          <th className="py-4 px-6 text-right">Total Amount</th>
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
        </>
      )}

      {/* LOANS TAB */}
      {activeMainTab === 'loans' && (
        <>
          {loansLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              {/* Loan Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4">
                  <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl text-blue-500">
                    <IndianRupee size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">Total Borrowed Amount</p>
                    <h3 className="text-2xl font-black text-blue-400 font-display mt-0.5">
                      {formatCurrency(totalLoansValue)}
                    </h3>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4">
                  <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-500">
                    <IndianRupee size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">Total Active Installment (Hafta)</p>
                    <h3 className="text-2xl font-black text-red-400 font-display mt-0.5">
                      {formatCurrency(totalInstallmentsMonthly)}
                    </h3>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4">
                  <div className="p-3 bg-slate-950/40 border border-slate-500/20 rounded-xl text-slate-400">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">Active Loans</p>
                    <h3 className="text-2xl font-black text-slate-100 font-display mt-0.5">
                      {activeLoansCount} <span className="text-xs text-slate-500 font-normal">records</span>
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
                    value={loansSearch}
                    onChange={(e) => setLoansSearch(e.target.value)}
                    placeholder="Search company/bank..."
                    className="bg-transparent border-none outline-none text-xs text-slate-100 w-full placeholder-slate-700"
                  />
                </div>

                {/* Add Loan Button */}
                <button
                  onClick={openAddLoanModal}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all flex items-center space-x-2 shadow-lg shadow-orange-500/10 self-start md:self-auto"
                >
                  <PlusCircle size={14} />
                  <span>Record New Loan</span>
                </button>

              </div>

              {/* Loans Table */}
              {filteredLoans.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                  <Building2 className="mx-auto text-slate-700 mb-4" size={48} />
                  <h3 className="text-slate-400 font-semibold font-display">No Loan Records Registered</h3>
                  <p className="text-xs text-slate-500 mt-1">Start by recording a loan above.</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-950/20">
                          <th className="py-4 px-6">Date Taken</th>
                          <th className="py-4 px-6">Company / Bank Name</th>
                          <th className="py-4 px-6 text-right">Total Loan Amount</th>
                          <th className="py-4 px-6 text-right text-red-400">Installment (Hafta)</th>
                          <th className="py-4 px-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {filteredLoans.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-950/20 transition-colors">
                            <td className="py-4 px-6 font-semibold text-slate-400 font-mono flex items-center space-x-2">
                              <Calendar size={12} className="text-slate-500" />
                              <span>{formatDateToDisplay(l.loan_date)}</span>
                            </td>
                            <td className="py-4 px-6 font-bold text-slate-200">
                              {l.company_name}
                            </td>
                            <td className="py-4 px-6 text-right font-black text-slate-200 font-mono">
                              {formatCurrency(l.loan_amount)}
                            </td>
                            <td className="py-4 px-6 text-right font-bold text-red-400 font-mono">
                              {formatCurrency(l.installment_amount)}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => {
                                    setLoanForm(l);
                                    setError('');
                                    setSuccess('');
                                    setShowLoanModal(true);
                                  }}
                                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-1 px-2.5 rounded-lg transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteLoan(l.id)}
                                  className="text-[10px] bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-950/40 font-semibold py-1 px-2.5 rounded-lg transition-all flex items-center space-x-1"
                                >
                                  <Trash2 size={10} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Collect Payment Modal (Sales Credit) */}
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

      {/* Add / Edit Loan Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
                {loanForm.id ? 'Edit Loan Record' : 'Record Business Loan'}
              </h3>
              <button onClick={() => setShowLoanModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveLoan} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Company / Bank Name*
                </label>
                <input
                  type="text"
                  value={loanForm.company_name}
                  onChange={(e) => setLoanForm({ ...loanForm, company_name: e.target.value })}
                  placeholder="e.g. HDFC Bank, Cholamandalam Finance..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Total Loan (₹)*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanForm.loan_amount}
                    onChange={(e) => setLoanForm({ ...loanForm, loan_amount: e.target.value })}
                    placeholder="Total amount"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Installment / Hafta (₹)*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanForm.installment_amount}
                    onChange={(e) => setLoanForm({ ...loanForm, installment_amount: e.target.value })}
                    placeholder="Per month amount"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Loan Date*
                </label>
                <input
                  type="date"
                  value={loanForm.loan_date}
                  onChange={(e) => setLoanForm({ ...loanForm, loan_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                  required
                />
              </div>

              <div className="flex space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10"
                >
                  Save Loan
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
