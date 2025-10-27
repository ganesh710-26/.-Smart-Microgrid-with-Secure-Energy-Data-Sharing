import { SimulationConfig } from './types';

export const SIMULATION_SPEED_MS = 2000; // Update every 2 seconds
export const MINUTES_PER_TICK = 10; // Each tick advances time by 10 minutes
export const ADMIN_KEY = 'admin_key_123';

// Default simulation configuration
export const DEFAULT_CONFIG: SimulationConfig = {
  latitude: 34.05, // Los Angeles
  longitude: -118.24,
  panelArea: 1.7, // m^2 per panel
  panelEfficiency: 20, // 20%
  panelCount: 14,
  batteryCapacity: 13500, // 13.5 kWh Tesla Powerwall in Wh
  initialBattery: 6750, // 50% initial charge in Wh
};


// Battery operational constants (less likely to be user-configured)
export const BATTERY_MAX_CHARGE_KW = 5;
export const BATTERY_MAX_DISCHARGE_KW = 5;
export const BATTERY_MIN_SOC = 10; // Minimum state of charge to prolong battery life
export const BATTERY_MAX_SOC = 100;

// Load constants
export const MAX_LOAD_KW = 7;