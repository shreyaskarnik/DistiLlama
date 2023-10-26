import '@pages/popup/Popup.css';
import { useState } from 'react';
import PageSummary from './PageSummary';
import { summarizeCurrentPage } from './Summarize';

const Popup = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    const response = await summarizeCurrentPage();
    setSummary(response);
    setLoading(false);
  };

  return (
    <div className="App">
      {!loading && !summary && (
        <header className="App-header">
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
