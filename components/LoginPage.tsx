import React, { useState } from 'react';
import { ShieldCheckIcon, UserIcon, LockClosedIcon } from './Icons';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple hardcoded credentials for demo purposes
    if (username === 'admin' && password === 'password') {
      setError('');
      onLoginSuccess();
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center mb-6">
          <ShieldCheckIcon className="h-12 w-12 text-cyan-500" />
          <h1 className="text-3xl font-bold text-white ml-4">Microgrid Simulator</h1>
        </div>
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-200 mb-6">Login</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-400">Username</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <UserIcon className="h-5 w-5 text-gray-500" />
                 </div>
                 <input
                  type="text"
                  name="username"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  placeholder="admin"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <LockClosedIcon className="h-5 w-5 text-gray-500" />
                 </div>
                 <input
                  type="password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  placeholder="password"
                  required
                />
              </div>
            </div>
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div>
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-md font-semibold text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 transition-colors duration-300"
              >
                Login
              </button>
            </div>
          </form>
           <p className="text-xs text-gray-500 text-center mt-6">
              Hint: Use <span className="font-mono text-gray-400">admin</span> and <span className="font-mono text-gray-400">password</span> to log in.
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
