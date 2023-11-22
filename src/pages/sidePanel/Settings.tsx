import { useEffect, useState } from 'react';
import moment from 'moment';
import { getModels } from '@src/pages/utils/processing';

const DEFAULT_TEMPERATURE = 0.3;
// Define a default model if necessary, or use null/undefined
const DEFAULT_MODEL = null;

// Helper function to convert bytes to GB
const bytesToGB = bytes => (bytes / 1e9).toFixed(2);

/* eslint-disable react/prop-types */
const Settings = ({ onParamChange }) => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [temperatureValue, setTemperatureValue] = useState(DEFAULT_TEMPERATURE);
  const [isDefaultSet, setIsDefaultSet] = useState(false);

  // Function to update Chrome storage
  const updateStorage = (newModel, newTemperature) => {
    chrome.storage.local.set({ model: newModel, temperature: newTemperature });
  };
  const saveAsDefault = () => {
    onParamChange({ model: selectedModel, temperature: temperatureValue });

    // Save as default in Chrome storage
    chrome.storage.local.set({
      defaultModel: selectedModel.name,
      defaultTemperature: temperatureValue,
      isDefaultSet: true, // Flag to indicate default settings are saved
    });
    setIsDefaultSet(true);
  };

  // Fetch models and set from storage or defaults
  useEffect(() => {
    let isMounted = true; // To handle component unmount

    const fetchAndSetModels = async () => {
      try {
        setIsLoading(true);
        const fetchedModels = await getModels();
        if (isMounted) {
          setModels(fetchedModels);
          chrome.storage.local.get(['model', 'temperature', 'isDefaultSet'], result => {
            if (result.isDefaultSet) {
              setIsDefaultSet(true);
            }
            if (result.model) {
              const storedModel = fetchedModels.find(m => m.name === result.model.name);
              setSelectedModel(storedModel || fetchedModels[0]);
              setIsDefaultSet(result.isDefaultSet);
            } else {
              setSelectedModel(fetchedModels[0]);
              setIsDefaultSet(false);
            }

            if (result.temperature) {
              setTemperatureValue(result.temperature);
              setIsDefaultSet(result.isDefaultSet);
            } else {
              setTemperatureValue(DEFAULT_TEMPERATURE);
              setIsDefaultSet(false);
            }
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAndSetModels();

    return () => {
      isMounted = false;
    }; // Cleanup function for unmount
  }, []);

  useEffect(() => {
    if (selectedModel && temperatureValue !== null) {
      onParamChange({ model: selectedModel, temperature: temperatureValue });
      updateStorage(selectedModel, temperatureValue);
    }
  }, [selectedModel, temperatureValue, onParamChange]);

  if (isLoading) {
    return <div>Loading models...</div>;
  }

  if (error) {
    return <div>Error fetching models: {error}</div>;
  }
  if (isDefaultSet) {
    // Render a message or a different UI component
    return (
      <div className="settings-container">Using default settings click on the gear icon in the header to change</div>
    );
  }

  return (
    <div className="settings-container">
      <div className="model-container">
        <div className="model-select-label">Select Model</div>
        <select
          className="model-dropdown"
          value={selectedModel?.name}
          onChange={e => setSelectedModel(models.find(model => model.name === e.target.value))}
          disabled={!models.length} // Disable dropdown if models are not loaded yet
        >
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
              <span>Temperature</span>
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
      <button className="save-default-button" onClick={saveAsDefault}>
        Save as Default
      </button>
    </div>
  );
};

export default Settings;
