import { loadSummarizationChain } from 'langchain/chains';
import { ChatOllama } from 'langchain/chat_models/ollama';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getPageContent } from '@src/pages/utils/getPageContent';

async function summarizeCurrentPage() {
  try {
    const pageContent = await getPageContent();

    if (!pageContent) return;

    const llm = new ChatOllama({
      baseUrl: 'http://localhost:11435',
      temperature: 0.3,
      model: 'mistral',
    });
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
    });
    const docs = await textSplitter.createDocuments([pageContent.textContent]);
    const chain = loadSummarizationChain(llm, {
      type: 'map_reduce',
      verbose: true,
    });
    const response = await chain.call({
      input_documents: docs,
    });
    return response.text;
  } catch (error) {
    console.error(error);
  }
}
export { summarizeCurrentPage };
