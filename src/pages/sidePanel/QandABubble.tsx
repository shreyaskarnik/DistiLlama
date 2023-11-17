import LinearProgress from '@mui/material/LinearProgress';
import { talkToDocument, chatWithLLM } from '@root/src/pages/sidePanel/QandA';
import { useEffect, useRef, useState } from 'react';
import { BsFillArrowRightSquareFill } from 'react-icons/bs';
import PageMetadata from '@root/src/pages/sidePanel/PageMetadata';
/* eslint-disable react/prop-types */
export function QandAStatus({ embedding, vectorstore }) {
  return (
    <div className="form-container">
      {/* while embedding==true show LinearProgress moving else show LinearProgress Solid */}
      {embedding && vectorstore === null ? (
        <div>
          <LinearProgress color="primary" />
        </div>
      ) : null}
    </div>
  );
}

export function AnsweringStatus({ answering }) {
  return (
    <div>
      {answering ? (
        <div>
          <LinearProgress color="primary" />
        </div>
      ) : null}
    </div>
  );
}

export function QandABubble({ taskType, selectedModel, vectorstore }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [answering, setAnswering] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [chat_history = [], setChatHistory] = useState([]);
  const endOfChatHistoryRef = useRef(null);
  const scrollToBottom = () => {
    endOfChatHistoryRef.current?.scrollIntoView({ behavior: 'auto' });
  };
  const formContainerRef = useRef(null);
  const handleTextAreaInput = e => {
    e.target.style.height = 'auto'; // Reset the height
    e.target.style.height = `${e.target.scrollHeight}px`; // Set the height equal to the scroll height
  };
  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Check if Enter was pressed without the shift key
      e.preventDefault(); // Prevent the default action to avoid inserting a new line
      handleQandAAction(e); // Call your existing form submission handler
    }
  };

  useEffect(() => {
    setAnswer('');
    setQuestion('');
    setAnswering(false);
    setChatHistory([]);
  }, [vectorstore]);
  useEffect(() => {
    scrollToBottom();
  }, [chat_history]);

  const handleQandAAction = async e => {
    e.preventDefault(); // Prevent page reload on form submit
    if (!question) return; // Prevent sending empty questions

    console.log('Model used for QandA: ', selectedModel);
    console.log('Question: ', question);

    // Don't clear the question here, so it remains visible during the process
    setAnswering(true); // Indicate that the answer process has started

    const chain =
      taskType === 'qanda' || taskType === 'docs'
        ? talkToDocument(selectedModel, vectorstore.vectorstore, { question, chat_history })
        : chatWithLLM(selectedModel, { question, chat_history });

    for await (const chunk of chain) {
      if (chunk) {
        setAnswer(prevAnswer => prevAnswer + chunk);
        // Here, update the chat history with the incremental answer.
        setChatHistory(prevChatHistory => {
          // If the last chat history item is the current question, update it.
          // Otherwise, add a new entry.
          const historyUpdated = [...prevChatHistory];
          const lastEntry = historyUpdated[historyUpdated.length - 1];
          if (lastEntry && lastEntry.question === question) {
            lastEntry.answer += chunk;
          } else {
            historyUpdated.push({ question, answer: chunk });
          }
          return historyUpdated;
        });
      }
    }

    // After the final chunk has been received, stop the answering indicator
    setAnswering(false);
    // If you want to clear the question after the answer is fully received, uncomment the next line.
    setQuestion('');
  };

  useEffect(() => {
    // Clear the answer when a new model is selected
    setAnswer('');
  }, [selectedModel]);

  return (
    <div>
      <div className="content-box">
        {chat_history.length > 0 ? (
          <ul className="chat-history">
            {chat_history.map(({ question, answer }, index) => (
              <li key={index} className="chat-history-item">
                <div className="chat-line">
                  <span role="img" aria-label="Human">
                    👤
                  </span>
                  <span className="chat-text">{question}</span>
                </div>
                <div className="chat-line">
                  <span role="img" aria-label="Robot">
                    🤖
                  </span>
                  <span className="chat-text">{answer}</span>
                </div>
              </li>
            ))}
            <div ref={endOfChatHistoryRef} />
          </ul>
        ) : (
          <p>Ask a question to start the conversation.</p>
        )}
      </div>
      <div className="form-container" ref={formContainerRef}>
        <form onSubmit={handleQandAAction} className="qna-form">
          <div className="input-button-wrapper">
            <textarea
              placeholder="Type your question"
              value={question}
              onInput={handleTextAreaInput}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyPress}
              className="question-input"
              style={{ overflowY: 'hidden' }} // Prevent scrollbar
              disabled={answering}
            />
            <button
              type="submit"
              className={`real-button ${question ? 'has-text' : ''}`}
              disabled={answering} // this will disable the button when answering is true
            >
              <BsFillArrowRightSquareFill size="2rem" className={answering ? 'spin' : ''} />
            </button>
          </div>
        </form>
        <PageMetadata metadata={vectorstore} taskType={taskType} />
      </div>
    </div>
  );
}
