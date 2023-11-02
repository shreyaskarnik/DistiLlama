import '@pages/sidePanel/SidePanel.css';
import { useState, useEffect } from 'react';
import PageSummary from '@root/src/pages/sidePanel/PageSummary';
import { summarizeCurrentPage } from '@root/src/pages/sidePanel/Summarize';
import ModelDropDown from '@root/src/pages/sidePanel/Models';
import Header from '@root/src/pages/common/Header';
import { getModels } from '@pages/utils/processing';
import { TfiWrite } from 'react-icons/tfi';
import { TbMessageQuestion } from 'react-icons/tb';
import QandAStatus, { QandABubble } from './QandABubble';
import { embedDocs } from '@root/src/pages/sidePanel/QandA';

const SidePanel = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [embedding, setEmbedding] = useState(null);
  const [vectorstore, setVectorStore] = useState(null);
  const fetchModels = async () => {
    const fetchedModels = await getModels();
    if (!selectedModel) {
      setSelectedModel(fetchedModels[0]);
    }
  };

  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleSummarizeAction = async () => {
    console.log('Model used for summary: ', selectedModel);
    setLoading(true);
    const response = await summarizeCurrentPage(selectedModel);
    setSummary(response);
    setLoading(false);
  };
  const handleQandAAction = async () => {
    setEmbedding(true);
    console.log('Model used for QandA: ', selectedModel);
    const response = await embedDocs(selectedModel);
    setVectorStore(response);
    setEmbedding(false);
  };
  return (
    <div className="App">
      {selectedOption === null && (
        <div className="App-content">
          <div>
            <span className="select-header">Select an option</span>
            <div className="tile-container">
              <div className="tile">
                <TfiWrite size="10rem" onClick={() => setSelectedOption('summary')} />
                <span className="tile-label">Summary</span>
              </div>
              <div className="tile">
                <TbMessageQuestion size="10rem" onClick={() => setSelectedOption('qanda')} />
                <span className="tile-label">Q & A</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOption === 'summary' && (
        <div>
          <header>
            <Header
              onBack={() => setSelectedOption(null)}
              onRefresh={() => {
                setSummary(null);
                setSelectedOption(null);
              }}
            />
          </header>
          {!loading && !summary && (
            <div className="App-content">
              <div className="action">
                <ModelDropDown onModelChange={setSelectedModel} />
                <button className="real-button" onClick={handleSummarizeAction}>
                  Summarize
                </button>
              </div>
            </div>
          )}
          <PageSummary loading={loading} summary={summary} />
        </div>
      )}

      {selectedOption === 'qanda' && (
        <div>
          <header>
            <Header
              onBack={() => setSelectedOption(null)}
              onRefresh={() => {
                setEmbedding(false);
                setSelectedOption(null);
                setVectorStore(null);
              }}
            />
          </header>
          {!embedding && !vectorstore && (
            <div className="App-content">
              <div className="action">
                <ModelDropDown onModelChange={setSelectedModel} />
                <button className="real-button" onClick={handleQandAAction}>
                  Load current document
                </button>
              </div>
            </div>
          )}
          {vectorstore === null && embedding ? <QandAStatus embedding={embedding} vectorstore={vectorstore} /> : null}
          {vectorstore !== null && !embedding ? (
            <QandABubble selectedModel={selectedModel} vectorstore={vectorstore} embedding={embedding} />
          ) : null}
        </div>
      )}
    </div>
  );
};
export default SidePanel;
