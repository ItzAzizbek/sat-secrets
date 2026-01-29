import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import { Loader2, Package, Calendar, ShoppingCart, Shield, Lock, CheckCircle, Users, Globe } from 'lucide-react';

import proof1 from '../assets/proofs/proof1.jpeg';
import proof2 from '../assets/proofs/proof2.jpeg';
import proof3 from '../assets/proofs/proof3.jpg';
import proof4 from '../assets/proofs/proof4.jpeg';
import proof5 from '../assets/proofs/proof5.jpeg';

const TESTIMONIALS = [
  {
    id: 1,
    name: "Azizbek O.",
    location: "Tashkent, UZ",
    text: "I was skeptical at first, but the accuracy for the November SAT was 100%. This is the only legit source I've found.",
    verified: true
  },
  {
    id: 2,
    name: "Aigerim K.",
    location: "Almaty, KZ",
    text: "Verification was fast. The admin walked me through the crypto payment. Got my score, 1500+ guaranteed.",
    verified: true
  },
  {
    id: 3,
    name: "Farid M.",
    location: "Baku, AZ",
    text: "Secure and anonymous. They don't ask for personal info. The material is exactly what you see on the exam.",
    verified: true
  },
  {
    id: 4,
    name: "Jasur T.",
    location: "Samarkand, UZ",
    text: "Simply the best. No scams, just results. Worth every penny for the peace of mind.",
    verified: true
  }
];

const TRUST_INDICATORS = [
  {
    icon: Shield,
    title: "Verified Source",
    desc: "100% Authentic Material"
  },
  {
    icon: Lock,
    title: "AES-256 Encrypted",
    desc: "Zero Logs Policy"
  },
  {
    icon: Globe,
    title: "Global Access",
    desc: "Available in CIS Region"
  },
  {
    icon: CheckCircle,
    title: "Guaranteed",
    desc: "Verified by AI Analysis"
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [dateSelections, setDateSelections] = useState({});

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

  return (
    <Layout>
      <div className="flex-1 p-8 md:p-12 max-w-6xl mx-auto w-full">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2">
            Premium Exam Leaks
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
            Welcome, {user?.displayName || user?.email}. Select a product to purchase.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {TRUST_INDICATORS.map((item, idx) => (
            <div key={idx} className="border border-gray-200 p-4 flex flex-col items-center text-center hover:border-black transition-colors">
              <item.icon size={24} className="mb-2" />
              <h4 className="text-xs font-black uppercase tracking-wider mb-1">{item.title}</h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{item.desc}</p>
            </div>
          ))}
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-black" size={48} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-500 uppercase tracking-wider border-2 border-dashed border-gray-200 mb-12">
            No products available at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
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

        {/* Proofs Section */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-8 border-b-2 border-black pb-4">
            Previous Products/Proofs
          </h2>
          <div className="flex overflow-x-auto pb-6 gap-6">
            {[proof1, proof2, proof3, proof4, proof5].map((src, index) => (
              <div
                key={index}
                className="flex-shrink-0 border-2 border-gray-200 p-2 hover:border-black transition-all bg-white"
              >
                <img
                  src={src}
                  alt={`Proof ${index + 1}`}
                  className="h-96 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="border-t border-black/10 pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Verified Reviews</h2>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-600">
              <Users size={16} />
              <span>4,800+ Students Helped</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-gray-50 p-6 border-l-4 border-black hover:bg-white hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold uppercase tracking-wide text-sm">{t.name}</h4>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">{t.location}</span>
                  </div>
                  {t.verified && (
                    <div className="flex items-center gap-1 text-[10px] bg-green-100 text-green-800 px-2 py-1 uppercase font-bold tracking-wider">
                      <CheckCircle size={10} /> Verified
                    </div>
                  )}
                </div>
                <p className="text-sm italic text-gray-600">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
