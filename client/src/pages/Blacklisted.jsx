import React from 'react';
import { OctagonX } from 'lucide-react';

const Blacklisted = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center">
      <OctagonX size={96} className="text-red-500 mb-6" />
      <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 text-red-500">Blacklisted</h1>
      <p className="text-xl max-w-2xl uppercase tracking-widest">
        Our security system has detected a fraudulent payment attempt or usage of fake evidence.
        Your IP address has been permanently banned from our platform.
      </p>
    </div>
  );
};

export default Blacklisted;
