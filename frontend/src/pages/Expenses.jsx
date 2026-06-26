import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle,
  Calendar,
  CreditCard,
  SlidersHorizontal
} from 'lucide-react';

const Expenses = () => {
  // Helper to convert YYYY-MM-DD (backend) to DD/MM/YYYY (frontend input)
  const formatDateToDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Helper to convert DD/MM/YYYY (frontend input) to YYYY-MM-DD (backend)
  const parseDisplayToDate = (displayStr) => {
    if (!displayStr) return '';
    const parts = displayStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      if (year.length === 4) {
        return `${year}-${month}-${day}`;
      }
    }
    return displayStr;
  };

  // Simple regex validator for DD/MM/YYYY
  const isValidDisplayDate = (str) => {
    if (!str) return false;
    return /^\d{2}\/\d{2}\/\d{4}$/.test(str);
  };

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDateDisplay, setStartDateDisplay] = useState('');
  const [endDateDisplay, setEndDateDisplay] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [expenseDateDisplay, setExpenseDateDisplay] = useState('');
  const [category, setCategory] = useState('Labour');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchExpenses = async () => {
    try {
      let url = 'expenses/';
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (categoryFilter) params.push(`category=${categoryFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const res = await api.get(url);
      setExpenses(res.data.results || res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch expense entries.');
      setLoading(false);
    }
  };

  // Sync date inputs
  useEffect(() => {
    let parsedStart = '';
    let parsedEnd = '';
    if (startDateDisplay) {
      if (isValidDisplayDate(startDateDisplay)) {
        parsedStart = parseDisplayToDate(startDateDisplay);
      } else {
        return;
      }
    }
    if (endDateDisplay) {
      if (isValidDisplayDate(endDateDisplay)) {
        parsedEnd = parseDisplayToDate(endDateDisplay);
      } else {
        return;
      }
    }
    setStartDate(parsedStart);
    setEndDate(parsedEnd);
  }, [startDateDisplay, endDateDisplay]);

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate, categoryFilter]);

  const openAddModal = () => {
    setModalType('add');
    const todayStr = new Date().toISOString().split('T')[0];
    setExpenseDateDisplay(formatDateToDisplay(todayStr));
    setCategory('Labour');
    setAmount('');
    setDescription('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (exp) => {
    setModalType('edit');
    setEditingId(exp.id);
    setExpenseDateDisplay(formatDateToDisplay(exp.expense_date));
    setCategory(exp.category);
    setAmount(exp.amount);
    setDescription(exp.description || '');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedAmt = parseFloat(amount);

    if (!expenseDateDisplay || !category || !parsedAmt) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isValidDisplayDate(expenseDateDisplay)) {
      setError('Please enter Date in DD/MM/YYYY format (e.g. 17/06/2026).');
      return;
    }

    const payload = {
      expense_date: parseDisplayToDate(expenseDateDisplay),
      category,
      amount: parsedAmt,
      description
    };

    try {
      if (modalType === 'add') {
        await api.post('expenses/', payload);
        setSuccess('Expense recorded successfully!');
      } else {
        await api.put(`expenses/${editingId}/`, payload);
        setSuccess('Expense record updated!');
      }
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setError('Failed to save expense record.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense entry? This is permanent.')) {
      try {
        await api.delete(`expenses/${id}/`);
        setSuccess('Expense entry deleted.');
        fetchExpenses();
      } catch (err) {
        console.error(err);
        setError('Failed to delete expense record.');
      }
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
  );

  const totalExpenseSum = filteredExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Expenses Log</h2>
          <p className="text-xs text-slate-400 mt-1">Record day-to-day operating expenditures for labour wages, fuels, machine fixes, bills.</p>
        </div>
        
        <button
          onClick={openAddModal}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>New Expense</span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* Filter toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-5 bg-slate-900 border border-slate-800/80 rounded-2xl">
        
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Description Search</label>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Search className="text-slate-500 mr-2" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description..."
              className="bg-transparent border-none outline-none text-xs text-slate-100 w-full placeholder-slate-700"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Category Filter</label>
          <input
            type="text"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Search category..."
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none placeholder-slate-700"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Start Date</label>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Calendar className="text-slate-500 mr-2" size={16} />
            <input
              type="text"
              value={startDateDisplay}
              onChange={(e) => setStartDateDisplay(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="bg-transparent border-none outline-none text-xs text-slate-100 w-full focus:ring-0 placeholder-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">End Date</label>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Calendar className="text-slate-500 mr-2" size={16} />
            <input
              type="text"
              value={endDateDisplay}
              onChange={(e) => setEndDateDisplay(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="bg-transparent border-none outline-none text-xs text-slate-100 w-full focus:ring-0 placeholder-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase text-slate-500 font-mono tracking-wider">Filtered Expenditure</span>
          <span className="text-lg font-black text-orange-500 mt-1 font-display">{formatCurrency(totalExpenseSum)}</span>
        </div>

      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <SlidersHorizontal className="mx-auto text-slate-700 mb-4" size={48} />
          <h3 className="text-slate-400 font-semibold font-display">No Expense Logs</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting filtering fields or record a new expense.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-950/20">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-950/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-300 font-mono">
                      {formatDateToDisplay(exp.expense_date)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-bold font-mono text-[10px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-200 font-mono">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-4 px-6 text-slate-400 max-w-xs truncate" title={exp.description}>
                      {exp.description || <span className="text-slate-700 italic">No description</span>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800/80 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-2 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800/80 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
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

      {/* Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
                {modalType === 'add' ? 'Record Expense' : 'Edit Expense entry'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Expense Date (DD/MM/YYYY)*
                  </label>
                  <input
                    type="text"
                    value={expenseDateDisplay}
                    onChange={(e) => setExpenseDateDisplay(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Expense Category*
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Labour, Fuel, Bills"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Amount Spent (INR)*
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Expense Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details: labour count, shipping truck license plates, repairs details..."
                  rows="3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>

              <div className="flex space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10"
                >
                  Confirm Entry
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Expenses;
