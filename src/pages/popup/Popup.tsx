import '@pages/popup/Popup.css';
import { useState, useEffect } from 'react';
import PageSummary from './PageSummary';
import { summarizeCurrentPage, getModels } from './Summarize';
import ModelDropDown from './Models';

const Popup = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const fetchModels = async () => {
    const fetchedModels = await getModels();
    if (!selectedModel) {
      setSelectedModel(fetchedModels[0]);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []); // This will run once when the component mounts
  const handleClick = async () => {
    console.log('Model used for summary: ', selectedModel);
    setLoading(true);
    const response = await summarizeCurrentPage(selectedModel);
    setSummary(response);
    setLoading(false);
  };
  return (
    <div className="App">
      {!loading && !summary && (
        <header className="App-header">
          <ModelDropDown onModelChange={setSelectedModel} />
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
