import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Layers, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles,
  Palette,
  Box
} from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchInventory = async () => {
    try {
      // Products endpoints return annotated current_stock
      const res = await api.get('products/');
      setProducts(res.data.results || res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch current stock inventory.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.color.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by Product Name (Type)
  const productGroupMap = {};
  products.forEach(p => {
    if (!productGroupMap[p.name]) {
      productGroupMap[p.name] = { name: p.name, category: p.category, stock: 0 };
    }
    productGroupMap[p.name].stock += parseFloat(p.current_stock || 0);
  });
  const productGroups = Object.values(productGroupMap);

  // Group by Product Color
  const colorGroupMap = {};
  products.forEach(p => {
    if (!colorGroupMap[p.color]) {
      colorGroupMap[p.color] = { color: p.color, stock: 0 };
    }
    colorGroupMap[p.color].stock += parseFloat(p.current_stock || 0);
  });
  const colorGroups = Object.values(colorGroupMap);

  // General Totals
  const totalStock = products.reduce((acc, curr) => acc + parseFloat(curr.current_stock || 0), 0);
  const lowStockCount = products.filter(p => parseFloat(p.current_stock || 0) < parseFloat(p.low_stock_threshold || 0)).length;

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">Stock & Inventory Board</h2>
        <p className="text-xs text-slate-400 mt-1">Real-time counts of finished blocks in the storage yard, computed from production and sales dispatches.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-200 text-xs flex items-center space-x-3">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* Top Aggregates Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-orange-950/40 border border-orange-500/20 rounded-xl text-orange-500">
                <Layers size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">Total Stock Available</p>
                <h3 className="text-2xl font-black text-slate-100 font-display mt-0.5">
                  {totalStock.toLocaleString()} <span className="text-xs text-slate-500 font-normal">pcs</span>
                </h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-500">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">Low Stock Items</p>
                <h3 className="text-2xl font-black text-red-400 font-display mt-0.5">
                  {lowStockCount} <span className="text-xs text-slate-500 font-normal">warnings</span>
                </h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl text-blue-500">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">Active Varieties</p>
                <h3 className="text-2xl font-black text-slate-100 font-display mt-0.5">
                  {products.length} <span className="text-xs text-slate-500 font-normal">combinations</span>
                </h3>
              </div>
            </div>

          </div>

          {/* Grouped Stock Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Product Type Breakdown */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase font-mono flex items-center space-x-2">
                <Box size={16} className="text-orange-500" />
                <span>Product Type Stock Summaries</span>
              </h3>
              
              <div className="divide-y divide-slate-800/60">
                {productGroups.map(grp => (
                  <div key={grp.name} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{grp.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{grp.category}</p>
                    </div>
                    <span className="font-bold text-slate-300 font-mono">
                      {grp.stock.toLocaleString()} pcs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Color-wise Breakdown */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase font-mono flex items-center space-x-2">
                <Palette size={16} className="text-indigo-500" />
                <span>Color-wise Stock Summaries</span>
              </h3>
              
              <div className="divide-y divide-slate-800/60">
                {colorGroups.map(grp => (
                  <div key={grp.color} className="py-3 flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-slate-800"
                        style={{ 
                          backgroundColor: grp.color.toLowerCase() === 'grey' ? '#6b7280' : 
                                          grp.color.toLowerCase() === 'red' ? '#ef4444' : 
                                          grp.color.toLowerCase() === 'yellow' ? '#eab308' : 
                                          grp.color.toLowerCase() === 'black' ? '#111827' : 
                                          grp.color.toLowerCase() === 'natural' ? '#cbd5e1' : '#f97316'
                        }}
                      />
                      <span className="font-bold text-slate-200">{grp.color}</span>
                    </div>
                    <span className="font-bold text-slate-300 font-mono">
                      {grp.stock.toLocaleString()} pcs
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Detailed Inventory Register */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-sm font-bold tracking-wider text-slate-300 font-mono uppercase">
                Detailed Product Inventory List
              </h3>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 w-full sm:max-w-xs">
                <Search className="text-slate-500 mr-2" size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search stock details..."
                  className="bg-transparent border-none outline-none text-xs text-slate-100 w-full placeholder-slate-700"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-950/20">
                      <th className="py-4 px-6">Product Item</th>
                      <th className="py-4 px-6">Color</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6 text-right">Current Stock</th>
                      <th className="py-4 px-6 text-right">Warning Limit</th>
                      <th className="py-4 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredProducts.map((p) => {
                      const isLow = parseFloat(p.current_stock || 0) < parseFloat(p.low_stock_threshold || 0);
                      return (
                        <tr key={p.id} className="hover:bg-slate-950/20 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-200">{p.name}</td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center space-x-1.5">
                              <span className="w-2.5 h-2.5 rounded-full border border-slate-750" style={{ 
                                backgroundColor: p.color.toLowerCase() === 'grey' ? '#6b7280' : 
                                                p.color.toLowerCase() === 'red' ? '#ef4444' : 
                                                p.color.toLowerCase() === 'yellow' ? '#eab308' : 
                                                p.color.toLowerCase() === 'natural' ? '#cbd5e1' : '#f97316'
                              }}></span>
                              <span>{p.color}</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-mono text-[10px]">{p.category}</td>
                          <td className="py-4 px-6 text-right font-black font-mono text-sm">
                            <span className={isLow ? 'text-red-500' : 'text-green-500'}>
                              {parseFloat(p.current_stock || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-slate-500 font-mono">{parseFloat(p.low_stock_threshold || 0).toLocaleString()}</td>
                          <td className="py-4 px-6 text-center">
                            {isLow ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-950/30 text-red-400 border border-red-900/40 uppercase tracking-wide">
                                Low Stock Alert
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-950/10 text-green-400 border border-green-900/30 uppercase tracking-wide">
                                Healthy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Inventory;
