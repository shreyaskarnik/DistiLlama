import { getPageContent } from '@src/pages/utils/getPageContent';
import { loadSummarizationChain } from 'langchain/chains';
import { ChatOllama } from 'langchain/chat_models/ollama';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OLLAMA_BASE_URL } from '@src/pages/utils/constants';

export type SummarizationResponse = {
  title?: string;
  text: string;
  pageURL: string;
  tabID?: number;
};

async function summarizeCurrentPage(selectedParams) {
  console.log('Inside summarizeCurrentPage with model: ', selectedParams);
  try {
    const pageContent = await getPageContent();
    if (!pageContent) return;

    const llm = new ChatOllama({
      baseUrl: OLLAMA_BASE_URL, // change if you are using a different endpoint
      temperature: selectedParams.temperature,
      model: selectedParams.model.name,
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
    return {
      title: pageContent.title,
      text: response.text,
      pageURL: pageContent.pageURL,
      tabID: pageContent.tabID,
    } as SummarizationResponse;
  } catch (error) {
    console.error(error);
  }
}
export { summarizeCurrentPage };
