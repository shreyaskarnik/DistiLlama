import { getPageContent } from '@src/pages/utils/getPageContent';
import { Document } from 'langchain/document';
import { HuggingFaceTransformersEmbeddings } from 'langchain/embeddings/hf_transformers';
import { Ollama } from 'langchain/llms/ollama';
import { PromptTemplate } from 'langchain/prompts';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { RunnablePassthrough, RunnableSequence } from 'langchain/schema/runnable';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { formatDocumentsAsString } from 'langchain/util/document';
import { VoyVectorStore } from 'langchain/vectorstores/voy';
import { type TextItem } from 'pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js';
import * as PDFLib from 'pdfjs-dist';
import { Voy as VoyClient } from 'voy-search';
import * as pdfWorker from '../../../node_modules/pdfjs-dist/build/pdf.worker.mjs';
PDFLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const OLLAMA_BASE_URL = 'http://localhost:11435';
type ConversationalRetrievalQAChainInput = {
  question: string;
  chat_history: { question: string; answer: string }[];
};

async function setupVectorstore(selectedModel) {
  console.log('Setting up vectorstore', selectedModel);
  const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: 'Xenova/all-MiniLM-L6-v2',
  });
  const voyClient = new VoyClient();
  return new VoyVectorStore(voyClient, embeddings);
}
export async function embedDocs(selectedModel, localFile) {
  console.log('Embedding documents');
  console.log('localFile', localFile);
  const vectorstore = await setupVectorstore(selectedModel);
  let documents: Document[] = [];
  let pageContent;
  if (!localFile) {
    pageContent = await getPageContent();
    documents.push(
      new Document({
        pageContent: pageContent.textContent,
      }),
    );
  }
  if (localFile) {
    documents = await handlePDFFile(localFile);
  }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkOverlap: 20,
    chunkSize: 500,
  });
  const splitDocs = await splitter.splitDocuments(documents);
  await vectorstore.addDocuments(splitDocs);
  console.log('Added documents to vectorstore');
  return vectorstore;
}

export async function* talkToDocument(selectedModel, vectorStore, input: ConversationalRetrievalQAChainInput) {
  const llm = new Ollama({
    baseUrl: OLLAMA_BASE_URL,
    model: selectedModel,
    temperature: 0.1,
  });
  console.log('question', input.question);
  console.log('chat_history', input.chat_history);
  console.log('vectorStore', vectorStore);
  const retriever = vectorStore.asRetriever();
  const context = retriever.pipe(formatDocumentsAsString);
  console.log('context', context);
  const condenseQuestionTemplate = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

  Chat History:
  {chat_history}
  Follow Up Input: {question}
  Standalone question:`;
  const condense_question_prompt = PromptTemplate.fromTemplate(condenseQuestionTemplate);
  const prompt = PromptTemplate.fromTemplate(`
  Answer the question based only on the following context:
  Do not use any other sources of information.
  Do not provide any answer that is not based on the context.
  If there is no answer, type "Not sure based on the context".
  {context}

  Question: {question}
  Answer:
  `);
  const standaloneQuestionChain = RunnableSequence.from([
    {
      question: (input: ConversationalRetrievalQAChainInput) => input.question,
      chat_history: (input: ConversationalRetrievalQAChainInput) => formatChatHistory(input.chat_history),
    },
    condense_question_prompt,
    llm,
    new StringOutputParser(),
  ]);
  const answer_chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);
  const chain = standaloneQuestionChain.pipe(answer_chain);
  const stream = await chain.stream(input);

  for await (const chunk of stream) {
    yield chunk;
  }
}

const formatChatHistory = (chatHistory: { question: string; answer: string }[]) => {
  console.log('chatHistory', chatHistory);
  const formattedDialogueTurns = chatHistory.map(
    dialogueTurn => `Human: ${dialogueTurn.question}\nAssistant: ${dialogueTurn.answer}`,
  );
  console.log('formattedDialogueTurns', formattedDialogueTurns);
  return formattedDialogueTurns.join('\n');
};

export async function handlePDFFile(selectedFile) {
  // Load PDF document into array buffer
  const arrayBuffer = await selectedFile.arrayBuffer();

  const arrayBufferUint8 = new Uint8Array(arrayBuffer);
  const parsedPdf = await PDFLib.getDocument(arrayBufferUint8).promise;

  const meta = await parsedPdf.getMetadata().catch(() => null);
  const documents: Document[] = [];

  for (let i = 1; i <= parsedPdf.numPages; i += 1) {
    const page = await parsedPdf.getPage(i);
    const content = await page.getTextContent();

    if (content.items.length === 0) {
      continue;
    }

    const text = content.items.map(item => (item as TextItem).str).join('\n');

    documents.push(
      new Document({
        pageContent: text,
        metadata: {
          pdf: {
            info: meta?.info,
            metadata: meta?.metadata,
            totalPages: parsedPdf.numPages,
          },
          loc: {
            pageNumber: i,
          },
        },
      }),
    );
  }
  return documents;
}
