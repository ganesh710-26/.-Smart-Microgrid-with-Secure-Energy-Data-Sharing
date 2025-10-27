import { useState, useEffect, useRef, useCallback } from 'react';
import type { NodeData, Block, HistoricalDataPoint, SimulationConfig, ValidationResult } from '../types';
import { calculateHash } from '../services/cryptoService';
import {
  SIMULATION_SPEED_MS,
  MINUTES_PER_TICK,
  BATTERY_MAX_CHARGE_KW,
  BATTERY_MAX_DISCHARGE_KW,
  BATTERY_MIN_SOC,
  MAX_LOAD_KW,
} from '../constants';

class Blockchain {
  public chain: Block[] = [];
  private difficulty = 2;

  constructor() {
    this.createGenesisBlock().then(genesisBlock => {
      this.chain = [genesisBlock];
    });
  }

  private async createGenesisBlock(): Promise<Block> {
    const genesisData: NodeData = {
      solar: { generation: 0 },
      battery: { soc: 50, flow: 0 },
      load: { consumption: 0 },
      grid: { flow: 0 },
      weather: { description: 'Clear', cloudCover: 0 },
    };
    return this.mineBlock(0, "0", new Date().toISOString(), genesisData);
  }

  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  private async mineBlock(index: number, previousHash: string, timestamp: string, data: NodeData): Promise<Block> {
    let nonce = 0;
    let hash = '';
    while (hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
      nonce++;
      hash = await calculateHash(index, previousHash, timestamp, data, nonce);
    }
    return { index, previousHash, timestamp, data, hash, nonce };
  }

  public async addBlock(data: NodeData): Promise<Block> {
    const latestBlock = this.getLatestBlock();
    const newIndex = latestBlock.index + 1;
    const newTimestamp = new Date().toISOString();
    const newBlock = await this.mineBlock(newIndex, latestBlock.hash, newTimestamp, data);
    this.chain.push(newBlock);
    return newBlock;
  }

  public async isChainValid(): Promise<ValidationResult> {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      const recalculatedHash = await calculateHash(
        currentBlock.index,
        currentBlock.previousHash,
        currentBlock.timestamp,
        currentBlock.data,
        currentBlock.nonce
      );

      if (currentBlock.hash !== recalculatedHash) {
        return { isValid: false, invalidIndex: i, reason: 'HASH_MISMATCH' };
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return { isValid: false, invalidIndex: i, reason: 'PREVIOUS_HASH_MISMATCH' };
      }
    }
    return { isValid: true, invalidIndex: null };
  }
}

// Mock weather service based on time and latitude
const getSimulatedWeather = (hour: number, latitude: number) => {
  const daylightHours = 12 - (Math.abs(latitude) / 90) * 8;
  const sunrise = 6 + (12 - daylightHours) / 2;
  const sunset = 18 - (12 - daylightHours) / 2;

  if (hour < sunrise || hour > sunset) return { description: 'Night', cloudCover: 1.0 };

  const midday = (sunrise + sunset) / 2;
  const sunIntensity = Math.exp(-Math.pow(hour - midday, 2) / 10);

  if (sunIntensity > 0.5) {
    const rand = Math.random();
    if (rand < 0.7) return { description: 'Sunny', cloudCover: 0.1 };
    if (rand < 0.9) return { description: 'Partly Cloudy', cloudCover: 0.4 };
    return { description: 'Cloudy', cloudCover: 0.8 };
  }
  return { description: 'Clear', cloudCover: 0.2 };
};


