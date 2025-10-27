
import React from 'react';
import { ShieldCheckIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center space-x-4">
        <ShieldCheckIcon className="h-10 w-10 text-cyan-500" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Microgrid Blockchain Simulator</h1>
          <p className="text-sm text-gray-400 mt-1">Visualizing secure, decentralized energy data.</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
