import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleGoogleSignIn = async () => {
    setError('');
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
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

  return (
    <Layout>
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center animate-fade-in bg-white border-r border-black/5">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
            Premium<br />
            Exam<br />
            Leaks
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500 max-w-sm ml-1">
            Sign in to access verified exam materials. AI-verified authenticity.
          </p>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-gray-50 animate-slide-up">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8 pl-4 border-l-4 border-black">
              <h2 className="text-xl font-bold uppercase tracking-tight">Sign In</h2>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Google only</p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full bg-white border-2 border-black text-black py-5 font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingIn ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {signingIn ? 'Signing in…' : 'Continue with Google'}
            </button>

            {error && (
              <p className="mt-4 text-red-600 text-xs font-bold uppercase tracking-wide">{error}</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
