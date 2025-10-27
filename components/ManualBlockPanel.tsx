import React, { useState } from 'react';
import type { NodeData } from '../types';
import { PlusCircleIcon, KeyIcon, XMarkIcon } from './Icons';
import { ADMIN_KEY } from '../constants';

// --- Reusable Admin Key Modal Component ---
interface AdminKeyModalProps {
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  description: string;
}

const AdminKeyModal: React.FC<AdminKeyModalProps> = ({ onClose, onSubmit, title, description }) => {
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (adminKey === ADMIN_KEY) {
      onSubmit();
    } else {
      setError('Invalid Admin Key. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        <div>
          <label htmlFor="modal-admin-key" className="block text-sm font-medium text-gray-400">Admin Key</label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyIcon className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="password"
              id="modal-admin-key"
              value={adminKey}
              onChange={(e) => {
                setAdminKey(e.target.value);
                setError('');
              }}
              className="pl-10 w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 sm:text-sm"
              placeholder="Enter admin key"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Hint: The key is <span className="font-mono text-gray-400">{ADMIN_KEY}</span></p>
        </div>
        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold text-sm">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold text-sm">Submit</button>
        </div>
      </div>
    </div>
  );
};

interface ManualBlockPanelProps {
  onAddBlock: (data: NodeData) => void;
}

const ManualBlockPanel: React.FC<ManualBlockPanelProps> = ({ onAddBlock }) => {
  const [solar, setSolar] = useState(0);
  const [load, setLoad] = useState(0);
  const [batterySoc, setBatterySoc] = useState(50);
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleAddSubmit = () => {
    const manualData: NodeData = {
      solar: { generation: solar },
      load: { consumption: load },
      battery: { soc: batterySoc, flow: 0 },
      grid: { flow: 0 },
      weather: { description: 'Manual Entry', cloudCover: 0 },
    };
    onAddBlock(manualData);
    setSuccess('Block successfully added!');
    setSolar(0);
    setLoad(0);
    setBatterySoc(50);
    setIsModalOpen(false);
  };


  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Manual Block Operations</h2>
      <form onSubmit={handleAddRequest} className="space-y-4">
        <p className="text-sm text-gray-400">
          Manually forge and add a new block to the chain. Requires administrator key.
        </p>
        <div className="grid grid-cols-3 gap-2">
            <div>
                <label htmlFor="manual-solar" className="block text-sm font-medium text-gray-400">Solar (kW)</label>
                <input type="number" id="manual-solar" value={solar} onChange={e => setSolar(parseFloat(e.target.value) || 0)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 sm:text-sm"/>
            </div>
            <div>
                <label htmlFor="manual-load" className="block text-sm font-medium text-gray-400">Load (kW)</label>
                <input type="number" id="manual-load" value={load} onChange={e => setLoad(parseFloat(e.target.value) || 0)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 sm:text-sm"/>
            </div>
            <div>
                <label htmlFor="manual-battery" className="block text-sm font-medium text-gray-400">Battery (%)</label>
                <input type="number" id="manual-battery" value={batterySoc} onChange={e => setBatterySoc(parseFloat(e.target.value) || 0)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 sm:text-sm"/>
            </div>
        </div>

        {success && <p className="text-green-400 text-sm text-center">{success}</p>}

        <button
          type="submit"
          className="w-full flex justify-center items-center py-2 px-4 rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2"/>
          Add Block Manually
        </button>
      </form>
      {isModalOpen && (
        <AdminKeyModal
          title="Authorize Manual Block"
          description="Enter the administrator key to manually add a new block to the chain."
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddSubmit}
        />
      )}
    </div>
  );
};

export default ManualBlockPanel;