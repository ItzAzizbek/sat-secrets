import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import { Loader2, Package, Calendar, ShoppingCart } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [dateSelections, setDateSelections] = useState({});

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await api.get('/products', { timeout: 5000, validateStatus: () => true });
        if (res.status === 200) {
          setProducts(res.data.products || []);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    if (user) fetchProducts();
  }, [user]);

  const handlePurchase = (product) => {
    const availableDates = product.dates?.filter((d) => d.available)?.map((d) => d.date) || [];
    const selectedDate = dateSelections[product.id] ?? availableDates[0];
    if (!selectedDate) return;
    const offer = {
      title: `${product.exam} – Access`,
      price: product.price != null ? `$${Number(product.price).toFixed(2)}` : 'Price on request',
    };
    navigate('/checkout', { state: { offer, exam: product.exam, date: selectedDate, expectedAmount: product.price != null ? product.price : null } });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-black" size={48} />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="flex-1 p-8 md:p-12 max-w-6xl mx-auto w-full">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2">
            Premium Exam Leaks
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
            Welcome, {user.displayName || user.email}. Select a product to purchase.
          </p>
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-black" size={48} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-500 uppercase tracking-wider">
            No products available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const availableDates = product.dates?.filter((d) => d.available)?.map((d) => d.date) || [];
              const selectedDate = dateSelections[product.id] ?? availableDates[0];
              const canPurchase = availableDates.length > 0;

              return (
                <div
                  key={product.id}
                  className="bg-white border-2 border-gray-200 p-6 hover:border-black transition-all flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Package size={20} className="text-gray-400" />
                      <h3 className="text-xl font-black uppercase tracking-tighter">{product.exam}</h3>
                    </div>
                    {product.price != null && (
                      <span className="text-sm font-bold uppercase">
                        ${Number(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{product.description}</p>
                  )}
                  <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
                      <Calendar size={10} /> Date
                    </p>
                    {availableDates.length > 1 ? (
                      <select
                        value={selectedDate || ''}
                        onChange={(e) =>
                          setDateSelections((s) => ({ ...s, [product.id]: e.target.value }))
                        }
                        className="w-full border-2 border-gray-200 focus:border-black py-2 px-3 text-sm focus:outline-none"
                      >
                        {availableDates.map((d) => (
                          <option key={d} value={d}>
                            {new Date(d).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </option>
                        ))}
                      </select>
                    ) : availableDates.length === 1 ? (
                      <span className="text-sm font-medium">
                        {new Date(availableDates[0]).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No dates</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePurchase(product)}
                    disabled={!canPurchase}
                    className="mt-auto w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} /> Purchase
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;
