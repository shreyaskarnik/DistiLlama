import ReactMarkdown from 'react-markdown';
export default function Instructions() {
  const markdown = `
  # Ollama Not Running
  - Download Ollama from [here](https://ollama.ai)
  - Make sure you set OLLAMA_ORIGINS=* for the Ollama environment by following instructions [here](https://github.com/ollama/ollama/blob/main/docs/faq.md#how-do-i-configure-ollama-server)
  - Download models from [here](https://ollama.ai/library)
  `;

  return (
    <div className="server-not-running">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
