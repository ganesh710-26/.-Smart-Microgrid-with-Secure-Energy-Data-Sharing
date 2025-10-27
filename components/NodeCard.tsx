
import React from 'react';

interface NodeCardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  color: 'amber' | 'cyan' | 'pink' | 'green';
  detail?: string;
}

const colorClasses = {
  amber: {
    bg: 'bg-amber-400/10',
    text: 'text-amber-400',
    border: 'border-amber-400/20',
  },
  cyan: {
    bg: 'bg-cyan-400/10',
    text: 'text-cyan-400',
    border: 'border-cyan-400/20',
  },
  pink: {
    bg: 'bg-pink-400/10',
    text: 'text-pink-400',
    border: 'border-pink-400/20',
  },
  green: {
    bg: 'bg-green-400/10',
    text: 'text-green-400',
    border: 'border-green-400/20',
  },
};

const NodeCard: React.FC<NodeCardProps> = ({ title, value, unit, icon, color, detail }) => {
  const classes = colorClasses[color];

  return (
    <div className={`p-4 rounded-lg shadow-lg flex flex-col justify-between ${classes.bg} border ${classes.border}`}>
      <div>
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-300">{title}</h3>
          <div className={classes.text}>{icon}</div>
        </div>
        <div className="mt-2">
          <span className={`text-3xl font-bold ${classes.text}`}>{value}</span>
          <span className="ml-1 text-lg text-gray-400">{unit}</span>
        </div>
      </div>
      {detail && <p className="text-xs text-gray-500 mt-3 truncate">{detail}</p>}
    </div>
  );
};

export default NodeCard;
