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
  PlusCircle,
  MinusCircle
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
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form Header/Summary Fields
  const [saleDateDisplay, setSaleDateDisplay] = useState('');
  const [customer, setCustomer] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  // Items List in Current Order
  const [saleItems, setSaleItems] = useState([]);

  // Item Builder Temporary Inputs
  const [builderProductInput, setBuilderProductInput] = useState('');
  const [builderQuantity, setBuilderQuantity] = useState('');
  const [builderBrass, setBuilderBrass] = useState('');
  const [builderRate, setBuilderRate] = useState('');
  const [builderAmount, setBuilderAmount] = useState('');
  const [builderProductStock, setBuilderProductStock] = useState(0);
  const [builderRateBasis, setBuilderRateBasis] = useState('brass'); // 'brass' or 'pc'
  const [builderVehicleNo, setBuilderVehicleNo] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchInitialData = async () => {
    try {
      // 1. Fetch products to get stock balances
      const prodRes = await api.get('products/');
      const prodList = prodRes.data.results || prodRes.data || [];
      setProducts(prodList);
      
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

  // Resolve product stock limit for the builder when builder product selection changes
  useEffect(() => {
    const matchedProduct = products.find(
      p => `${p.color} ${p.name}`.toLowerCase() === builderProductInput.trim().toLowerCase()
    );
    if (matchedProduct) {
      // Stock limit is current stock + original quantity sold in this specific sale (if editing) - quantities already added in the builder list
      const alreadyAddedQty = saleItems
        .filter(item => item.product === matchedProduct.id)
        .reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);

      let originalQty = 0;
      if (modalType === 'edit' && editingId) {
        const originalSale = sales.find(s => s.id === editingId);
        if (originalSale && originalSale.items) {
          originalQty = originalSale.items
            .filter(item => item.product === matchedProduct.id)
            .reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
        }
      }

      const stockLimit = parseFloat(matchedProduct.current_stock || 0) + originalQty - alreadyAddedQty;
      setBuilderProductStock(stockLimit >= 0 ? stockLimit : 0);
    } else {
      setBuilderProductStock(0);
    }
  }, [builderProductInput, products, saleItems, modalType, editingId, sales]);

  // Auto calculate item amount based on Builder Quantity/Brass and Rate
  useEffect(() => {
    const qty = parseInt(builderQuantity) || 0;
    const brass = parseFloat(builderBrass) || 0;
    const rate = parseFloat(builderRate) || 0;
    if (builderRateBasis === 'pc') {
      if (qty > 0 && rate > 0) {
        setBuilderAmount((qty * rate).toFixed(2));
      }
    } else {
      if (brass > 0 && rate > 0) {
        setBuilderAmount((brass * rate).toFixed(2));
      }
    }
  }, [builderQuantity, builderBrass, builderRate, builderRateBasis]);

  // Add Item to the current sale list
  const handleAddItem = () => {
    setError('');
    const qty = parseInt(builderQuantity);
    const rate = parseFloat(builderRate) || 0;
    const brassVal = parseFloat(builderBrass) || 0.0;
    const amt = parseFloat(builderAmount) || (builderRateBasis === 'pc' ? qty * rate : brassVal * rate);

    const matchedProduct = products.find(
      p => `${p.color} ${p.name}`.toLowerCase() === builderProductInput.trim().toLowerCase()
    );

    if (!builderProductInput || isNaN(qty) || qty <= 0) {
      setError('Please enter a valid product and positive quantity.');
      return;
    }

    if (!matchedProduct) {
      setError('Please select a valid product from the suggestions list.');
      return;
    }

    if (qty > builderProductStock) {
      setError(`Insufficient Stock! Available stock for selected product is ${builderProductStock} units. You requested ${qty}.`);
      return;
    }

    // Add item directly to support separate vehicle dispatches of the same product
    const newItem = {
      product: matchedProduct.id,
      product_name: matchedProduct.name,
      product_color: matchedProduct.color,
      product_category: matchedProduct.category,
      quantity: qty,
      brass: brassVal,
      rate: rate,
      amount: amt,
      vehicle_no: builderVehicleNo.trim()
    };
    setSaleItems([...saleItems, newItem]);

    // Reset Builder
    setBuilderProductInput('');
    setBuilderQuantity('');
    setBuilderBrass('');
    setBuilderRate('');
    setBuilderAmount('');
    setBuilderVehicleNo('');
  };

  // Remove Item from list
  const handleRemoveItem = (index) => {
    const updated = [...saleItems];
    updated.splice(index, 1);
    setSaleItems(updated);
  };

  const openAddModal = () => {
    setModalType('add');
    const todayStr = new Date().toISOString().split('T')[0];
    setSaleDateDisplay(formatDateToDisplay(todayStr));
    setCustomer('');
    setAmountPaid('');
    setSaleItems([]);
    
    // Reset builder
    setBuilderProductInput('');
    setBuilderQuantity('');
    setBuilderBrass('');
    setBuilderRate('');
    setBuilderAmount('');
    setBuilderRateBasis('brass');
    setBuilderVehicleNo('');
    
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setModalType('edit');
    setEditingId(entry.id);
    setSaleDateDisplay(formatDateToDisplay(entry.sale_date));
    setCustomer(entry.customer_name || '');
    setAmountPaid(entry.amount_paid || '');
    
    // Map items and parse decimals/integers to JS numbers to avoid string concatenation issues
    setSaleItems((entry.items || []).map(item => ({
      ...item,
      quantity: parseInt(item.quantity) || 0,
      brass: parseFloat(item.brass) || 0.0,
      rate: parseFloat(item.rate) || 0.0,
      amount: parseFloat(item.amount) || 0.0,
      vehicle_no: item.vehicle_no || ''
    })));
    
    // Reset builder
    setBuilderProductInput('');
    setBuilderQuantity('');
    setBuilderBrass('');
    setBuilderRate('');
    setBuilderAmount('');
    setBuilderRateBasis('brass');
    setBuilderVehicleNo('');

    setError('');
    setSuccess('');
    setShowModal(true);
  };

  // Compute local order summaries
  const totalBrass = saleItems.reduce((acc, curr) => acc + parseFloat(curr.brass || 0), 0);
  const totalAmount = saleItems.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const pendingAmount = Math.max(0, totalAmount - (parseFloat(amountPaid) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!saleDateDisplay || saleItems.length === 0) {
      setError('Please enter a sale date and add at least one item.');
      return;
    }

    if (!isValidDisplayDate(saleDateDisplay)) {
      setError('Please enter Date in DD/MM/YYYY format (e.g. 17/06/2026).');
      return;
    }

    const parsedAmtPaid = parseFloat(amountPaid) || 0;
    if (parsedAmtPaid < 0) {
      setError('Amount paid cannot be negative.');
      return;
    }

    if (parsedAmtPaid > totalAmount) {
      setError('Amount paid cannot exceed the total bill amount.');
      return;
    }

    const payload = {
      sale_date: parseDisplayToDate(saleDateDisplay),
      customer_name: customer,
      sale_amount: totalAmount,
      amount_paid: parsedAmtPaid,
      items: saleItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
        brass: item.brass,
        rate: item.rate,
        amount: item.amount,
        vehicle_no: item.vehicle_no || ''
      }))
    };

    try {
      if (modalType === 'add') {
        await api.post('sales/', payload);
        setSuccess('Sale invoice registered successfully!');
      } else {
        await api.put(`sales/${editingId}/`, payload);
        setSuccess('Sale invoice updated successfully!');
      }
      setShowModal(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.items?.[0] || 
                     err.response?.data?.amount_paid?.[0] || 
                     err.response?.data?.detail || 
                     'Failed to save sale. Please verify stock and inputs.';
      setError(errMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this sale record? Inventory levels will adjust back immediately.')) {
      try {
        await api.delete(`sales/${id}/`);
        setSuccess('Sale record deleted successfully.');
        fetchInitialData();
      } catch (err) {
        console.error(err);
        setError('Failed to delete sale record.');
      }
    }
  };

  // Filter list based on search
  const filteredSales = sales.filter(s => 
    (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase())) ||
    s.items?.some(item => 
      item.product_name.toLowerCase().includes(search.toLowerCase()) || 
      item.product_color.toLowerCase().includes(search.toLowerCase())
    )
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
          <p className="text-xs text-slate-400 mt-1">Record client invoices, manage multiple products per dispatch, and track outstanding balances.</p>
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
            <span>Create Sale Bill</span>
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
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Filter by Customer / Item</label>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Search className="text-slate-500 mr-2" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, item..."
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
          <h3 className="text-slate-400 font-semibold font-display">No Sales Invoices</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting search parameters or record a new sales bill.</p>
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
                  <th className="py-4 px-6 text-right">Advance Paid</th>
                  <th className="py-4 px-6 text-right text-orange-400">Pending</th>
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
                      <span className="font-bold text-slate-200">
                        {s.customer_name || <span className="text-slate-600 italic">Walk-in</span>}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1.5 py-1">
                        {s.items && s.items.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 text-slate-300 text-xs">
                            <span className="font-black text-slate-200">{parseFloat(item.quantity || 0).toLocaleString()}</span>
                            <span className="text-slate-500 font-normal">pcs</span>
                            <span className="text-slate-400 font-medium">{item.product_color} {item.product_name}</span>
                            {parseFloat(item.brass) > 0 && (
                              <span className="text-[9px] bg-orange-950/40 border border-orange-500/25 text-orange-400 px-1 py-0.5 rounded font-mono">
                                {item.brass} Brass
                              </span>
                            )}
                            {item.vehicle_no && (
                              <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-300 px-1 py-0.5 rounded font-mono">
                                Gadi: {item.vehicle_no}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-semibold font-mono text-slate-400">
                      {parseFloat(s.total_brass) > 0 ? `${s.total_brass} Br` : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-200 font-mono">
                      {formatCurrency(s.sale_amount)}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-green-400 font-mono">
                      {formatCurrency(s.amount_paid)}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-orange-400 font-mono">
                      {parseFloat(s.due_amount) > 0 ? formatCurrency(s.due_amount) : <span className="text-green-500 font-normal text-[10px] uppercase font-mono bg-green-950/20 border border-green-500/20 px-1.5 py-0.5 rounded">Cleared</span>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800/80 transition-colors"
                          title="Edit Bill"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-2 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800/80 transition-colors"
                          title="Delete Bill"
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
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex-shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
                {modalType === 'add' ? 'Create Sale Invoice' : 'Modify Sale Invoice'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Invoice Date & Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-4 border border-slate-800/50 rounded-2xl">
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
                    Customer Name / Organization
                  </label>
                  <input
                    type="text"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="e.g. Akshay Bhya, Builders Co."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              {/* Item Builder Panel */}
              <div className="border border-slate-800 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono pb-2 border-b border-slate-800">
                  Dispatch Item Builder
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                      Select Product
                    </label>
                    <input
                      type="text"
                      list="builderProductListDatalist"
                      value={builderProductInput}
                      onChange={(e) => setBuilderProductInput(e.target.value)}
                      placeholder="Product..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                    <datalist id="builderProductListDatalist">
                      {products.map((p) => (
                        <option key={p.id} value={`${p.color} ${p.name}`} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                      Quantity (pcs)
                    </label>
                    <input
                      type="number"
                      value={builderQuantity}
                      onChange={(e) => setBuilderQuantity(e.target.value)}
                      placeholder="Qty"
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono flex items-center justify-between">
                      <span>Brass</span>
                      <span className="text-[8px] text-slate-600 font-normal">Optional</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={builderBrass}
                      onChange={(e) => setBuilderBrass(e.target.value)}
                      placeholder="Brass"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                        Rate (₹)
                      </label>
                      <div className="flex bg-slate-950 p-0.5 border border-slate-800 rounded-lg scale-90 origin-right">
                        <button
                          type="button"
                          onClick={() => setBuilderRateBasis('pc')}
                          className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all ${builderRateBasis === 'pc' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          / Pc
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuilderRateBasis('brass')}
                          className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all ${builderRateBasis === 'brass' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          / Br
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={builderRate}
                      onChange={(e) => setBuilderRate(e.target.value)}
                      placeholder={builderRateBasis === 'pc' ? "Rate per pc" : "Rate per brass"}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                      Vehicle No. / Note
                    </label>
                    <input
                      type="text"
                      value={builderVehicleNo}
                      onChange={(e) => setBuilderVehicleNo(e.target.value)}
                      placeholder="e.g. MH-12-AB-1234"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 text-[10px] text-slate-500 font-mono">
                    {builderProductInput && (
                      <span className="bg-slate-950 px-2.5 py-2 rounded-xl border border-slate-800 flex items-center justify-between h-9">
                        <span>Available Stock:</span>
                        <span className={`font-black ${builderProductStock <= 0 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                          {builderProductStock.toLocaleString()} units
                        </span>
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                      Total Item Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={builderAmount}
                      onChange={(e) => setBuilderAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all border border-slate-700/80 flex items-center justify-center space-x-1 h-9"
                  >
                    <PlusCircle size={14} />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Items Added to Bill
                </label>
                
                {saleItems.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl text-slate-600 text-xs font-medium">
                    No items added yet. Use the Dispatch Item Builder above to build your invoice.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950/40 text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-800 font-mono">
                          <th className="py-2.5 px-4">Product</th>
                          <th className="py-2.5 px-4 text-right">Quantity</th>
                          <th className="py-2.5 px-4 text-right">Brass</th>
                          <th className="py-2.5 px-4 text-right">Rate</th>
                          <th className="py-2.5 px-4 text-right">Amount</th>
                          <th className="py-2.5 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {saleItems.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-950/30">
                            <td className="py-2.5 px-4">
                              <div className="flex flex-col">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-black text-slate-300">{item.product_color}</span>
                                  <span className="text-slate-400">{item.product_name}</span>
                                </div>
                                {item.vehicle_no && (
                                  <span className="text-[9px] text-orange-400 font-mono mt-0.5">
                                    Gadi: {item.vehicle_no}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-300">
                              {parseFloat(item.quantity || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                              {item.brass > 0 ? `${item.brass} Br` : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                              {item.rate > 0 ? `₹${item.rate}` : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-slate-300">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-slate-500 hover:text-red-400 p-1"
                              >
                                <MinusCircle size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Billing Summary Section */}
              {saleItems.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono pb-2 border-b border-slate-800">
                    Billing & Payment Summary
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                    <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-slate-500 font-mono">Total Volume</span>
                      <span className="text-base font-black text-slate-200 mt-0.5 font-mono">
                        {totalBrass > 0 ? `${totalBrass.toFixed(2)} Brass` : '0 Brass'}
                      </span>
                    </div>

                    <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-slate-500 font-mono">Total Sale Amount (Bill)</span>
                      <span className="text-base font-black text-orange-500 mt-0.5 font-mono">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 font-mono">
                        Amount Paid (Advance)
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
                          placeholder="e.g. 5000"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-7 pr-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-slate-500 font-mono">Pending Balance (Due)</span>
                      <span className={`text-base font-black mt-0.5 font-mono ${pendingAmount > 0 ? 'text-red-400' : 'text-green-500'}`}>
                        {formatCurrency(pendingAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4 border-t border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saleItems.length === 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10"
                >
                  {modalType === 'add' ? 'Confirm Sale Bill' : 'Update Sale Bill'}
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
