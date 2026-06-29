import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Box, 
  AlertTriangle,
  FolderOpen,
  Palette,
  Sliders
} from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Standard');
  const [color, setColor] = useState('Red');
  const [threshold, setThreshold] = useState(500);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Default Categories & Colors choices
  const categoryChoices = ['Standard', 'Decorative', 'Eco', 'Boundary', 'Other'];
  const colorChoices = ['Red', 'Grey', 'Yellow', 'Black', 'Natural', 'Terracotta'];

  const fetchProducts = async () => {
    try {
      const res = await api.get('products/');
      setProducts(res.data.results || res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load products.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setModalType('add');
    setName('');
    setCategory('Standard');
    setColor('Red');
    setThreshold(500);
    setDescription('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setModalType('edit');
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category);
    setColor(product.color);
    setThreshold(product.low_stock_threshold);
    setDescription(product.description || '');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !color.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const payload = {
      name,
      category,
      color,
      low_stock_threshold: parseInt(threshold),
      description
    };

    try {
      if (modalType === 'add') {
        await api.post('products/', payload);
        setSuccess('Product added successfully!');
      } else {
        await api.put(`products/${editingId}/`, payload);
        setSuccess('Product updated successfully!');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.non_field_errors?.[0] || 
                     err.response?.data?.detail || 
                     'A product with this combination of name and color already exists.';
      setError(errMsg);
    }
  };

  const handleDelete = async (id, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? Historical production and sales logs will prevent this delete if linked.`)) {
      try {
        await api.delete(`products/${id}/`);
        setSuccess('Product deleted.');
        fetchProducts();
      } catch (err) {
        console.error(err);
        setError('Cannot delete product. It is linked to existing production or sales records (integrity protection).');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.color.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Product Directory</h2>
          <p className="text-xs text-slate-400 mt-1">Configure finished product types, colors, and low stock warnings.</p>
        </div>
        
        <button
          onClick={openAddModal}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>New Product</span>
        </button>
      </div>

      {/* Feedback banners */}
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

      {/* Filters and Search */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 max-w-md">
        <Search className="text-slate-500 mr-2" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product name, category, or color..."
          className="bg-transparent border-none outline-none text-sm text-slate-100 w-full placeholder-slate-600"
        />
      </div>

      {/* Products Table Card */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <Box className="mx-auto text-slate-700 mb-4" size={48} />
          <h3 className="text-slate-400 font-semibold font-display">No Products Found</h3>
          <p className="text-xs text-slate-500 mt-1">Add products first to record production and sales entries.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-950/20">
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Color Option</th>
                  <th className="py-4 px-6 text-right">Current Inventory</th>
                  <th className="py-4 px-6 text-right">Low Stock Limit</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredProducts.map((p) => {
                  const isLow = p.current_stock < p.low_stock_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-slate-950/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-200 text-sm">{p.name}</p>
                          <p className="text-[10px] text-slate-500 italic max-w-xs truncate">{p.description || 'No description'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-medium font-mono text-[10px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-inner"
                            style={{ 
                              backgroundColor: p.color.toLowerCase() === 'grey' ? '#6b7280' : 
                                              p.color.toLowerCase() === 'red' ? '#ef4444' : 
                                              p.color.toLowerCase() === 'yellow' ? '#eab308' : 
                                              p.color.toLowerCase() === 'black' ? '#111827' : 
                                              p.color.toLowerCase() === 'natural' ? '#cbd5e1' : '#f97316'
                            }}
                          />
                          <span className="font-semibold text-slate-300">{p.color}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono">
                        <span className={`font-black ${isLow ? 'text-orange-500' : 'text-slate-300'}`}>
                          {parseFloat(p.current_stock || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-500">
                        {parseFloat(p.low_stock_threshold || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800/80 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, `${p.color} ${p.name}`)}
                            className="p-2 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800/80 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Modal Dialog for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
                {modalType === 'add' ? 'Add New Product' : 'Modify Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Product Name*
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Zigzag Paver Block"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Category*
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Standard, Decorative, Eco"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Color*
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Red, Grey, Yellow"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Low Stock Threshold*
                  </label>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    min="1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional product specifications, strength notes, size detail..."
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
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
