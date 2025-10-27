export interface NodeData {
  solar: { generation: number };
  battery: { soc: number; flow: number }; // positive for charging, negative for discharging
  load: { consumption: number };
  grid: { flow: number }; // positive for import, negative for export
  weather: { description: string; cloudCover: number };
}

export interface Block {
  index: number;
  timestamp: string;
  data: NodeData;
  previousHash: string;
  hash: string;
  nonce: number;
}

export interface HistoricalDataPoint {
  time: string;
  solar: number;
  load: number;
  batterySoC: number;
  grid: number;
}

export interface SimulationConfig {
  latitude: number;
  longitude: number;
  panelArea: number; // m^2
  panelEfficiency: number; // percentage (e.g., 20 for 20%)
  panelCount: number;
  batteryCapacity: number; // Wh
  initialBattery: number; // Wh
}

export interface ValidationResult {
  isValid: boolean;
  invalidIndex: number | null;
  reason?: 'HASH_MISMATCH' | 'PREVIOUS_HASH_MISMATCH';
}
