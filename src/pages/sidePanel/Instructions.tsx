import ReactMarkdown from 'react-markdown';
export default function Instructions() {
  const markdown = `
  # Ollama Not Running
  - Download Ollama from [here](https://ollama.ai)
   - To start the server, run the following command:
    \`\`\`bash
    OLLAMA_ORIGINS=* OLLAMA_HOST=127.0.0.1:11435 ollama serve
    \`\`\`
  - Download models from [here](https://ollama.ai/library)
  `;

  return (
    <div className="server-not-running">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
