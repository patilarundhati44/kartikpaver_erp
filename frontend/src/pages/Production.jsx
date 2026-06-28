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
  Hammer,
  SlidersHorizontal,
  PlusCircle,
  MinusCircle
} from 'lucide-react';

const ProductionPage = () => {
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

  const [productions, setProductions] = useState([]);
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
  const [productionDateDisplay, setProductionDateDisplay] = useState('');
  const [productNameInput, setProductNameInput] = useState('');
  const [quantity, setQuantity] = useState('');
  const [productionItems, setProductionItems] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchInitialData = async () => {
    try {
      // 1. Fetch products list for datalist suggestions
      const prodRes = await api.get('products/');
      const prodList = prodRes.data.results || prodRes.data || [];
      setProducts(prodList);
      
      if (prodList.length > 0) {
        setProductNameInput(`${prodList[0].color} ${prodList[0].name}`);
      }

      // 2. Fetch production records
      await fetchProductions();
    } catch (err) {
      console.error(err);
      setError('Failed to fetch initial data.');
      setLoading(false);
    }
  };

  const fetchProductions = async () => {
    try {
      let url = 'productions/';
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const res = await api.get(url);
      setProductions(res.data.results || res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load production logs.');
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

  // Re-fetch when date filters change
  useEffect(() => {
    fetchProductions();
  }, [startDate, endDate]);

  const openAddModal = () => {
    setModalType('add');
    const todayStr = new Date().toISOString().split('T')[0];
    setProductionDateDisplay(formatDateToDisplay(todayStr));
    setProductNameInput('');
    setQuantity('');
    setProductionItems([]);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setModalType('edit');
    setEditingId(entry.id);
    setProductionDateDisplay(formatDateToDisplay(entry.production_date));
    setProductNameInput(`${entry.product_color} ${entry.product_name}`);
    setQuantity(entry.quantity);
    setError('');
    setShowModal(true);
  };

  const handleAddItem = () => {
    setError('');
    setSuccess('');

    const matchedProduct = products.find(
      p => `${p.color} ${p.name}`.toLowerCase() === productNameInput.trim().toLowerCase()
    );

    if (!productNameInput || !quantity) {
      setError('Please select a product and enter a quantity.');
      return;
    }

    if (!matchedProduct) {
      setError('Please enter a valid product name from the suggestions list.');
      return;
    }

    const qtyVal = parseInt(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError('Quantity produced must be greater than zero.');
      return;
    }

    const exists = productionItems.some(item => item.productId === matchedProduct.id);
    if (exists) {
      setError('This product is already added to the batch list below.');
      return;
    }

    setProductionItems([
      ...productionItems,
      {
        productId: matchedProduct.id,
        productName: matchedProduct.name,
        productColor: matchedProduct.color,
        productCategory: matchedProduct.category,
        quantity: qtyVal
      }
    ]);

    setProductNameInput('');
    setQuantity('');
  };

  const handleRemoveItem = (index) => {
    setProductionItems(productionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productionDateDisplay) {
      setError('Please enter the production date.');
      return;
    }

    if (!isValidDisplayDate(productionDateDisplay)) {
      setError('Please enter Date in DD/MM/YYYY format (e.g. 17/06/2026).');
      return;
    }

    const formattedDate = parseDisplayToDate(productionDateDisplay);

    try {
      if (modalType === 'add') {
        let itemsToSubmit = [...productionItems];

        if (itemsToSubmit.length === 0) {
          if (productNameInput && quantity) {
            const matchedProduct = products.find(
              p => `${p.color} ${p.name}`.toLowerCase() === productNameInput.trim().toLowerCase()
            );
            const qtyVal = parseInt(quantity);
            if (matchedProduct && qtyVal > 0) {
              itemsToSubmit.push({
                productId: matchedProduct.id,
                productName: matchedProduct.name,
                productColor: matchedProduct.color,
                productCategory: matchedProduct.category,
                quantity: qtyVal
              });
            } else {
              setError('Please click "+ Add" to add the product to the list, or select a valid product & quantity.');
              return;
            }
          } else {
            setError('Please add at least one product batch to the list.');
            return;
          }
        }

        const promises = itemsToSubmit.map(item =>
          api.post('productions/', {
            production_date: formattedDate,
            product: item.productId,
            quantity: item.quantity
          })
        );
        await Promise.all(promises);
        setSuccess('Production batches recorded successfully!');
      } else {
        const matchedProduct = products.find(
          p => `${p.color} ${p.name}`.toLowerCase() === productNameInput.trim().toLowerCase()
        );

        if (!matchedProduct) {
          setError('Please enter a valid product name.');
          return;
        }

        const payload = {
          production_date: formattedDate,
          product: matchedProduct.id,
          quantity: parseInt(quantity)
        };

        await api.put(`productions/${editingId}/`, payload);
        setSuccess('Production entry updated successfully!');
      }
      setShowModal(false);
      fetchProductions();
    } catch (err) {
      console.error(err);
      setError('Failed to record production batch.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this production record? Current stock levels will adjust immediately.')) {
      try {
        await api.delete(`productions/${id}/`);
        setSuccess('Production log deleted.');
        fetchProductions();
      } catch (err) {
        console.error(err);
        setError('Failed to delete production entry.');
      }
    }
  };

  // Filter based on search input
  const filteredProductions = productions.filter(p => 
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    p.product_color.toLowerCase().includes(search.toLowerCase()) ||
    p.product_category.toLowerCase().includes(search.toLowerCase())
  );

  // Compute total blocks produced
  const totalProduced = filteredProductions.reduce((acc, curr) => acc + parseInt(curr.quantity), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Daily Production Log</h2>
          <p className="text-xs text-slate-400 mt-1">Record batches of finished paver blocks produced at the factory.</p>
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
            <span>Record Production</span>
          </button>
        )}
      </div>

      {/* Warnings & Feedback */}
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
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Filter by Product</label>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Search className="text-slate-500 mr-2" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name, color..."
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
          <span className="text-[10px] font-bold uppercase text-slate-500 font-mono tracking-wider">Total Brass Produced</span>
          <span className="text-lg font-black text-orange-500 mt-1 font-display">{(totalProduced || 0).toLocaleString()} <span className="text-xs text-slate-400 font-medium">Brass</span></span>
        </div>

      </div>

      {/* Production List Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : filteredProductions.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <SlidersHorizontal className="mx-auto text-slate-700 mb-4" size={48} />
          <h3 className="text-slate-400 font-semibold font-display">No Production Batches</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting dates or log daily production.</p>
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
                  <th className="py-4 px-6 font-mono">Category</th>
                  <th className="py-4 px-6 text-right">Quantity Produced</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredProductions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-950/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-300 font-mono">
                      {formatDateToDisplay(p.production_date)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-200 text-sm">{p.product_name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1.5">
                        <span 
                          className="w-3 h-3 rounded-full border border-slate-700"
                          style={{ 
                            backgroundColor: p.product_color.toLowerCase() === 'grey' ? '#6b7280' : 
                                            p.product_color.toLowerCase() === 'red' ? '#ef4444' : 
                                            p.product_color.toLowerCase() === 'yellow' ? '#eab308' : 
                                            p.product_color.toLowerCase() === 'natural' ? '#cbd5e1' : '#f97316'
                          }}
                        />
                        <span className="text-slate-300 font-medium">{p.product_color}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-[10px]">
                      {p.product_category}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-200 font-mono text-sm">
                      {p.quantity.toLocaleString()} <span className="text-slate-500 text-[10px] font-normal">Brass</span>
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

      {/* Record/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
                {modalType === 'add' ? 'Record Production batch' : 'Edit Production Entry'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Production Date (DD/MM/YYYY)*
                </label>
                <input
                  type="text"
                  value={productionDateDisplay}
                  onChange={(e) => setProductionDateDisplay(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                  required
                />
              </div>

              {modalType === 'add' ? (
                <>
                  {/* Product Batch Builder */}
                  <div className="bg-slate-950/30 border border-slate-800/80 rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Add Product to Daily Batch
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                          Select Product
                        </label>
                        <input
                          type="text"
                          list="productListDatalist"
                          value={productNameInput}
                          onChange={(e) => setProductNameInput(e.target.value)}
                          placeholder="Type or select product..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                          Quantity Produced (Brass)
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Qty in Brass (e.g. 5)"
                            min="1"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700/85 text-slate-200 hover:text-white px-3.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-1 font-semibold"
                          >
                            <PlusCircle size={14} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Added Items List */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Batch List to Record
                    </label>
                    {productionItems.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-600 text-[11px] font-medium font-mono">
                        No products added yet. Use the builder above to list products produced.
                      </div>
                    ) : (
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20 max-h-[180px] overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-950/40 text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-800 font-mono">
                              <th className="py-2.5 px-3">Product Name</th>
                              <th className="py-2.5 px-3">Color</th>
                              <th className="py-2.5 px-3 text-right">Quantity</th>
                              <th className="py-2.5 px-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                            {productionItems.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-950/30">
                                <td className="py-2 px-3 text-slate-300 font-bold">{item.productName}</td>
                                <td className="py-2 px-3 text-slate-400">{item.productColor}</td>
                                <td className="py-2 px-3 text-right font-black text-slate-200">{item.quantity.toLocaleString()} Brass</td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
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
                </>
              ) : (
                <>
                  {/* Edit mode: original fields */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                      Select Finished Product*
                    </label>
                    <input
                      type="text"
                      list="productListDatalist"
                      value={productNameInput}
                      onChange={(e) => setProductNameInput(e.target.value)}
                      placeholder="Type or select a product..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                      Quantity Produced (Brass)*
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 5"
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                      required
                    />
                  </div>
                </>
              )}

              <datalist id="productListDatalist">
                {products.map((p) => (
                  <option key={p.id} value={`${p.color} ${p.name}`} />
                ))}
              </datalist>

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
                  {modalType === 'add' ? 'Record Batch Log' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductionPage;
