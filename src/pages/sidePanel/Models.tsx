{
  /* dropdown selection for choosing Models */
}
import { useEffect, useState } from 'react';
import { getModels } from '@src/pages/utils/processing';
/* eslint-disable react/prop-types */
const Models = ({ onModelChange }) => {
  const [models, setModels] = useState([]);

  useEffect(() => {
    const fetchModels = async () => {
      const fetchedModels = await getModels();
      setModels(fetchedModels);
      onModelChange(fetchedModels[0]);
    };

    fetchModels();
  }, [onModelChange]);

  return (
    <div className="model-container">
      <div className="model-select-label">Select a Model</div>
      <select className="model-dropdown" onChange={e => onModelChange(e.target.value)}>
        {models.map(model => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Models;
