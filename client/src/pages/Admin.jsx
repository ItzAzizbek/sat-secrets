import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../constants';
import { Check, X, Eye, Loader2, Plus, Package, Calendar, Trash2, DollarSign } from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'products'
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Product creation form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    exam: '',
    dates: [''],
    description: '',
    price: ''
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) {
      navigate('/', { replace: true });
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (authLoading || !user || !ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) return;
    // Wrap in try-catch to prevent unhandled promise rejections
    const loadData = async () => {
      try {
        await Promise.all([fetchRequests(), fetchProducts()]);
      } catch (error) {
        // Errors are already handled in individual functions
        // This just prevents unhandled promise rejection warnings
      }
    };
    loadData();
  }, [authLoading, user]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/requests', {
        timeout: 5000,
        validateStatus: () => true
      });
      if (res.status === 200) {
        setRequests(res.data.requests || []);
      } else {
        setRequests([]);
      }
    } catch (error) {
      // Silently handle connection errors
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        setRequests([]);
      } else {
        console.error('Error fetching requests:', error);
        setRequests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await api.get('/products', {
        timeout: 5000,
        validateStatus: () => true
      });
      if (res.status === 200) {
        setProducts(res.data.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      // Silently handle connection errors
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        setProducts([]);
      } else {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
    } finally {
      setProductsLoading(false);
    }
  };

  const handleDecision = async (id, decision) => {
    try {
      const res = await api.post('/admin/decision', { orderId: id, decision }, {
        timeout: 10000,
        validateStatus: () => true
      });

      if (res.status >= 200 && res.status < 300) {
        setRequests(requests.map(req => req.id === id ? { ...req, status: decision } : req));
        setSelectedRequest(null);
      } else {
        throw new Error(res.data?.error || 'Failed to save decision');
      }
    } catch (error) {
      // Only log non-connection errors
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        console.error('Error saving decision:', error);
      }
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save decision. Make sure the server is running.';
      alert(errorMessage);
    }
  };

  const handleAddDate = () => {
    setProductForm({ ...productForm, dates: [...productForm.dates, ''] });
  };

  const handleDateChange = (index, value) => {
    const newDates = [...productForm.dates];
    newDates[index] = value;
    setProductForm({ ...productForm, dates: newDates });
  };

  const handleRemoveDate = (index) => {
    const newDates = productForm.dates.filter((_, i) => i !== index);
    setProductForm({ ...productForm, dates: newDates.length > 0 ? newDates : [''] });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const validDates = productForm.dates.filter(d => d.trim() !== '');
      if (!productForm.exam || validDates.length === 0) {
        alert('Please provide exam name and at least one date');
        return;
      }

      const res = await api.post('/products', {
        exam: productForm.exam,
        dates: validDates,
        description: productForm.description,
        price: productForm.price === '' ? undefined : parseFloat(productForm.price)
      }, {
        timeout: 10000,
        validateStatus: () => true
      });

      if (res.status >= 200 && res.status < 300) {
        setProductForm({ exam: '', dates: [''], description: '', price: '' });
        setShowProductForm(false);
        await fetchProducts();
        alert('Product created successfully');
      } else {
        throw new Error(res.data?.error || 'Failed to create product');
      }
    } catch (error) {
      // Only log non-connection errors
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        console.error('Error creating product:', error);
      }
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create product. Make sure the server is running.';
      alert(errorMessage);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/products/${id}`, {
        timeout: 10000,
        validateStatus: () => true
      });

      if (res.status >= 200 && res.status < 300) {
        await fetchProducts();
        alert('Product deleted successfully');
      } else {
        throw new Error(res.data?.error || 'Failed to delete product');
      }
    } catch (error) {
      // Only log non-connection errors
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        console.error('Error deleting product:', error);
      }
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete product. Make sure the server is running.';
      alert(errorMessage);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-black" size={48} />
        </div>
      </Layout>
    );
  }
  if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) {
    return null;
  }

  return (
    <Layout>
      <div className="flex-1 p-8 md:p-12 bg-gray-50 min-h-screen font-mono">
        <div className="flex justify-between items-center mb-8 border-b border-black pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Command Center</h2>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Admin // {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'orders'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'products'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Products
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <>
            {loading ? (
              <div className="flex justify-center h-64 items-center">
                <Loader2 className="animate-spin text-black" size={48} />
              </div>
            ) : (
              <div className="bg-white border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black text-white uppercase text-[10px] tracking-[0.2em]">
                      <th className="p-6 font-medium">Order ID</th>
                      <th className="p-6 font-medium">Timestamp</th>
                      <th className="p-6 font-medium">Confidence</th>
                      <th className="p-6 font-medium">AI Verdict</th>
                      <th className="p-6 font-medium">State</th>
                      <th className="p-6 font-medium text-right">Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs uppercase font-bold tracking-wide">
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-400">
                          No signals detected.
                        </td>
                      </tr>
                    ) : (
                      requests.map(req => (
                        <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                          <td className="p-6 font-mono text-gray-500 group-hover:text-black transition-colors">
                            #{req.id.slice(0, 8)}
                          </td>
                          <td className="p-6">{new Date(req.timestamp).toLocaleString()}</td>
                          <td className="p-6">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${req.ai_decision?.confidence > 0.8 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                style={{ width: `${(req.ai_decision?.confidence || 0) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {((req.ai_decision?.confidence || 0) * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="p-6">
                            {req.ai_decision?.isReal ? (
                              <span className="inline-flex items-center gap-2 text-green-600">
                                <div className="w-2 h-2 rounded-full bg-green-600"></div> REAL
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 text-red-600 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-red-600"></div> FAKE
                              </span>
                            )}
                          </td>
                          <td className="p-6">
                            <span
                              className={`px-2 py-1 ${
                                req.status === 'FAKE'
                                  ? 'bg-red-100 text-red-600'
                                  : req.status === 'REAL'
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {req.status || 'PENDING'}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="text-black border border-gray-200 hover:bg-black hover:text-white px-4 py-2 transition-all text-[10px] tracking-widest inline-flex items-center gap-2"
                            >
                              <Eye size={12} /> Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {selectedRequest && (
              <div
                className="fixed inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
                onClick={() => setSelectedRequest(null)}
              >
                <div
                  className="bg-white border border-black shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-full md:w-1/2 bg-gray-100 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-black/10">
                    <img
                      src={selectedRequest.image_url}
                      alt="Proof"
                      className="max-w-full shadow-lg border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500"
                    />
                  </div>

                  <div className="w-full md:w-1/2 p-8 md:p-12 relative">
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="absolute top-6 right-6 hover:rotate-90 transition-transform duration-300"
                    >
                      <X size={24} />
                    </button>

                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Analysis Report</h3>

                    <div className="space-y-6 text-sm mb-12">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">AI Verdict</p>
                        <p className="font-bold text-lg">
                          {selectedRequest.ai_decision?.isReal ? 'AUTHENTIC' : 'MANIPULATED'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Reasoning</p>
                        <p className="leading-relaxed border-l-2 border-black pl-4 py-2 bg-gray-50">
                          {selectedRequest.ai_decision?.reason}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Contact</p>
                        <p className="font-mono bg-gray-100 px-2 py-1 inline-block">{selectedRequest.contact_info}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleDecision(selectedRequest.id, 'REAL')}
                        className="bg-white border-2 border-green-500 text-green-600 p-4 uppercase font-black text-xs tracking-[0.2em] hover:bg-green-500 hover:text-white transition-all flex flex-col items-center gap-2 group"
                      >
                        <Check size={24} className="group-hover:scale-110 transition-transform" />
                        Valid
                      </button>
                      <button
                        onClick={() => handleDecision(selectedRequest.id, 'FAKE')}
                        className="bg-white border-2 border-red-500 text-red-600 p-4 uppercase font-black text-xs tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex flex-col items-center gap-2 group"
                      >
                        <X size={24} className="group-hover:scale-110 transition-transform" />
                        Fraud (Ban IP)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tighter">Manage Products</h3>
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all inline-flex items-center gap-2"
              >
                <Plus size={16} /> Create Product
              </button>
            </div>

            {showProductForm && (
              <div className="bg-white border-2 border-black p-8 shadow-xl">
                <h4 className="text-lg font-black uppercase mb-6 tracking-tighter">New Product</h4>
                <form onSubmit={handleCreateProduct} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500">
                      Exam Name
                    </label>
                    <input
                      type="text"
                      value={productForm.exam}
                      onChange={(e) => setProductForm({ ...productForm, exam: e.target.value })}
                      className="w-full border-2 border-gray-200 focus:border-black py-3 px-4 text-lg font-medium focus:outline-none transition-all"
                      placeholder="e.g., SAT"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500 flex items-center gap-2">
                      <DollarSign size={12} />
                      Price (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full border-2 border-gray-200 focus:border-black py-3 px-4 text-lg font-medium focus:outline-none transition-all"
                      placeholder="e.g., 99.00"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500 flex items-center gap-2">
                      <Calendar size={12} />
                      Exam Dates
                    </label>
                    <div className="space-y-3">
                      {productForm.dates.map((date, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => handleDateChange(index, e.target.value)}
                            className="flex-1 border-2 border-gray-200 focus:border-black py-3 px-4 text-lg font-medium focus:outline-none transition-all"
                            required
                          />
                          {productForm.dates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDate(index)}
                              className="bg-red-100 text-red-600 px-4 py-3 hover:bg-red-200 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddDate}
                        className="w-full border-2 border-dashed border-gray-300 py-3 text-sm font-bold uppercase tracking-widest text-gray-400 hover:border-black hover:text-black transition-all"
                      >
                        + Add Another Date
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500">
                      Description (Optional)
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full border-2 border-gray-200 focus:border-black py-3 px-4 text-sm focus:outline-none transition-all resize-none"
                      rows="3"
                      placeholder="Product description..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
                    >
                      Create Product
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductForm(false);
                        setProductForm({ exam: '', dates: [''], description: '', price: '' });
                      }}
                      className="bg-white border-2 border-black text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {productsLoading ? (
              <div className="flex justify-center h-64 items-center">
                <Loader2 className="animate-spin text-black" size={48} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    No products found. Create your first product above.
                  </div>
                ) : (
                  products.map(product => (
                    <div key={product.id} className="bg-white border-2 border-gray-200 p-6 hover:border-black transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Package size={20} className="text-gray-400" />
                          <h4 className="text-xl font-black uppercase tracking-tighter">{product.exam}</h4>
                          {product.price != null && (
                            <span className="text-sm font-bold uppercase tracking-wide text-black">
                              ${Number(product.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {product.description && (
                        <p className="text-xs text-gray-500 mb-4">{product.description}</p>
                      )}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Available Dates:</p>
                        <div className="flex flex-wrap gap-2">
                          {product.dates && product.dates.length > 0 ? (
                            product.dates
                              .filter(d => d.available)
                              .map((dateObj, idx) => (
                                <span
                                  key={idx}
                                  className="bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wide"
                                >
                                  {new Date(dateObj.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              ))
                          ) : (
                            <span className="text-xs text-gray-400">No dates available</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;
