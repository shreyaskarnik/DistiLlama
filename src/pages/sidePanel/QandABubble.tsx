import { talkToDocument } from '@root/src/pages/sidePanel/QandA';
import React, { useState, useEffect } from 'react';
/* eslint-disable react/prop-types */
export default function QandAStatus({ embedding, vectorstore }) {
  return <div>{embedding ? 'Embedding...' : vectorstore ? 'Thinking...' : ''}</div>;
}

export function QandABubble({ selectedModel, vectorstore, embedding }) {
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');

  const handleQandAAction = async e => {
    // clear the answer
    setAnswer('');
    e.preventDefault(); // Prevent page reload on form submit
    console.log('Model used for QandA: ', selectedModel);
    console.log('Question: ', question); // You can now use the question value
    const chain = await talkToDocument(selectedModel, question, vectorstore);

    for await (const chunk of chain) {
      if (chunk) {
        console.log('chunk', chunk);
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
        <input
          type="text"
          placeholder="Type your question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          className="question-input"
        />
        <button type="submit" className="real-button">
          Submit Question
        </button>
      </form>
      <textarea placeholder="Answer" value={answer} readOnly className="answer-textarea" />
    </div>
  );
}
