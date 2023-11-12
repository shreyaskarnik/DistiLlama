import { getPageContent } from '@src/pages/utils/getPageContent';
import { loadSummarizationChain } from 'langchain/chains';
import { ChatOllama } from 'langchain/chat_models/ollama';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OLLAMA_BASE_URL } from '@src/pages/sidePanel/QandA';

async function summarizeCurrentPage(selectedModel) {
  console.log('Inside summarizeCurrentPage with model: ', selectedModel);
  try {
    const pageContent = await getPageContent();

    if (!pageContent) return;

    const llm = new ChatOllama({
      baseUrl: OLLAMA_BASE_URL, // change if you are using a different endpoint
      temperature: 0.3, // change if you want to experiment with different temperatures
      model: selectedModel, // change if you want to use a different model
    });
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
    });
    const docs = await textSplitter.createDocuments([pageContent.textContent]);
    const chain = loadSummarizationChain(llm, {
      type: 'map_reduce', // you can choose from map_reduce, stuff or refine
      verbose: true, // to view the steps in the console
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
