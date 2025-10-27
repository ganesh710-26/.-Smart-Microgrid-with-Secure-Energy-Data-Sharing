import React, { useState, useCallback } from 'react';
import { useMicrogrid } from './hooks/useMicrogrid';
import Header from './components/Header';
import NodeCard from './components/NodeCard';
import EnergyFlow from './components/EnergyFlow';
import HistoryChart from './components/HistoryChart';
import BlockchainLedger from './components/BlockchainLedger';
import ConfigPanel from './components/ConfigPanel';
import LoginPage from './components/LoginPage';
import ManualBlockPanel from './components/ManualBlockPanel';
import { SolarIcon, BatteryIcon, LoadIcon, GridIcon } from './components/Icons';
import { SimulationConfig, NodeData } from './types';
import { DEFAULT_CONFIG } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);

  const {
    state,
    blockchain,
    validationResult,
    tamperedBlocksInfo,
    historicalData,
    saveTamperedBlock,
    manuallyAddBlock,
    verifyChain,
    isSimulating,
    toggleSimulation,
    resetSimulation,
  } = useMicrogrid(config);
  
  const handleConfigChange = useCallback((newConfig: SimulationConfig) => {
    setConfig(newConfig);
    resetSimulation(newConfig);
  }, [resetSimulation]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleReset = useCallback(() => {
    resetSimulation(config);
  }, [resetSimulation, config]);

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }


  return (
    <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <Header />

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
          {/* Left Column: Grid Visualization */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NodeCard
                title="Solar PV"
                value={state.solar.generation.toFixed(2)}
                unit="kW"
                icon={<SolarIcon />}
                color="amber"
                detail={`Weather: ${state.weather.description}`}
              />
              <NodeCard
                title="Battery"
                value={state.battery.soc.toFixed(1)}
                unit="%"
                icon={<BatteryIcon />}
                color="cyan"
                detail={
                  state.battery.flow > 0.01
                    ? `Charging: ${state.battery.flow.toFixed(2)} kW`
                    : state.battery.flow < -0.01
                    ? `Discharging: ${Math.abs(state.battery.flow).toFixed(2)} kW`
                    : 'Idle'
                }
              />
              <NodeCard
                title="Household Load"
                value={state.load.consumption.toFixed(2)}
                unit="kW"
                icon={<LoadIcon />}
                color="pink"
              />
              <NodeCard
                title="Grid"
                value={Math.abs(state.grid.flow).toFixed(2)}
                unit="kW"
                icon={<GridIcon />}
                color="green"
                detail={
                  state.grid.flow > 0.01
                    ? 'Importing'
                    : state.grid.flow < -0.01
                    ? 'Exporting'
                    : 'Idle'
                }
              />
            </div>

            <EnergyFlow state={state} />

            <HistoryChart data={historicalData} />
          </div>

          {/* Right Column: Controls & Blockchain */}
          <div className="lg:col-span-2 space-y-6">
             <ConfigPanel
                config={config}
                isSimulating={isSimulating}
                onConfigChange={handleConfigChange}
                toggleSimulation={toggleSimulation}
                onReset={handleReset}
             />
             <ManualBlockPanel onAddBlock={manuallyAddBlock} />
            <BlockchainLedger
              chain={blockchain.chain}
              validationResult={validationResult}
              tamperedBlocksInfo={tamperedBlocksInfo}
              onSaveTamper={saveTamperedBlock}
              onVerify={verifyChain}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
