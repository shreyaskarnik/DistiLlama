import '@pages/sidePanel/SidePanel.css';
import { getModels } from '@pages/utils/processing';
import Header from '@root/src/pages/common/Header';
import ChatWithDocument from '@root/src/pages/sidePanel/ChatWithDocument';
import Settings from '@root/src/pages/sidePanel/Settings';
import PageSummary from '@root/src/pages/sidePanel/PageSummary';
import { embedDocs } from '@root/src/pages/sidePanel/QandA';
import { QandABubble, QandAStatus } from '@root/src/pages/sidePanel/QandABubble';
import { summarizeCurrentPage } from '@root/src/pages/sidePanel/Summarize';
import { useEffect, useState } from 'react';
import { HiOutlineDocumentChartBar } from 'react-icons/hi2';
import { TbMessageQuestion, TbBrandWechat } from 'react-icons/tb';
import { TfiWrite } from 'react-icons/tfi';
import Instructions from './Instructions';

const SidePanel = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [selectedParams, setSelectedParams] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [embedding, setEmbedding] = useState(false);
  const [vectorstore, setVectorStore] = useState(null);
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);
  const [readyToChat, setReadyToChat] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [starterQuestions, setStarterQuestions] = useState([]);

  const toggleSettingsVisibility = () => {
    chrome.storage.local.set({ isDefaultSet: false });
    setShowSettings(!showSettings);
  };
  const resetTaskStates = () => {
    setVectorStore(null);
    setSummary(null);
    setSelectedOption(null);
    setSelectedPDF(null);
    setLoading(false);
    setStarterQuestions([]);
  };
  const fetchModels = async () => {
    try {
      const fetchedModels = await getModels();
      console.log('fetchedModels', fetchedModels);
      if (!selectedParams) {
        setSelectedParams({ model: fetchedModels[0], temperature: 0.3 });
        setServerRunning(true);
      }
    } catch (error) {
      console.log(error);
      setServerRunning(false);
    }
  };

  useEffect(() => {
    fetchModels();
    setSelectedOption(null);
    setSummary(null);
    setEmbedding(false);
    setVectorStore(null);
    setReadyToChat(false);
    setSelectedPDF(null);
    setStarterQuestions([]);
    resetTaskStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleSummarizeAction = async () => {
    console.log('Model used for summary: ', selectedParams);
    setLoading(true);
    const response = await summarizeCurrentPage(selectedParams);
    setSummary(response);
    setLoading(false);
  };
  const handleChatAction = async () => {
    console.log('Model used for chat: ', selectedParams);
    setReadyToChat(true);
  };
  const handleQandAAction = async () => {
    setEmbedding(true);
    console.log('Model used for QandA: ', selectedParams);
    const response = await embedDocs(selectedParams, selectedPDF);
    setVectorStore(response);
    setEmbedding(false);
    setStarterQuestions(response.starterQuestions);
  };
  return (
    <div className="App">
      <header>
        <Header
          onBack={() => setSelectedOption(null)}
          onRefresh={() => {
            resetTaskStates();
          }}
          onOpenSettings={toggleSettingsVisibility}
        />
        {showSettings && <Settings onParamChange={setSelectedParams} />}
      </header>
      {selectedOption === null && (
        <div className="App-content">
          {!serverRunning ? (
            <Instructions />
          ) : (
            <div>
              <span className="select-header">Select Task</span>
              <div className="tile-container">
                <div className="tile">
                  <TbBrandWechat onClick={() => setSelectedOption('chat')} title="Chat with LLM" />
                  <span className="tile-label">Chat with LLM</span>
                </div>
                <div className="tile">
                  <TfiWrite onClick={() => setSelectedOption('summary')} title="Summarize Current Page" />
                  <span className="tile-label">Summarize Current Page</span>
                </div>
                <div className="tile">
                  <TbMessageQuestion onClick={() => setSelectedOption('qanda')} title="Chat with Current Page" />
                  <span className="tile-label">Chat with Current Page</span>
                </div>
                <div className="tile">
                  <HiOutlineDocumentChartBar onClick={() => setSelectedOption('docs')} title="Chat with Docs" />
                  <span className="tile-label">Chat with Docs</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedOption === 'summary' && (
        <div>
          {!loading && !summary && (
            <div className="App-content">
              <div className="action">
                <Settings onParamChange={setSelectedParams} />
                <button className="real-button" onClick={handleSummarizeAction}>
                  Summarize
                </button>
              </div>
            </div>
          )}
          <PageSummary loading={loading} summary={summary} taskType={selectedOption} />
        </div>
      )}

      {selectedOption === 'qanda' && (
        <div>
          <QandAStatus embedding={embedding} vectorstore={vectorstore} />
          {!embedding && !vectorstore && (
            <div className="App-content">
              <div className="action">
                <Settings onParamChange={setSelectedParams} />
                <button className="real-button" onClick={handleQandAAction}>
                  Load current document
                </button>
              </div>
            </div>
          )}
          {vectorstore !== null && !embedding ? (
            <QandABubble
              taskType={selectedOption}
              selectedParams={selectedParams}
              vectorstore={vectorstore}
              starterQuestions={starterQuestions}
            />
          ) : null}
        </div>
      )}
      {selectedOption === 'docs' && (
        <div>
          <QandAStatus embedding={embedding} vectorstore={vectorstore} />
          {!embedding && !vectorstore && (
            <ChatWithDocument
              handleQandAAction={handleQandAAction}
              setSelectedParams={setSelectedParams}
              setSelectedPDF={setSelectedPDF}
            />
          )}
          {vectorstore !== null && !embedding ? (
            <QandABubble
              taskType={selectedOption}
              selectedParams={selectedParams}
              vectorstore={vectorstore}
              starterQuestions={starterQuestions}
            />
          ) : null}
        </div>
      )}
      {selectedOption === 'chat' && (
        <div>
          <QandAStatus embedding={embedding} vectorstore={vectorstore} />
          {!readyToChat && (
            <div className="App-content">
              <div className="action">
                <Settings onParamChange={setSelectedParams} />
                <button className="real-button" onClick={handleChatAction}>
                  Chat
                </button>
              </div>
            </div>
          )}
          {readyToChat && (
            <QandABubble
              taskType={selectedOption}
              selectedParams={selectedParams}
              vectorstore={vectorstore}
              starterQuestions={starterQuestions}
            />
          )}
        </div>
      )}
    </div>
  );
};
export default SidePanel;
