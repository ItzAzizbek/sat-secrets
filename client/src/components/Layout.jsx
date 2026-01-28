import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../constants';
import Chatbox from './Chatbox';

const Layout = ({ children }) => {
  const { user, signOut } = useAuth();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim());

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans selection:bg-black selection:text-white">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-black/5 py-4 px-8 flex justify-between items-center transition-all duration-300">
        <Link to="/" className="text-xl font-black tracking-tighter uppercase flicker-on-hover">
          Secrets<span className="text-gray-400">Of</span>SAT
        </Link>
        <nav className="flex gap-8 text-xs font-bold uppercase tracking-widest">
          <Link to="/" className="hover:text-gray-500 transition-colors relative group">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="hover:text-gray-500 transition-colors relative group">
              Admin
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
            </Link>
          )}
          {user ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="hover:text-gray-500 transition-colors relative group"
            >
              Logout
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
            </button>
          ) : (
            <Link to="/login" className="hover:text-gray-500 transition-colors relative group">
              Login
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col pt-20">
        {children}
      </main>

      <footer className="border-t border-black/10 py-8 bg-gray-50 text-center text-[10px] uppercase tracking-[0.2em] text-gray-400">
        &copy; {new Date().getFullYear()} Secrets Of SAT. 
        <span className="hidden md:inline mx-2">|</span> 
        Premium Exam Leaks
      </footer>
      <Chatbox />
    </div>
  );
};

export default Layout;
