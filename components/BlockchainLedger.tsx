import React, { useState } from 'react';
import type { Block, ValidationResult, NodeData } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon, ChevronDownIcon, ChevronUpIcon, FingerPrintIcon, InformationCircleIcon, PencilSquareIcon, KeyIcon, XMarkIcon } from './Icons';
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


interface EditFormProps {
  data: NodeData;
  onDataChange: (field: keyof NodeData, subField: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditForm: React.FC<EditFormProps> = ({ data, onDataChange, onSave, onCancel }) => (
  <div className="p-3 bg-gray-900/70 space-y-3">
    <div className="grid grid-cols-3 gap-2 text-xs">
       <div>
         <label className="block font-semibold text-gray-300">Solar</label>
         <input type="number" value={data.solar.generation.toFixed(2)} onChange={(e) => onDataChange('solar', 'generation', e.target.value)} className="w-full bg-gray-800 rounded p-1" />
       </div>
       <div>
         <label className="block font-semibold text-gray-300">Load</label>
         <input type="number" value={data.load.consumption.toFixed(2)} onChange={(e) => onDataChange('load', 'consumption', e.target.value)} className="w-full bg-gray-800 rounded p-1" />
       </div>
       <div>
         <label className="block font-semibold text-gray-300">Battery SoC</label>
         <input type="number" value={data.battery.soc.toFixed(1)} onChange={(e) => onDataChange('battery', 'soc', e.target.value)} className="w-full bg-gray-800 rounded p-1" />
       </div>
    </div>
    <div className="flex justify-end space-x-2">
      <button onClick={onCancel} className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded">Cancel</button>
      <button onClick={onSave} className="text-xs bg-cyan-600 hover:bg-cyan-500 px-2 py-1 rounded">Save</button>
    </div>
  </div>
);

interface BlockProps {
  block: Block;
  isGenesis: boolean;
  isInvalid: boolean;
  validationReason?: 'HASH_MISMATCH' | 'PREVIOUS_HASH_MISMATCH';
  originalData?: NodeData;
  isEditing: boolean;
  editData: NodeData | null;
  onTamperClick: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDataChange: (field: keyof NodeData, subField: string, value: string) => void;
}

const BlockCard: React.FC<BlockProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const { block, isGenesis, isInvalid, validationReason, originalData, isEditing, editData, onTamperClick, onSave, onCancel, onDataChange } = props;

  const reasonText = validationReason === 'HASH_MISMATCH' ? 'Hash Mismatch' : validationReason === 'PREVIOUS_HASH_MISMATCH' ? 'Broken Link' : 'Tampered';

  return (
    <div className={`rounded-lg overflow-hidden transition-all duration-300 ${isInvalid ? 'ring-2 ring-red-500 bg-red-500/10' : 'bg-gray-700'}`}>
      <div className="w-full flex justify-between items-center p-3 text-left">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <FingerPrintIcon className="w-5 h-5 text-cyan-400" />
          <span className="font-mono text-sm">Block #{block.index}</span>
           {isInvalid && <span className="text-xs font-bold text-red-400">({reasonText})</span>}
        </div>
        <div className="flex items-center space-x-2">
          {!isGenesis && !isEditing && (
            <button onClick={onTamperClick} className="text-gray-400 hover:text-amber-400" title="Tamper/Edit Data">
              <PencilSquareIcon className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {isEditing && editData && <EditForm data={editData} onDataChange={onDataChange} onSave={onSave} onCancel={onCancel} />}

      {!isEditing && isOpen && (
        <div className="p-3 bg-gray-900/50 text-xs font-mono text-gray-400 space-y-2">
          <div><span className="font-semibold text-gray-300">Timestamp:</span> {new Date(block.timestamp).toLocaleString()}</div>
          <div className="truncate"><span className="font-semibold text-gray-300">Hash:</span> {block.hash}</div>
          <div className="truncate"><span className="font-semibold text-gray-300">Prev Hash:</span> {block.previousHash}</div>
          <div className="truncate"><span className="font-semibold text-gray-300">Data:</span> Solar: {block.data.solar.generation.toFixed(1)}kW, Load: {block.data.load.consumption.toFixed(1)}kW, Batt: {block.data.battery.soc.toFixed(0)}%</div>
          
          {originalData && (
            <div className="p-2 bg-amber-500/10 rounded-md mt-2 text-amber-400">
               <div className="flex items-center font-bold text-amber-300 mb-1"><InformationCircleIcon className="w-4 h-4 mr-1"/> Original Data</div>
               <div className="truncate">Solar: {originalData.solar.generation.toFixed(1)}kW, Load: {originalData.load.consumption.toFixed(1)}kW, Batt: {originalData.battery.soc.toFixed(0)}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface BlockchainLedgerProps {
  chain: Block[];
  validationResult: ValidationResult;
  tamperedBlocksInfo: Record<number, { originalData: NodeData }>;
  onSaveTamper: (index: number, data: NodeData) => void;
  onVerify: () => void;
}

const BlockchainLedger: React.FC<BlockchainLedgerProps> = ({ chain, validationResult, tamperedBlocksInfo, onSaveTamper, onVerify }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<NodeData | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const handleTamperClick = (block: Block) => {
    setEditingIndex(block.index);
    setEditData(JSON.parse(JSON.stringify(block.data))); // Deep copy
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditData(null);
  };

  const handleSave = () => {
    if (editingIndex !== null && editData) {
      onSaveTamper(editingIndex, editData);
      handleCancel();
    }
  };

  const handleDataChange = (field: keyof NodeData, subField: string, value: string) => {
    if (!editData) return;
    const newData = JSON.parse(JSON.stringify(editData));
    const mainField = newData[field] as any;
    if (mainField && typeof mainField === 'object' && subField in mainField) {
      mainField[subField] = parseFloat(value) || 0;
    }
    setEditData(newData);
  };
  
  const handleVerifyRequest = () => {
    setIsVerifyModalOpen(true);
  };
  
  const handleVerifySubmit = () => {
    onVerify();
    setIsVerifyModalOpen(false);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-100">Blockchain Ledger</h2>
        {validationResult.isValid ? (
          <span className="flex items-center text-sm text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Verified
          </span>
        ) : (
          <span className="flex items-center text-sm text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Tampered
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-400 mb-4">
        Only an admin can verify the chain. Edit a block, then use the admin key to reveal tampering.
      </p>

      <div className="space-y-2 mb-4">
        <button onClick={handleVerifyRequest} className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold transition-colors duration-300">
          Verify Chain Integrity
        </button>
      </div>

      {isVerifyModalOpen && (
        <AdminKeyModal
          title="Admin Verification"
          description="Please enter the administrator key to verify the integrity of the blockchain."
          onClose={() => setIsVerifyModalOpen(false)}
          onSubmit={handleVerifySubmit}
        />
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
        {chain.slice().reverse().map((block) => (
          <BlockCard
            key={block.index}
            block={block}
            isGenesis={block.index === 0}
            isInvalid={block.index === validationResult.invalidIndex}
            validationReason={block.index === validationResult.invalidIndex ? validationResult.reason : undefined}
            originalData={tamperedBlocksInfo[block.index]?.originalData}
            isEditing={editingIndex === block.index}
            editData={editData}
            onTamperClick={() => handleTamperClick(block)}
            onSave={handleSave}
            onCancel={handleCancel}
            onDataChange={handleDataChange}
          />
        ))}
      </div>
    </div>
  );
};

export default BlockchainLedger;