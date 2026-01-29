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
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'products', 'intelligence'
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [kbArticles, setKbArticles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [kbLoading, setKbLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');
  
  // Product creation form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    exam: '',
    dates: [''],
    description: '',
    price: ''
  });

  // KB creation form
  const [showKbForm, setShowKbForm] = useState(false);
  const [kbForm, setKbForm] = useState({ title: '', content: '', tags: '' });

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
        await Promise.all([fetchRequests(), fetchProducts(), fetchKB(), fetchTickets()]);
      } catch (error) {
        // Errors are already handled in individual functions
        // This just prevents unhandled promise rejection warnings
      }
    };
    loadData();
  }, [authLoading, user]);

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await api.get('/admin/tickets', {
        timeout: 5000,
        validateStatus: () => true
      });
      if (res.status === 200) {
        setTickets(res.data.tickets || []);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReply.trim() || !selectedTicket) return;

    try {
      const res = await api.post(`/admin/tickets/${selectedTicket.id}/reply`, { message: ticketReply });
      if (res.status === 200) {
        // Optimistically update
        const newInteraction = {
          role: 'model',
          text: ticketReply,
          timestamp: new Date().toISOString()
        };
        const updatedTicket = {
          ...selectedTicket,
          interactions: [...(selectedTicket.interactions || []), newInteraction],
          last_updated: new Date().toISOString()
        };

        setSelectedTicket(updatedTicket);
        setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
        setTicketReply('');
      } else {
        alert('Failed to send reply');
      }
    } catch (err) {
      console.error('Reply error:', err);
      alert('Error sending reply');
    }
  };

  const fetchKB = async () => {
    setKbLoading(true);
    try {
      const res = await api.get('/admin/kb', {
        timeout: 5000,
        validateStatus: () => true
      });
      if (res.status === 200) {
        setKbArticles(res.data.articles || []);
      } else {
        setKbArticles([]);
      }
    } catch (error) {
      console.error('Error fetching KB:', error);
      setKbArticles([]);
    } finally {
      setKbLoading(false);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = kbForm.tags.split(',').map(t => t.trim()).filter(t => t);
      const res = await api.post('/admin/kb', { ...kbForm, tags: tagsArray }, {
        timeout: 5000,
        validateStatus: () => true
      });

      if (res.status === 200) {
        setKbForm({ title: '', content: '', tags: '' });
        setShowKbForm(false);
        await fetchKB();
        alert('Article added successfully');
      } else {
        alert('Failed to add article');
      }
    } catch (err) {
      console.error('Error creating article:', err);
      alert('Error creating article');
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      const res = await api.delete(`/admin/kb/${id}`, {
        timeout: 5000,
        validateStatus: () => true
      });
      if (res.status === 200) {
        await fetchKB();
        alert('Article deleted');
      } else {
        alert('Failed to delete article');
      }
    } catch (err) {
      console.error('Error deleting article:', err);
    }
  };

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
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'intelligence'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Intelligence
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

        {/* Intelligence Tab */}
        {activeTab === 'intelligence' && (
          <div className="space-y-12">
            {/* Knowledge Base Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-tighter">Knowledge Base (RAG)</h3>
                <button
                  onClick={() => setShowKbForm(!showKbForm)}
                  className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                >
                  <Plus size={16} /> Add Article
                </button>
              </div>

              {showKbForm && (
                <div className="bg-white border-2 border-black p-8 shadow-xl animate-fade-in">
                  <h4 className="text-lg font-black uppercase mb-6 tracking-tighter">New Knowledge Protocol</h4>
                  <form onSubmit={handleCreateArticle} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500">
                        Title
                      </label>
                      <input
                        type="text"
                        value={kbForm.title}
                        onChange={(e) => setKbForm({ ...kbForm, title: e.target.value })}
                        className="w-full border-2 border-gray-200 focus:border-black py-3 px-4 text-sm font-medium focus:outline-none transition-all"
                        placeholder="e.g., Refund Protocol 1.0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500">
                        Content (Context for AI)
                      </label>
                      <textarea
                        value={kbForm.content}
                        onChange={(e) => setKbForm({ ...kbForm, content: e.target.value })}
                        className="w-full border-2 border-gray-200 focus:border-black py-3 px-4 text-sm focus:outline-none transition-all resize-none font-mono"
                        rows="5"
                        placeholder="Define the truth here..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500">
                        Tags (Comma separated)
                      </label>
                      <input
                        type="text"
                        value={kbForm.tags}
                        onChange={(e) => setKbForm({ ...kbForm, tags: e.target.value })}
                        className="w-full border-2 border-gray-200 focus:border-black py-3 px-4 text-sm font-medium focus:outline-none transition-all"
                        placeholder="refund, money, policy"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
                      >
                        Commit Protocol
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowKbForm(false);
                          setKbForm({ title: '', content: '', tags: '' });
                        }}
                        className="bg-white border-2 border-black text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {kbLoading ? (
                <div className="flex justify-center h-64 items-center">
                  <Loader2 className="animate-spin text-black" size={48} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {kbArticles.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 uppercase tracking-widest text-xs">
                      Knowledge Base Empty. AI is operating on base instincts.
                    </div>
                  ) : (
                    kbArticles.map(article => (
                      <div key={article.id} className="bg-white border border-gray-200 p-6 hover:border-black transition-all group relative">
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                        <h4 className="text-lg font-black uppercase tracking-tighter mb-2">{article.title}</h4>
                        <p className="text-sm font-mono bg-gray-50 p-4 mb-4 border-l-2 border-gray-200 text-gray-600">
                          {article.content}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {article.tags?.map((tag, i) => (
                            <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 text-gray-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <hr className="border-gray-200" />

            {/* Tickets Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter">Support Intelligence</h3>
                <button
                  onClick={fetchTickets}
                  className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                >
                  Refresh
                </button>
              </div>

              {ticketsLoading ? (
                <div className="flex justify-center h-64 items-center">
                  <Loader2 className="animate-spin text-black" size={48} />
                </div>
              ) : (
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black text-white uppercase text-[10px] tracking-[0.2em]">
                        <th className="p-6 font-medium">Ticket ID</th>
                        <th className="p-6 font-medium">Last Update</th>
                        <th className="p-6 font-medium">Sentiment</th>
                        <th className="p-6 font-medium">Priority</th>
                        <th className="p-6 font-medium">Summary</th>
                        <th className="p-6 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs uppercase font-bold tracking-wide">
                      {tickets.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-gray-400">
                            No active channels.
                          </td>
                        </tr>
                      ) : (
                        tickets.map(ticket => (
                          <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-6 font-mono text-gray-500">#{ticket.id.slice(0, 8)}</td>
                            <td className="p-6">{new Date(ticket.last_updated).toLocaleString()}</td>
                            <td className="p-6">
                              <span className={`px-2 py-1 ${
                                (ticket.sentiment_current || 0.5) < 0.3 ? 'bg-red-100 text-red-600' :
                                (ticket.sentiment_current || 0.5) > 0.7 ? 'bg-green-100 text-green-600' :
                                'bg-yellow-100 text-yellow-600'
                              }`}>
                                {((ticket.sentiment_current || 0.5) * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td className="p-6">
                              {ticket.priority === 'HIGH' ? (
                                <span className="bg-red-600 text-white px-2 py-1 animate-pulse">HIGH PRIORITY</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-500 px-2 py-1">{ticket.priority || 'NORMAL'}</span>
                              )}
                            </td>
                            <td className="p-6 text-gray-600 truncate max-w-xs" title={ticket.summary}>
                              {ticket.summary || 'No intelligence yet'}
                            </td>
                            <td className="p-6 text-right">
                              <button
                                onClick={() => setSelectedTicket(ticket)}
                                className="bg-black text-white px-4 py-2 hover:bg-gray-800 transition-all text-[10px] tracking-widest"
                              >
                                Open Channel
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedTicket && (
              <div
                className="fixed inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
                onClick={() => setSelectedTicket(null)}
              >
                <div
                  className="bg-white border-2 border-black shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="bg-black text-white p-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">Secure Channel</h3>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">
                        Session: {selectedTicket.sessionId}
                      </p>
                    </div>
                    <button onClick={() => setSelectedTicket(null)} className="hover:rotate-90 transition-transform">
                      <X size={24} />
                    </button>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                    {selectedTicket.interactions?.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 ${
                          msg.role === 'user'
                            ? 'bg-black text-white'
                            : 'bg-white border border-gray-200 text-black'
                        }`}>
                          <div className="flex items-center gap-2 mb-2 opacity-50 text-[10px] uppercase font-bold tracking-tighter">
                            <span>{msg.role === 'user' ? 'Target' : 'System'}</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input Area */}
                  <div className="p-6 border-t-2 border-black bg-white">
                    <form onSubmit={handleTicketReply} className="flex gap-4">
                      <input
                        type="text"
                        value={ticketReply}
                        onChange={(e) => setTicketReply(e.target.value)}
                        placeholder="Transmit message..."
                        className="flex-1 bg-gray-100 border-2 border-transparent focus:border-black focus:outline-none py-3 px-4 font-mono text-sm transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!ticketReply.trim()}
                        className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all disabled:opacity-50"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;
