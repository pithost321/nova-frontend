import React, { useState } from 'react';
import { authAPI } from '../src/services/apiService';
import { UserRole } from '../types';


interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
  isLoading: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};

    // Username validation
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 3) {
      newErrors.password = 'Password must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authAPI.login(username, password);
      console.log('Login successful:', response);
      // Call the onLogin function with the API response
      onLogin(username, password);
    } catch (error) {
      console.error('Login failed:', error);
      setErrors({ password: 'Invalid username or password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/Gemini_Generated_Image_ick7v1ick7v1ick7.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/60 to-indigo-900/70 backdrop-blur-[2px]"></div>
      </div>
      
      <div className="w-full max-w-5xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-12 bg-blue-500 rounded-lg"></div>
                <div>
                  <h1 className="text-5xl font-black text-blue-600 tracking-tight">NOVA</h1>
                  <p className="text-blue-500 font-semibold text-sm uppercase tracking-wider">Call Center Analytics</p>
                </div>
              </div>
              
              <p className="text-lg text-white leading-relaxed drop-shadow">
                Real-time performance tracking and analytics for modern call center operations
              </p>
            </div>
            
            {/* Feature List */}
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-6 bg-white rounded-full mt-0.5 shadow-lg"></div>
                <div>
                  <div className="text-white font-bold text-sm drop-shadow">Live Metrics Dashboard</div>
                  <div className="text-blue-100 text-xs">Monitor performance in real-time</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-6 bg-white rounded-full mt-0.5 shadow-lg"></div>
                <div>
                  <div className="text-white font-bold text-sm drop-shadow">Team Management</div>
                  <div className="text-blue-100 text-xs">Track agent productivity and goals</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-6 bg-white rounded-full mt-0.5 shadow-lg"></div>
                <div>
                  <div className="text-white font-bold text-sm drop-shadow">Performance Analytics</div>
                  <div className="text-blue-100 text-xs">Data-driven insights and reporting</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="w-full">
            {/* Mobile Header */}
            <div className="lg:hidden mb-6 text-center">
              <h1 className="text-4xl font-black text-white tracking-tight mb-2 drop-shadow-lg">NOVA CRM</h1>
              <p className="text-blue-200 text-sm drop-shadow">Analytics Dashboard</p>
            </div>

            {/* Login Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all backdrop-blur-sm bg-opacity-95">
              {/* Card Header */}
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-blue-900">Sign In</h2>
                <p className="text-xs text-blue-600 mt-2 uppercase tracking-widest">Access your dashboard</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-xs font-black text-blue-600 mb-2 uppercase tracking-widest">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors({ ...errors, username: undefined });
                    }}
                    placeholder="Enter your username"
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all ${
                      errors.username ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-white'
                    }`}
                    disabled={isSubmitting || isLoading}
                  />
                  {errors.username && (
                    <p className="mt-2 text-xs text-red-500 font-semibold">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-xs font-black text-blue-600 mb-2 uppercase tracking-widest">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all ${
                      errors.password ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-white'
                    }`}
                    disabled={isSubmitting || isLoading}
                  />
                  {errors.password && (
                    <p className="mt-2 text-xs text-red-500 font-semibold">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-black py-3.5 rounded-lg transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {/* Info Box */}
                <div className="p-4 bg-white border-2 border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-600 font-semibold">
                    Use your assigned credentials to access the platform
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="text-center mt-8">
          <p className="text-white text-sm font-semibold drop-shadow">
            NOVA Call Center Analytics Platform
          </p>
          <p className="text-blue-200 text-xs mt-1 drop-shadow">
            © 2025 All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
