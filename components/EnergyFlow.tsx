
import React from 'react';
import type { NodeData } from '../types';
import { SolarIcon, BatteryIcon, LoadIcon, GridIcon, HomeIcon } from './Icons';

interface EnergyFlowProps {
  state: NodeData;
}

interface FlowLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  flow: number;
  isReverse?: boolean;
}

const FlowLine: React.FC<FlowLineProps> = ({ x1, y1, x2, y2, flow, isReverse }) => {
  if (Math.abs(flow) < 0.01) return null;
  const animationClass = isReverse ? 'animate-flow-reverse' : 'animate-flow';
  return (
    <line
      x1={`${x1}%`}
      y1={`${y1}%`}
      x2={`${x2}%`}
      y2={`${y2}%`}
      className={`stroke-current stroke-2 ${animationClass}`}
      strokeDasharray="10 10"
    />
  );
};


const EnergyFlow: React.FC<EnergyFlowProps> = ({ state }) => {
  const { solar, battery, load, grid } = state;

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-100">Real-Time Energy Flow</h2>
      <div className="relative w-full" style={{ paddingBottom: '60%' }}>
        <svg viewBox="0 0 400 240" className="absolute top-0 left-0 w-full h-full">
          {/* Nodes */}
          <g transform="translate(50, 40)">
            <SolarIcon className="text-amber-400" width="40" height="40" />
            <text x="20" y="55" textAnchor="middle" className="fill-current text-gray-300 text-xs">Solar</text>
          </g>
          <g transform="translate(50, 160)">
            <BatteryIcon className="text-cyan-400" width="40" height="40" />
            <text x="20" y="55" textAnchor="middle" className="fill-current text-gray-300 text-xs">Battery</text>
          </g>
          <g transform="translate(310, 40)">
            <LoadIcon className="text-pink-400" width="40" height="40" />
            <text x="20" y="55" textAnchor="middle" className="fill-current text-gray-300 text-xs">Load</text>
          </g>
          <g transform="translate(310, 160)">
            <GridIcon className="text-green-400" width="40" height="40" />
            <text x="20" y="55" textAnchor="middle" className="fill-current text-gray-300 text-xs">Grid</text>
          </g>
          <g transform="translate(180, 100)">
             <HomeIcon className="text-gray-400" width="40" height="40" />
             <text x="20" y="55" textAnchor="middle" className="fill-current text-gray-300 text-xs">Bus</text>
          </g>

          {/* Flow Lines */}
          <g className="text-amber-400">
            <FlowLine x1={20} y1={25} x2={47} y2={50} flow={solar.generation} />
          </g>
          <g className="text-cyan-400">
            <FlowLine x1={20} y1={75} x2={47} y2={50} flow={-battery.flow} isReverse={battery.flow > 0} />
          </g>
          <g className="text-pink-400">
             <FlowLine x1={53} y1={50} x2={80} y2={25} flow={load.consumption} />
          </g>
          <g className="text-green-400">
            <FlowLine x1={53} y1={50} x2={80} y2={75} flow={grid.flow} isReverse={grid.flow < 0} />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default EnergyFlow;
