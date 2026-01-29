import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { ArrowRight, Shield, Lock, EyeOff, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  return (
    <Layout>
      <div className="w-full">
        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col justify-center px-8 md:px-12 max-w-7xl mx-auto border-b border-black/10">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
              Precision <br />
              <span className="text-gray-400">Over</span> Promises
            </h1>
            <p className="text-lg md:text-2xl font-medium tracking-wide max-w-2xl mb-12">
              Access verified examination materials. <br className="hidden md:block"/>
              No noise. No tracking. Just the material.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-4 bg-black text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-all group"
            >
              Enter The Archive
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Principles Section */}
        <section className="py-24 px-8 md:px-12 max-w-7xl mx-auto border-b border-black/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="col-span-1">
              <h2 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-black"></span>
                Operating Principles
              </h2>
            </div>
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-4">Clarity</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We simplify the process. You get exactly what you need to prepare, without unnecessary complexity.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-4">Discretion</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We respect your privacy. We do not ask for your name or personal data. It is not required.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-4">Certainty</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                   We verify everything. Every document is checked for authenticity before it reaches you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy / Architecture Section */}
        <section className="bg-black text-white py-24 px-8 md:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8">
                Architecture <br/> of Trust
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <EyeOff className="mt-1" size={24} />
                  <div>
                    <h4 className="font-bold uppercase tracking-wider mb-2">Zero Tracking</h4>
                    <p className="text-gray-400 text-sm">We do not track you. We do not want your data. The platform works without knowing who you are.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Lock className="mt-1" size={24} />
                  <div>
                    <h4 className="font-bold uppercase tracking-wider mb-2">Crypto Only</h4>
                    <p className="text-gray-400 text-sm">We accept only cryptocurrency. This ensures the transaction is secure and leaves no personal record.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-white/20 p-8 md:p-12">
              <p className="text-lg md:text-xl font-medium leading-relaxed">
                "Privacy is our foundation. We designed this platform to protect you by default. We do not collect what we do not need."
              </p>
            </div>
          </div>
        </section>

        {/* The Standard / Credibility Section */}
        <section className="py-24 px-8 md:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter">The Standard</h2>
            <p className="text-sm max-w-md text-right md:text-left">
              Credibility comes from consistency. We verify so you can be sure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="border-t-2 border-black pt-6">
               <div className="flex items-center gap-3 mb-4">
                 <Shield size={20} />
                 <h3 className="font-bold uppercase tracking-wider">AI Analysis</h3>
               </div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">
                 We use technology to verify authenticity against past exams.
               </p>
             </div>
             <div className="border-t-2 border-black pt-6">
               <div className="flex items-center gap-3 mb-4">
                 <CheckCircle size={20} />
                 <h3 className="font-bold uppercase tracking-wider">Human Review</h3>
               </div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">
                 Experts check every document for completeness and accuracy.
               </p>
             </div>
             <div className="border-t-2 border-black pt-6">
               <div className="flex items-center gap-3 mb-4">
                 <Lock size={20} />
                 <h3 className="font-bold uppercase tracking-wider">Secure Delivery</h3>
               </div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">
                 Content is delivered safely and directly to you.
               </p>
             </div>
          </div>

          <div className="mt-24 text-center">
            <Link
              to="/login"
              className="inline-block text-xs font-black uppercase tracking-[0.2em] border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors"
            >
              Proceed to Authentication
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default LandingPage;
