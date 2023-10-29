{
  /* dropdown selection for choosing Models */
}
import React, { useState, useEffect } from 'react';
/* eslint-disable react/prop-types */
export default function ModelDropDown({ models, onModelChange }) {
  const [modelList, setModelList] = useState([]);

  const handleChange = e => {
    const selectedModel = e.target.value;
    console.log('selectedModel: ', selectedModel);
    onModelChange(selectedModel);
  };
  useEffect(() => {
    const fetchAndSetModels = async () => {
      const fetchedModels = await models();
      setModelList(fetchedModels);
      // Set the default model to the first entry
      if (fetchedModels && fetchedModels.length > 0) {
        onModelChange(fetchedModels[0]);
      }
    };

    fetchAndSetModels();
  }, [models, onModelChange]);
  return (
    <div>
      <div>Select a Model:</div>
      {/* also need to handle default case */}
      <select onChange={handleChange} className="custom-select">
        {modelList.map(model => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
}
