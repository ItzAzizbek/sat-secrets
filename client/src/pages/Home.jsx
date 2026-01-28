import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../components/Dashboard';
import Manifesto from './Manifesto';
import { Loader2 } from 'lucide-react';

const Home = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-black" size={48} />
      </div>
    );
  }

  // If the user is authenticated, they see the Dashboard (Business Logic).
  // If the user is a visitor, they see the Manifesto (Trust Logic).
  return user ? <Dashboard /> : <Manifesto />;
};

export default Home;
