{
  /* dropdown selection for choosing Models */
}
import { useEffect, useState } from 'react';
import { getModels } from './Summarize';
/* eslint-disable react/prop-types */
const Models = ({ onModelChange }) => {
  const [models, setModels] = useState([]);

  useEffect(() => {
    // Simulate fetching models. Replace this with your API call.
    const fetchModels = async () => {
      const fetchedModels = await getModels();
      setModels(fetchedModels);
      onModelChange(fetchedModels[0]);
    };

    fetchModels();
  }, [onModelChange]);

  return (
    <div>
      <div>Select a Model:</div>
      <select className="custom-select" onChange={e => onModelChange(e.target.value)}>
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
