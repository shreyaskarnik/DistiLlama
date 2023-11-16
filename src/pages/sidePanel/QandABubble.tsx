import LinearProgress from '@mui/material/LinearProgress';
import { talkToDocument, chatWithLLM } from '@root/src/pages/sidePanel/QandA';
import { useEffect, useRef, useState } from 'react';
import { BsFillArrowRightSquareFill } from 'react-icons/bs';
import PageMetadata from '@root/src/pages/sidePanel/PageMetadata';
/* eslint-disable react/prop-types */
export function QandAStatus({ embedding, vectorstore }) {
  return (
    <div>
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
  console.log('QandABubble: ', taskType, selectedModel, vectorstore);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [answering, setAnswering] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [chat_history = [], setChatHistory] = useState([]);
  const endOfChatHistoryRef = useRef(null);
  const scrollToBottom = () => {
    endOfChatHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    console.log('Model used for QandA: ', selectedModel);
    console.log('Question: ', question); // You can now use the question value
    // clear the answer
    setAnswer('');
    setAnswering(true);
    const chain =
      taskType === 'qanda' || taskType === 'docs'
        ? talkToDocument(selectedModel, vectorstore.vectorstore, { question, chat_history })
        : chatWithLLM(selectedModel, { question, chat_history });
    let completeAnswer = ''; // Initialize a variable to hold the full answer
    for await (const chunk of chain) {
      if (chunk) {
        completeAnswer += chunk;
        setAnswer(prevAnswer => prevAnswer + chunk);
      }
      // {"question": "", "answer": ""} is chat history
      // need to add chat_history_current to chat_history
    }
    if (completeAnswer) {
      // Only update chat history if there is an answer
      setChatHistory(prevChatHistory => [...prevChatHistory, { question, answer: completeAnswer }]);
      setQuestion(''); // Reset question input after submitting
      setAnswering(false);
    }
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
            />
            <button
              type="submit"
              className={`real-button ${question ? 'has-text' : ''}`}
              disabled={answering} // this will disable the button when answering is true
            >
              <BsFillArrowRightSquareFill size="2rem" />
            </button>
          </div>
        </form>
        <AnsweringStatus answering={answering} />
        <PageMetadata metadata={vectorstore} taskType={taskType} />
      </div>
    </div>
  );
}
