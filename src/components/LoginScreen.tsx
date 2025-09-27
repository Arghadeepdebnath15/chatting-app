import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MessageCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';


interface LoginScreenProps {
  onAuthSuccess: (user: { id: string; name: string; mobile: string }, token: string) => void;
}

export function LoginScreen({ onAuthSuccess }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const url = isSignUp ? 'http://localhost:3002/api/register' : 'http://localhost:3002/api/login';
    const body = isSignUp ? { name, mobile, password } : { mobile, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 dark:from-green-900 dark:via-green-800 dark:to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-2xl mb-4 group">
            <MessageCircle className="w-12 h-12 text-green-500 dark:text-green-400" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-pulse" />
          </div>
          <h1 className="text-white text-4xl mb-2 font-bold">ChatApp</h1>
          <p className="text-green-100 text-lg">Connect with friends and family</p>
        </motion.div>

        {/* Form */}
        <motion.div 
          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl text-gray-800 dark:text-white mb-3 font-bold">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
              </p>
            </div>

            <motion.div
              layout
              transition={{ duration: 0.3 }}
            >
              {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <label className="block text-gray-700 dark:text-gray-300 mb-3 font-medium">Name</label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 text-lg rounded-xl border-2 focus:border-green-500 dark:focus:border-green-400 transition-all duration-300"
                  required
                />
              </motion.div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-3 font-medium">Mobile Number</label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full h-12 text-lg rounded-xl border-2 focus:border-green-500 dark:focus:border-green-400 transition-all duration-300"
                required
              />
            </div>





              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-3 font-medium">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 text-lg rounded-xl border-2 focus:border-green-500 dark:focus:border-green-400 pr-12 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              



              {error && (
                <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}
            </motion.div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Loading...
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium text-lg transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-green-100 text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}