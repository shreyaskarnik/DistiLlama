import { getModels } from '@src/pages/utils/processing';
import { useEffect, useState } from 'react';
import moment from 'moment';

const DEFAULT_TEMPERATURE = 0.3;
// Helper function to convert bytes to GB
const bytesToGB = bytes => (bytes / 1024 ** 3).toFixed(2);

/* eslint-disable react/prop-types */
const Settings = ({ onParamChange }) => {
  console.log('Settings.tsx: onParamChange', onParamChange);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [temperatureValue, setTemperatureValue] = useState(0.2); // Default value in the middle of the range

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        const fetchedModels = await getModels();
        setModels(fetchedModels);
        setSelectedModel(fetchedModels[0]);
        // Call the onParamChange with the initial model and default temperature
        onParamChange({ model: fetchedModels[0], temperature: DEFAULT_TEMPERATURE });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []); // Empty array means this effect only runs once on mount

  useEffect(() => {
    if (selectedModel) {
      onParamChange({ model: selectedModel, temperature: temperatureValue });
    }
  }, [selectedModel, temperatureValue, onParamChange]);

  if (isLoading) {
    return <div>Loading models...</div>;
  }

  if (error) {
    return <div>Error fetching models: {error}</div>;
  }

  return (
    <div className="settings-container">
      <div className="model-container">
        <div className="model-select-label">Select Model</div>
        <select
          className="model-dropdown"
          value={selectedModel?.name}
          onChange={e => setSelectedModel(models.find(model => model.name === e.target.value))}>
          {models.map(model => (
            <option key={model.name} value={model.name}>
              {model.name}
            </option>
          ))}
        </select>
        {selectedModel && (
          <div>
            <div className="model-info">
              <div>Size: {bytesToGB(selectedModel.size)} GB</div>
              <div>Modified: {moment(selectedModel.modified_at).fromNow()}</div>
            </div>
            <div className="slider-container">
              Temperature
              <div className="slider-description">
                Low temperature values will generate more predictable responses while higher values will generate more
                creative responses.
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperatureValue}
                onChange={e => setTemperatureValue(Number(e.target.value))}
                className="slider"
              />
              <div className="slider-metrics">
                <span className="metric-left">Precise</span>
                <span className="metric-right">Creative</span>
              </div>
              <div className="slider-value-display">{temperatureValue}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
