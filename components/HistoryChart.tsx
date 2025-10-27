
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { HistoricalDataPoint } from '../types';

interface HistoryChartProps {
  data: HistoricalDataPoint[];
}

const HistoryChart: React.FC<HistoryChartProps> = ({ data }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-80">
      <h2 className="text-xl font-bold mb-4 text-gray-100">Simulation History</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: '#d1d5db' }}
          />
          <Legend wrapperStyle={{fontSize: "14px", bottom: 0}} />
          <Line type="monotone" dataKey="solar" name="Solar (kW)" stroke="#fbbf24" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="load" name="Load (kW)" stroke="#f472b6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="grid" name="Grid (kW)" stroke="#4ade80" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;
