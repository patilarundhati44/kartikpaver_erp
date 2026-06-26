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
  SlidersHorizontal
} from 'lucide-react';

const Sales = () => {
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

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
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
  const [saleDateDisplay, setSaleDateDisplay] = useState('');
  const [productId, setProductId] = useState('');
  const [productNameInput, setProductNameInput] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [customer, setCustomer] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');

  // Selected product stock reference (for validation)
  const [selectedProductStock, setSelectedProductStock] = useState(0);
  const [originalQuantity, setOriginalQuantity] = useState(0); // If editing, track original qty to adjust limit

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchInitialData = async () => {
    try {
      // 1. Fetch products to get stock balances
      const prodRes = await api.get('products/');
      const prodList = prodRes.data.results || prodRes.data || [];
      setProducts(prodList);
      
      if (prodList.length > 0) {
        setProductId(prodList[0].id);
        setProductNameInput(`${prodList[0].color} ${prodList[0].name}`);
        setSelectedProductStock(prodList[0].current_stock || 0);
      }

      // 2. Fetch sales logs
      await fetchSales();
    } catch (err) {
      console.error(err);
      setError('Failed to fetch initial data.');
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      let url = 'sales/';
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const res = await api.get(url);
      setSales(res.data.results || res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load sales log.');
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

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
    fetchSales();
  }, [startDate, endDate]);

  // Resolve product stock and ID when name input changes reactively
  useEffect(() => {
    const matchedProduct = products.find(
      p => `${p.color} ${p.name}`.toLowerCase() === productNameInput.trim().toLowerCase()
    );
    if (matchedProduct) {
      setProductId(matchedProduct.id);
      const extra = modalType === 'edit' ? originalQuantity : 0;
      setSelectedProductStock((matchedProduct.current_stock || 0) + extra);
    } else {
      setProductId('');
      setSelectedProductStock(0);
    }
  }, [productNameInput, products, modalType, originalQuantity]);

  const openAddModal = () => {
    setModalType('add');
    const todayStr = new Date().toISOString().split('T')[0];
    setSaleDateDisplay(formatDateToDisplay(todayStr));
    if (products.length > 0) {
      setProductId(products[0].id);
      setProductNameInput(`${products[0].color} ${products[0].name}`);
      setSelectedProductStock(products[0].current_stock || 0);
    } else {
      setProductId('');
      setProductNameInput('');
      setSelectedProductStock(0);
    }
    setQuantity('');
    setAmount('');
    setCustomer('');
    setIsCredit(false);
    setAmountPaid('');
    setOriginalQuantity(0);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setModalType('edit');
    setEditingId(entry.id);
    setSaleDateDisplay(formatDateToDisplay(entry.sale_date));
    setProductId(entry.product);
    setProductNameInput(`${entry.product_color} ${entry.product_name}`);
    setQuantity(entry.quantity);
    setAmount(entry.sale_amount);
    setCustomer(entry.customer_name || '');
    setIsCredit(entry.is_credit || false);
    setAmountPaid(entry.amount_paid || '');
    
    // Set stock reference including original quantity sold
    const prod = products.find(p => p.id === entry.product);
    const stockBalance = prod ? (prod.current_stock || 0) : 0;
    setSelectedProductStock(stockBalance + entry.quantity);
    setOriginalQuantity(entry.quantity);
    
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedQty = parseInt(quantity);
    const parsedAmt = parseFloat(amount);

    const matchedProduct = products.find(
      p => `${p.color} ${p.name}`.toLowerCase() === productNameInput.trim().toLowerCase()
    );

    if (!saleDateDisplay || !productNameInput || !parsedQty || !parsedAmt) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isValidDisplayDate(saleDateDisplay)) {
      setError('Please enter Date in DD/MM/YYYY format (e.g. 17/06/2026).');
      return;
    }

    if (!matchedProduct) {
      setError('Please enter a valid product name from the suggestions list.');
      return;
    }

    // Frontend stock check
    if (parsedQty > selectedProductStock) {
      setError(`Insufficient Stock! Available stock for selected product is ${selectedProductStock} units. You entered ${parsedQty}.`);
      return;
    }

    // Parse and validate credit amount_paid
    let finalAmountPaid = parsedAmt;
    if (isCredit) {
      if (amountPaid !== '') {
        const parsedPaid = parseFloat(amountPaid);
        if (isNaN(parsedPaid) || parsedPaid < 0) {
          setError('Please enter a valid paid amount.');
          return;
        }
        if (parsedPaid > parsedAmt) {
          setError('Amount paid upfront cannot exceed total sale amount.');
          return;
        }
        finalAmountPaid = parsedPaid;
      } else {
        finalAmountPaid = 0;
      }
    }

    const payload = {
      sale_date: parseDisplayToDate(saleDateDisplay),
      product: matchedProduct.id,
      quantity: parsedQty,
      sale_amount: parsedAmt,
      customer_name: customer,
      is_credit: isCredit,
      amount_paid: finalAmountPaid
    };

    try {
      if (modalType === 'add') {
        await api.post('sales/', payload);
        setSuccess('Sale registered successfully!');
      } else {
        await api.put(`sales/${editingId}/`, payload);
        setSuccess('Sale record updated!');
      }
      setShowModal(false);
      // Re-fetch products (which updates current_stock references) and sales
      fetchInitialData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.quantity?.[0] || 
                     err.response?.data?.amount_paid?.[0] || 
                     err.response?.data?.detail || 
                     'Failed to register sale. Please verify inputs.';
      setError(errMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this sale record? Current stock levels will adjust immediately.')) {
      try {
        await api.delete(`sales/${id}/`);
        setSuccess('Sale record deleted.');
        fetchInitialData();
      } catch (err) {
        console.error(err);
        setError('Failed to delete sale record.');
      }
    }
  };

  // Filter list based on search
  const filteredSales = sales.filter(s => 
    s.product_name.toLowerCase().includes(search.toLowerCase()) ||
    s.product_color.toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  // Compute total sales revenue
  const totalSalesRevenue = filteredSales.reduce((acc, curr) => acc + parseFloat(curr.sale_amount), 0);

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
          <h2 className="text-xl font-bold text-slate-100">Sales Register</h2>
          <p className="text-xs text-slate-400 mt-1">Record client dispatches, track revenue, and automatically manage inventory.</p>
        </div>
        
        {products.length === 0 ? (
          <div className="text-xs text-orange-400 bg-orange-950/20 border border-orange-900/30 p-2.5 rounded-xl font-semibold">
            Define products first under "Products" module.
          </div>
        ) : (
          <button
            onClick={openAddModal}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus size={18} />
            <span>Record New Sale</span>
          </button>
        )}
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

      {/* Filter toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-900 border border-slate-800/80 rounded-2xl">
        
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Filter by Customer / Product</label>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Search className="text-slate-500 mr-2" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, product..."
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

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase text-slate-500 font-mono tracking-wider">Total Sales Revenue</span>
          <span className="text-lg font-black text-orange-500 mt-1 font-display">{formatCurrency(totalSalesRevenue)}</span>
        </div>

      </div>

      {/* Sales Logs Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <SlidersHorizontal className="mx-auto text-slate-700 mb-4" size={48} />
          <h3 className="text-slate-400 font-semibold font-display">No Sales Logs</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting search parameters or record a new sales dispatch.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-950/20">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-6">Color</th>
                  <th className="py-4 px-6 text-right">Qty Sold</th>
                  <th className="py-4 px-6 text-right">Sale Amount</th>
                  <th className="py-4 px-6">Customer Name</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-950/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-300 font-mono">
                      {formatDateToDisplay(s.sale_date)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-200 text-sm">{s.product_name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1.5">
                        <span 
                          className="w-3 h-3 rounded-full border border-slate-700"
                          style={{ 
                            backgroundColor: s.product_color.toLowerCase() === 'grey' ? '#6b7280' : 
                                            s.product_color.toLowerCase() === 'red' ? '#ef4444' : 
                                            s.product_color.toLowerCase() === 'yellow' ? '#eab308' : 
                                            s.product_color.toLowerCase() === 'natural' ? '#cbd5e1' : '#f97316'
                          }}
                        />
                        <span className="text-slate-300 font-medium">{s.product_color}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-bold font-mono">
                      {s.quantity.toLocaleString()} <span className="text-slate-500 text-[10px] font-normal">pcs</span>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-200 font-mono">
                      {formatCurrency(s.sale_amount)}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">
                          {s.customer_name || <span className="text-slate-600 italic">Walk-in</span>}
                        </span>
                        {s.is_credit && (
                          <div className="mt-1 flex items-center space-x-1.5">
                            {parseFloat(s.due_amount) <= 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-950/30 text-green-400 border border-green-900/40 uppercase tracking-wide">
                                Paid
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-950/30 text-orange-400 border border-orange-900/40 uppercase tracking-wide">
                                Due: {formatCurrency(s.due_amount)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800/80 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
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

      {/* Sale entry form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
                {modalType === 'add' ? 'Record Dispatch Order' : 'Edit Sale entry'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Sale Date (DD/MM/YYYY)*
                  </label>
                  <input
                    type="text"
                    value={saleDateDisplay}
                    onChange={(e) => setSaleDateDisplay(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Select Product*
                  </label>
                  <input
                    type="text"
                    list="salesProductListDatalist"
                    value={productNameInput}
                    onChange={(e) => setProductNameInput(e.target.value)}
                    placeholder="Type or select a product..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                    required
                  />
                  <datalist id="salesProductListDatalist">
                    {products.map((p) => (
                      <option key={p.id} value={`${p.color} ${p.name}`} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Stock check banner */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-500">Available Stock for Dispatch:</span>
                <span className={`font-mono font-black ${selectedProductStock <= 0 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                  {selectedProductStock.toLocaleString()} units
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Quantity Sold*
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 500"
                    min="1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Total Sale Amount (INR)*
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
                      placeholder="Total sales bill amount"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Customer Name / Organization
                </label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Optional customer/builder name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>

              {/* Credit Sale Checkbox & Paid Amount */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCredit}
                    onChange={(e) => {
                      setIsCredit(e.target.checked);
                      if (!e.target.checked) setAmountPaid('');
                    }}
                    className="w-4 h-4 mt-0.5 rounded border-slate-800 text-orange-500 focus:ring-orange-500 bg-slate-900 focus:ring-offset-slate-950"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-300">Is Credit Sale?</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Enable this to track outstanding balance for this party.</p>
                  </div>
                </label>

                {isCredit && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Amount Paid Upfront
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="Enter amount paid (or 0 if fully unpaid)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                )}
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
                  Confirm Sale
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Sales;
