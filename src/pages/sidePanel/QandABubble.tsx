import { talkToDocument } from '@root/src/pages/sidePanel/QandA';
import { useState, useEffect, useRef } from 'react';
import LinearProgress from '@mui/material/LinearProgress';
/* eslint-disable react/prop-types */
export function QandAStatus({ embedding, vectorstore }) {
  return (
    <div>
      {/* while embedding==true show LinearProgress moving else show LinearProgress Solid */}
      {embedding && vectorstore === null ? (
        <div>
          <span>Embedding documents...</span>
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

export function QandABubble({ selectedModel, vectorstore }) {
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

  useEffect(() => {
    scrollToBottom();
  }, [chat_history]);

  const handleQandAAction = async e => {
    // clear the answer
    setAnswer('');
    setAnswering(true);
    e.preventDefault(); // Prevent page reload on form submit
    console.log('Model used for QandA: ', selectedModel);
    console.log('Question: ', question); // You can now use the question value
    const chain = talkToDocument(selectedModel, vectorstore, {
      question,
      chat_history: chat_history,
    });
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
      <AnsweringStatus answering={answering} />
      <div className="content-box">
        {chat_history.length > 0 && (
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
        )}
      </div>
      <div className="form-container">
        <form onSubmit={handleQandAAction} className="qna-form">
          <div className="input-button-wrapper">
            <input
              type="text"
              placeholder="Type your question"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="question-input"
            />
            <button type="submit" className={`real-button ${question ? 'has-text' : ''}`}>
              →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
