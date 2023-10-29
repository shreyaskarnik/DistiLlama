import '@pages/popup/Popup.css';
import { useState, useEffect } from 'react';
import PageSummary from './PageSummary';
import { summarizeCurrentPage, getModels } from './Summarize';
import ModelDropDown from './Models';

const Popup = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

  const handleModelChange = model => {
    setSelectedModel(model);
  };
  const fetchModels = async () => {
    const models = await getModels();
    return models;
  };
  const handleClick = async () => {
    setLoading(true);
    const response = await summarizeCurrentPage(selectedModel);
    setSummary(response);
    setLoading(false);
  };

  useEffect(() => {
    fetchModels();
  }, []); // Empty dependency array means this runs once when component mounts

  return (
    <div className="App">
      {!loading && !summary && (
        <header className="App-header">
          <ModelDropDown onModelChange={handleModelChange} models={fetchModels} />
          <button onClick={handleClick}>Click Here to Summarize this Page.</button>
        </header>
      )}
      <div>
        <PageSummary loading={loading} summary={summary} />
      </div>
    </div>
  );
};
export default Popup;
