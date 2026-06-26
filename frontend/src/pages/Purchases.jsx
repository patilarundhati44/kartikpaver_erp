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
  IndianRupee,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';

const Purchases = () => {
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

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDateDisplay, setStartDateDisplay] = useState('');
  const [endDateDisplay, setEndDateDisplay] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [purchaseDateDisplay, setPurchaseDateDisplay] = useState('');
  const [materialName, setMaterialName] = useState('Cement');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Bags');
  const [amount, setAmount] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPurchases = async () => {
    try {
      let url = 'purchases/';
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const res = await api.get(url);
      setPurchases(res.data.results || res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch purchase history.');
      setLoading(false);
    }
  };

  // Sync text filters with actual date parameters
  useEffect(() => {
    let parsedStart = '';
    let parsedEnd = '';
    if (startDateDisplay) {
      if (isValidDisplayDate(startDateDisplay)) {
        parsedStart = parseDisplayToDate(startDateDisplay);
      } else {
        return; // Don't trigger API if text is incomplete
      }
    }
    if (endDateDisplay) {
      if (isValidDisplayDate(endDateDisplay)) {
        parsedEnd = parseDisplayToDate(endDateDisplay);
      } else {
        return; // Don't trigger API if text is incomplete
      }
    }
    setStartDate(parsedStart);
    setEndDate(parsedEnd);
  }, [startDateDisplay, endDateDisplay]);

  useEffect(() => {
    fetchPurchases();
  }, [startDate, endDate]);

  const openAddModal = () => {
    setModalType('add');
    const todayStr = new Date().toISOString().split('T')[0];
    setPurchaseDateDisplay(formatDateToDisplay(todayStr));
    setMaterialName('Cement');
    setQuantity('');
    setUnit('Bags');
    setAmount('');
    setSupplier('');
    setNotes('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setModalType('edit');
    setEditingId(p.id);
    setPurchaseDateDisplay(formatDateToDisplay(p.purchase_date));
    setMaterialName(p.material_name);
    setQuantity(p.quantity);
    setUnit(p.unit);
    setAmount(p.purchase_amount);
    setSupplier(p.supplier_name || '');
    setNotes(p.notes || '');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!purchaseDateDisplay || !quantity || !amount) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isValidDisplayDate(purchaseDateDisplay)) {
      setError('Please enter Date in DD/MM/YYYY format (e.g. 17/06/2026).');
      return;
    }

    const payload = {
      purchase_date: parseDisplayToDate(purchaseDateDisplay),
      material_name: materialName,
      quantity: parseFloat(quantity),
      unit,
      purchase_amount: parseFloat(amount),
      supplier_name: supplier,
      notes
    };

    try {
      if (modalType === 'add') {
        await api.post('purchases/', payload);
        setSuccess('Purchase recorded successfully!');
      } else {
        await api.put(`purchases/${editingId}/`, payload);
        setSuccess('Purchase entry updated!');
      }
      setShowModal(false);
      fetchPurchases();
    } catch (err) {
      console.error(err);
      setError('Failed to save record. Please check inputs.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this purchase record? this is permanent.')) {
      try {
        await api.delete(`purchases/${id}/`);
        setSuccess('Record deleted.');
        fetchPurchases();
      } catch (err) {
        console.error(err);
        setError('Failed to delete purchase record.');
      }
    }
  };

  // Filter based on search input
  const filteredPurchases = purchases.filter(p => 
    p.material_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier_name && p.supplier_name.toLowerCase().includes(search.toLowerCase())) ||
    (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()))
  );

  // Compute aggregated total purchase cost
  const totalCost = filteredPurchases.reduce((acc, curr) => acc + parseFloat(curr.purchase_amount), 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Raw Material Purchases</h2>
          <p className="text-xs text-slate-400 mt-1">Record and manage cement, aggregate, sand, fly ash, and powder pigments.</p>
        </div>
        
        <button
          onClick={openAddModal}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>New Purchase</span>
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

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-900 border border-slate-800/80 rounded-2xl">
        
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Global Search</label>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Search className="text-slate-500 mr-2" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search material or supplier..."
              className="bg-transparent border-none outline-none text-xs text-slate-100 w-full placeholder-slate-700"
            />
          </div>
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

        {/* Aggregated indicator */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase text-slate-500 font-mono tracking-wider">Filtered Total Cost</span>
          <span className="text-lg font-black text-orange-500 mt-1 font-display">{formatCurrency(totalCost)}</span>
        </div>

      </div>

      {/* Purchase Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <SlidersHorizontal className="mx-auto text-slate-700 mb-4" size={48} />
          <h3 className="text-slate-400 font-semibold font-display">No Purchase Records</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the date range filter or record a new purchase.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-950/20">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Material Name</th>
                  <th className="py-4 px-6 text-right">Quantity</th>
                  <th className="py-4 px-6 text-right">Amount Paid</th>
                  <th className="py-4 px-6">Supplier</th>
                  <th className="py-4 px-6">Notes</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-950/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-300 font-mono">
                      {formatDateToDisplay(p.purchase_date)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded bg-slate-850 border border-slate-800 text-orange-400 font-bold text-[10px] font-mono">
                        {p.material_name}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold font-mono">
                      {parseFloat(p.quantity).toLocaleString()} <span className="text-slate-500 text-[10px]">{p.unit}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-200 font-mono">
                      {formatCurrency(p.purchase_amount)}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {p.supplier_name || <span className="text-slate-600">-</span>}
                    </td>
                    <td className="py-4 px-6 text-slate-400 italic max-w-xs truncate" title={p.notes}>
                      {p.notes || <span className="text-slate-600">-</span>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800/80 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
                {modalType === 'add' ? 'Record Purchase' : 'Edit Purchase Entry'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Purchase Date (DD/MM/YYYY)*
                  </label>
                  <input
                    type="text"
                    value={purchaseDateDisplay}
                    onChange={(e) => setPurchaseDateDisplay(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Raw Material*
                  </label>
                  <input
                    type="text"
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    placeholder="e.g. Cement, Sand, Aggregate"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Quantity Purchased*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Unit*
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. Bags, Tons, Brass"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Purchase Amount (INR)*
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
                      placeholder="Total amount"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Optional supplier name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional delivery details, grade ratings, batch numbers..."
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
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all"
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

export default Purchases;