export const useMicrogrid = (config: SimulationConfig) => {
  const getInitialState = useCallback((config: SimulationConfig): NodeData => {
    const initialSoC = config.batteryCapacity > 0 ? (config.initialBattery / config.batteryCapacity) * 100 : 0;
    return {
      solar: { generation: 0 },
      battery: { soc: initialSoC, flow: 0 },
      load: { consumption: 0.5 },
      grid: { flow: 0.5 },
      weather: { description: 'Clear', cloudCover: 0 },
    };
  }, []);

  const [simulationTime, setSimulationTime] = useState(new Date(2023, 1, 1, 5, 0, 0));
  const [isSimulating, setIsSimulating] = useState(false);
  const [state, setState] = useState<NodeData>(() => getInitialState(config));
  const blockchainRef = useRef(new Blockchain());
  const [blockchain, setBlockchain] = useState(blockchainRef.current);
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, invalidIndex: null });
  const [tamperedBlocksInfo, setTamperedBlocksInfo] = useState<Record<number, { originalData: NodeData }>>({});
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  const simulationTick = useCallback(() => {
    setSimulationTime(prevTime => {
      const newTime = new Date(prevTime.getTime() + MINUTES_PER_TICK * 60 * 1000);
      const hour = newTime.getHours();
      const minute = newTime.getMinutes();
      const timeOfDay = hour + minute / 60;

      // 1. Simulate Solar Generation
      const daylightHours = 12 - (Math.abs(config.latitude) / 90) * 8;
      const sunrise = 6 + (12 - daylightHours) / 2;
      const sunset = 18 - (12 - daylightHours) / 2;
      
      const sunUp = Math.max(0, Math.sin((timeOfDay - sunrise) * (Math.PI / (sunset-sunrise))));
      const weather = getSimulatedWeather(hour, config.latitude);
      const totalPanelArea = config.panelArea * config.panelCount;
      const solarPanelCapacityKw = (totalPanelArea * (config.panelEfficiency / 100) * 1); // 1 kW/m^2 irradiance
      const solarGeneration = solarPanelCapacityKw * sunUp * (1 - weather.cloudCover * 0.75);

      // 2. Simulate Load Consumption
      const morningPeak = Math.exp(-Math.pow(timeOfDay - 8, 2) / 4) * 0.8;
      const eveningPeak = Math.exp(-Math.pow(timeOfDay - 19, 2) / 4) * 1.0;
      const baseLoad = 0.5;
      const loadConsumption = Math.min(MAX_LOAD_KW, baseLoad + (morningPeak + eveningPeak) * (MAX_LOAD_KW - baseLoad));

      setState(prevState => {
        // 3. Energy Balancing Logic
        let netPower = solarGeneration - loadConsumption;
        let batteryFlow = 0;
        let gridFlow = 0;
        
        const BATTERY_CAPACITY_KWH = config.batteryCapacity / 1000;
        const currentBatteryKWh = (prevState.battery.soc / 100) * BATTERY_CAPACITY_KWH;

        if (netPower > 0) { // Excess power
          const chargePower = Math.min(netPower, BATTERY_MAX_CHARGE_KW);
          const canStoreKWh = BATTERY_CAPACITY_KWH - currentBatteryKWh;
          const maxChargeInTickKWh = chargePower * (MINUTES_PER_TICK / 60);
          const actualChargeKWh = Math.min(canStoreKWh, maxChargeInTickKWh);
          const actualChargePower = BATTERY_CAPACITY_KWH > 0 ? (actualChargeKWh / (MINUTES_PER_TICK / 60)) : 0;

          if (actualChargePower > 0.01) {
            batteryFlow = actualChargePower;
            gridFlow = -(netPower - batteryFlow); // Export to grid
          } else {
            batteryFlow = 0;
            gridFlow = -netPower; // Export all to grid
          }
        } else { // Power deficit
          const requiredPower = -netPower;
          const dischargePower = Math.min(requiredPower, BATTERY_MAX_DISCHARGE_KW);
          const canSupplyKWh = (currentBatteryKWh - (BATTERY_MIN_SOC / 100) * BATTERY_CAPACITY_KWH);
          const maxDischargeInTickKWh = dischargePower * (MINUTES_PER_TICK / 60);
          const actualDischargeKWh = Math.min(canSupplyKWh, maxDischargeInTickKWh);
          const actualDischargePower = BATTERY_CAPACITY_KWH > 0 ? (actualDischargeKWh / (MINUTES_PER_TICK / 60)) : 0;

          if (actualDischargePower > 0.01) {
            batteryFlow = -actualDischargePower;
            gridFlow = requiredPower - actualDischargePower; // Import from grid
          } else {
            batteryFlow = 0;
            gridFlow = requiredPower; // Import all from grid
          }
        }

        const newSoC = BATTERY_CAPACITY_KWH > 0
          ? prevState.battery.soc + (batteryFlow * (MINUTES_PER_TICK / 60) / BATTERY_CAPACITY_KWH) * 100
          : 0;

        const newState: NodeData = {
          solar: { generation: solarGeneration },
          battery: { soc: Math.max(0, Math.min(100, newSoC)), flow: batteryFlow },
          load: { consumption: loadConsumption },
          grid: { flow: gridFlow },
          weather: weather,
        };

        blockchainRef.current.addBlock(newState).then(() => {
          setBlockchain(Object.assign(Object.create(Object.getPrototypeOf(blockchainRef.current)), blockchainRef.current));
        });

        setHistoricalData(prevData => {
          const newDataPoint: HistoricalDataPoint = {
            time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
            solar: newState.solar.generation,
            load: newState.load.consumption,
            batterySoC: newState.battery.soc,
            grid: newState.grid.flow,
          };
          return [...prevData.slice(-50), newDataPoint];
        });

        return newState;
      });
      return newTime;
    });
  }, [config]);

  useEffect(() => {
    let interval: number | null = null;
    if (isSimulating) {
      interval = window.setInterval(simulationTick, SIMULATION_SPEED_MS);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isSimulating, simulationTick]);
  
  const resetSimulation = useCallback((newConfig: SimulationConfig) => {
    setIsSimulating(false);
    blockchainRef.current = new Blockchain();
    setBlockchain(blockchainRef.current);
    setSimulationTime(new Date(2023, 1, 1, 5, 0, 0));
    setState(getInitialState(newConfig));
    setHistoricalData([]);
    setValidationResult({ isValid: true, invalidIndex: null });
    setTamperedBlocksInfo({});
  }, [getInitialState]);

  const toggleSimulation = () => setIsSimulating(prev => !prev);
  
  const saveTamperedBlock = (index: number, tamperedData: NodeData) => {
    const chain = blockchainRef.current.chain;
    if (chain[index]) {
      // Only set the original data if this block hasn't been tampered with before.
      if (!tamperedBlocksInfo[index]) {
        setTamperedBlocksInfo(prev => ({
          ...prev,
          [index]: { originalData: JSON.parse(JSON.stringify(chain[index].data)) }
        }));
      }
      
      chain[index].data = tamperedData;
      setBlockchain(Object.assign(Object.create(Object.getPrototypeOf(blockchainRef.current)), blockchainRef.current));
      // Reset validation result to prompt the user to re-verify.
      setValidationResult({ isValid: true, invalidIndex: null });
    }
  };
  
  const manuallyAddBlock = async (data: NodeData) => {
    if(isSimulating) {
        setIsSimulating(false); // Pause simulation to prevent race conditions
    }
    await blockchainRef.current.addBlock(data);
    setBlockchain(Object.assign(Object.create(Object.getPrototypeOf(blockchainRef.current)), blockchainRef.current));
  };

  const verifyChain = async () => {
    const result = await blockchainRef.current.isChainValid();
    setValidationResult(result);
  };

  return { state, blockchain, validationResult, tamperedBlocksInfo, historicalData, saveTamperedBlock, manuallyAddBlock, verifyChain, isSimulating, toggleSimulation, resetSimulation };
};
