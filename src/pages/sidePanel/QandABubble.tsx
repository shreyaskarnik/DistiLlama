/* eslint-disable react/prop-types */
export default function QandABubble({ embedding, vectorstore, answer }) {
  return (
    <div>
      {embedding ? (
        'Embedding...'
      ) : vectorstore ? (
        'Thinking...'
      ) : answer ? (
        <div className="content-box">{answer}</div>
      ) : (
        ''
      )}
    </div>
  );
}
