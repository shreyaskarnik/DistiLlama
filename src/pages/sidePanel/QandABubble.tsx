import { talkToDocument } from '@root/src/pages/sidePanel/QandA';
import { useState, useEffect } from 'react';
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
      ) : (
        <LinearProgress variant="determinate" value={100} color="success" />
      )}
    </div>
  );
}

export function QandABubble({ selectedModel, vectorstore }) {
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');

  const handleQandAAction = async e => {
    // clear the answer
    setAnswer('');
    e.preventDefault(); // Prevent page reload on form submit
    console.log('Model used for QandA: ', selectedModel);
    console.log('Question: ', question); // You can now use the question value
    const chain = talkToDocument(selectedModel, question, vectorstore);

    for await (const chunk of chain) {
      if (chunk) {
        setAnswer(prevAnswer => prevAnswer + chunk);
      }
    }
  };

  useEffect(() => {
    // Clear the answer when a new model is selected
    setAnswer('');
  }, [selectedModel]);

  return (
    <div>
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
      {/* <textarea placeholder="Answer" value={answer} readOnly className="answer-textarea" /> */}
      {answer ? <div className="content-box">{answer}</div> : null}
    </div>
  );
}
