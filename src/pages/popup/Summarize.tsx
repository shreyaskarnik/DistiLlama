import { loadSummarizationChain } from 'langchain/chains';
import { ChatOllama } from 'langchain/chat_models/ollama';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getPageContent } from '@src/pages/utils/getPageContent';

async function getModels() {
  try {
    const models = [];
    const response = await fetch('http://localhost:11435/api/tags');
    const data = await response.json();
    // {"models": [{ "name": "llama2:latest","modified_at": "2023-10-28T17:51:44.867165975-07:00","size": 3825819519,"digest": "fe938a131f40e6f6d40083c9f0f430a515233eb2edaa6d72eb85c50d64f2300e"}]}
    // we want to return the name of the model
    // so that we can use it in the dropdown selection
    for (let i = 0; i < data.models.length; i++) {
      // split the name of the model by the colon
      // and return the first element of the array
      models.push(data.models[i].name.split(':')[0]);
    }
    return models;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function summarizeCurrentPage(selectedModel) {
  console.log('Inside summarizeCurrentPage with model: ', selectedModel);
  try {
    const pageContent = await getPageContent();

    if (!pageContent) return;

    const llm = new ChatOllama({
      baseUrl: 'http://localhost:11435', // change if you are using a different endpoint
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
export { summarizeCurrentPage, getModels };
