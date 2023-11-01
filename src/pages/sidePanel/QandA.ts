import { getPageContent } from '@src/pages/utils/getPageContent';
import { Ollama } from 'langchain/llms/ollama';
import { OllamaEmbeddings } from 'langchain/embeddings/ollama';
import { Document } from 'langchain/document';
import { PromptTemplate } from 'langchain/prompts';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { RunnableSequence, RunnablePassthrough } from 'langchain/schema/runnable';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { VoyVectorStore } from 'langchain/vectorstores/voy';
import { Voy as VoyClient } from 'voy-search';
import { formatDocumentsAsString } from 'langchain/util/document';

const OLLAMA_BASE_URL = 'http://localhost:11435';
async function setupVectorstore(selectedModel) {
  console.log('Setting up vectorstore', selectedModel);
  const embeddings = new OllamaEmbeddings({
    baseUrl: OLLAMA_BASE_URL,
    model: selectedModel,
  });
  const voyClient = new VoyClient();
  return new VoyVectorStore(voyClient, embeddings);
}
export async function embedDocs(selectedModel) {
  console.log('Embedding documents');
  const vectorstore = await setupVectorstore(selectedModel);
  const pageContent = await getPageContent();
  const documents: Document[] = [];
  documents.push(
    new Document({
      pageContent: pageContent.textContent,
    }),
  );
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const splitDocs = await splitter.splitDocuments(documents);
  await vectorstore.addDocuments(splitDocs);
  console.log('Added documents to vectorstore');
  return vectorstore;
}

export async function talkToDocument(selectedModel, question, vectorStore) {
  const llm = new Ollama({
    baseUrl: OLLAMA_BASE_URL,
    model: selectedModel,
    temperature: 0.3,
  });
  console.log('question', question);
  console.log('vectorStore', vectorStore);
  const prompt = PromptTemplate.fromTemplate(`Answer the question based only on the following context:
{context}

Question: {question}`);
  const retriever = vectorStore.asRetriever();
  const context = retriever.pipe(formatDocumentsAsString);
  console.log('context', context);
  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);
  const stream = await chain.stream(question);

  for await (const chunk of stream) {
    if (chunk) {
      console.log('chunk', chunk);
    }
  }
}
