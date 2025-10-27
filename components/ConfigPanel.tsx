import React, { useEffect, useRef } from 'react';
import type { SimulationConfig } from '../types';
import { MapPinIcon, ArrowCounterClockwiseIcon } from './Icons';

// Add declaration for Leaflet's global 'L' object from the CDN script
declare const L: any;

interface ConfigPanelProps {
  config: SimulationConfig;
  isSimulating: boolean;
  onConfigChange: (newConfig: SimulationConfig) => void;
  toggleSimulation: () => void;
  onReset: () => void;
}

const InputField = ({ label, name, type, value, onChange, unit }: { label: string, name: string, type: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, unit?: string }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-400">{label}</label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className="block w-full pr-12 bg-gray-700 border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
        step={type === 'number' ? 0.0001 : 1}
      />
      {unit && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <span className="text-gray-500 sm:text-sm">{unit}</span>
      </div>}
    </div>
  </div>
);


const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, isSimulating, onConfigChange, toggleSimulation, onReset }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({
      ...config,
      [e.target.name]: parseFloat(e.target.value) || 0,
    });
  };

  useEffect(() => {
    // Initialize map only once
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([config.latitude, config.longitude], 2);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      markerRef.current = L.marker([config.latitude, config.longitude]).addTo(map);

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        const newLat = parseFloat(lat.toFixed(4));
        const newLng = parseFloat(lng.toFixed(4));
        
        onConfigChange({ ...config, latitude: newLat, longitude: newLng });
      });
    }
  }, []); // Empty dependency array ensures this runs only once

  // Effect to sync map and marker with config changes (e.g., from manual input)
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      const newLatLng = L.latLng(config.latitude, config.longitude);
      markerRef.current.setLatLng(newLatLng);
      
      const mapCenter = mapRef.current.getCenter();
      if(mapCenter.lat !== newLatLng.lat || mapCenter.lng !== newLatLng.lng) {
        mapRef.current.panTo(newLatLng);
      }
    }
  }, [config.latitude, config.longitude]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Simulation Control</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 flex items-center">
            <MapPinIcon className="w-4 h-4 mr-1" /> Location (click map to select)
          </label>
          <div ref={mapContainerRef} className="w-full h-48 rounded-md mt-1 z-0" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Latitude" name="latitude" type="number" value={config.latitude} onChange={handleInputChange} />
          <InputField label="Longitude" name="longitude" type="number" value={config.longitude} onChange={handleInputChange} />
        </div>

        <h3 className="text-lg font-semibold text-gray-200 pt-2 border-t border-gray-700">Solar Setup</h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Panel Area" name="panelArea" type="number" value={config.panelArea} onChange={handleInputChange} unit="m²" />
          <InputField label="Efficiency" name="panelEfficiency" type="number" value={config.panelEfficiency} onChange={handleInputChange} unit="%" />
          <InputField label="Panel Count" name="panelCount" type="number" value={config.panelCount} onChange={handleInputChange} />
        </div>

        <h3 className="text-lg font-semibold text-gray-200 pt-2 border-t border-gray-700">Battery Setup</h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Capacity" name="batteryCapacity" type="number" value={config.batteryCapacity} onChange={handleInputChange} unit="Wh" />
          <InputField label="Initial Charge" name="initialBattery" type="number" value={config.initialBattery} onChange={handleInputChange} unit="Wh" />
        </div>
        
        <div className="flex items-center space-x-2 pt-2 border-t border-gray-700">
            <button
              onClick={toggleSimulation}
              className={`w-full py-2 px-4 rounded-md font-semibold transition-colors duration-300 ${isSimulating ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
            </button>
            <button
                onClick={onReset}
                className="p-2 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors"
                title="Reset Simulation"
              >
              <ArrowCounterClockwiseIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
