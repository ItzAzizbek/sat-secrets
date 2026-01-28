import React from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, CheckCircle, Fingerprint, Activity } from 'lucide-react';

const Section = ({ children, className = "" }) => (
  <section className={`py-24 px-8 border-b border-black/10 last:border-0 ${className}`}>
    <div className="max-w-4xl mx-auto">
      {children}
    </div>
  </section>
);

const Manifesto = () => {
  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-white">
        {/* 1. ABOVE THE FOLD TRUST FRAME */}
        <section className="min-h-[85vh] flex flex-col justify-center items-center px-8 border-b border-black text-center">
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8 animate-fade-in">
              The Standard<br />
              Of Preparation.
            </h1>
            <p className="max-w-xl text-sm md:text-base uppercase tracking-[0.2em] text-gray-500 leading-relaxed animate-slide-up animation-delay-200">
              Verified Materials. Structural Privacy. Absolute Clarity.<br/>
              We do not sell hope. We sell certainty.
            </p>
        </section>

        {/* 2. HOMEPAGE PURPOSE DEFINITION */}
        <Section>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">
                Signal In The Noise.
              </h2>
              <div className="w-12 h-1 bg-black mb-6"></div>
            </div>
            <div className="space-y-6 text-lg font-medium leading-relaxed text-gray-800">
              <p>
                The exam market is defined by anxiety, hype, and opacity.
                We reject these tools.
              </p>
              <p>
                Secrets Of SAT is a marketplace built on discipline.
                We exist for users who value precision over promises.
                If you are looking for shortcuts, look elsewhere.
                If you are looking for the source, you have arrived.
              </p>
            </div>
          </div>
        </Section>

        {/* 3. PSYCHOLOGICAL AFFINITY MECHANISMS */}
        <Section className="bg-gray-50">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 border-2 border-transparent hover:border-black transition-all duration-500">
              <Shield className="w-8 h-8 mb-4" />
              <h3 className="text-lg font-black uppercase tracking-wider mb-2">Discipline</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We verify every document before it reaches the marketplace.
                Our inventory is smaller because our standards are higher.
              </p>
            </div>
            <div className="p-8 border-2 border-transparent hover:border-black transition-all duration-500">
              <Activity className="w-8 h-8 mb-4" />
              <h3 className="text-lg font-black uppercase tracking-wider mb-2">Resilience</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our systems fail open. If our automation falters,
                we default to human trust, not rejection. Your access is the priority.
              </p>
            </div>
            <div className="p-8 border-2 border-transparent hover:border-black transition-all duration-500">
              <Eye className="w-8 h-8 mb-4" />
              <h3 className="text-lg font-black uppercase tracking-wider mb-2">Clarity</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                No hidden fees. No subscription traps.
                The price you see is the price for the certainty you need.
              </p>
            </div>
          </div>
        </Section>

        {/* 4. PRIVACY AS A VALUE SIGNAL */}
        <Section>
          <div className="flex flex-col md:flex-row gap-12 items-start">
             <div className="md:w-1/3">
                <div className="bg-black text-white p-6 inline-block">
                  <Fingerprint className="w-12 h-12" />
                </div>
             </div>
             <div className="md:w-2/3">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
                  Privacy Is Architecture.
                </h2>
                <p className="text-lg font-medium text-gray-800 mb-6">
                  We do not "respect" your privacy. We enforce it.
                </p>
                <ul className="space-y-4 text-sm uppercase tracking-wider text-gray-600 font-bold">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-black"></div>
                    IP Addresses are SHA-256 Hashed.
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-black"></div>
                    Payment proofs are ephemeral.
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-black"></div>
                    Zero third-party tracking pixels.
                  </li>
                </ul>
             </div>
          </div>
        </Section>

        {/* 5. CREDIBILITY WITHOUT AUTHORITY BORROWING */}
        <Section className="bg-black text-white text-center">
           <div className="max-w-2xl mx-auto">
              <Lock className="w-12 h-12 mx-auto mb-6 text-gray-400" />
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-6">
                Trust Without Theater.
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                You will find no fake testimonials here. No logos of universities we don't partner with.
                No countdown timers.
                <br/><br/>
                Credibility is not what we say. It is what we deliver.
              </p>
           </div>
        </Section>

        {/* 7. EMOTIONAL SAFETY DESIGN & 8. CLEAR NEXT STEP */}
        <Section className="py-32 text-center">
            <h2 className="text-xl font-bold uppercase tracking-[0.3em] text-gray-400 mb-8">
              The Path Is Open
            </h2>
            <Link
              to="/login"
              className="inline-flex items-center gap-4 bg-black text-white px-12 py-6 text-lg font-black uppercase tracking-[0.2em] hover:bg-gray-800 hover:scale-105 transition-all duration-300"
            >
              Enter The Platform
              <CheckCircle size={24} />
            </Link>
            <p className="mt-8 text-xs text-gray-400 uppercase tracking-wider max-w-sm mx-auto">
              By entering, you agree to our principles of anonymity and discretion.
            </p>
        </Section>
      </div>
    </Layout>
  );
};

export default Manifesto;
