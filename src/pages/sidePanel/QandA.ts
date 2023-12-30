import { getPageContent } from '@src/pages/utils/getPageContent';
import { ConversationChain } from 'langchain/chains';
import { ChatOllama } from 'langchain/chat_models/ollama';
import { Document } from 'langchain/document';
import { HuggingFaceTransformersEmbeddings } from 'langchain/embeddings/hf_transformers';
import { Ollama } from 'langchain/llms/ollama';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import { HumanMessage, AIMessage } from 'langchain/schema';
import { PromptTemplate, ChatPromptTemplate, MessagesPlaceholder } from 'langchain/prompts';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { RunnablePassthrough, RunnableSequence } from 'langchain/schema/runnable';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { formatDocumentsAsString } from 'langchain/util/document';
import { VoyVectorStore } from 'langchain/vectorstores/voy';
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression';
import { EmbeddingsFilter } from 'langchain/retrievers/document_compressors/embeddings_filter';
import { type TextItem } from 'pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js';
import * as PDFLib from 'pdfjs-dist';
import { Voy as VoyClient } from 'voy-search';
import * as pdfWorker from '../../../node_modules/pdfjs-dist/build/pdf.worker.mjs';
PDFLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const OLLAMA_BASE_URL = 'http://localhost:11435';
export type ConversationalRetrievalQAChainInput = {
  question: string;
  chat_history: { question: string; answer: string }[];
};

async function setupVectorstore(selectedModel) {
  console.log('Setting up vectorstore', selectedModel);
  const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: 'Xenova/jina-embeddings-v2-small-en',
  });
  const voyClient = new VoyClient();
  return new VoyVectorStore(voyClient, embeddings);
}
export type EmbedDocsOutput = {
  vectorstore: VoyVectorStore;
  pageURL?: string;
  tabID?: number;
  fileName?: string;
  starterQuestions?: string[];
};
export async function embedDocs(selectedModel, localFile): Promise<EmbedDocsOutput> {
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
        metadata: {
          pageURL: pageContent.pageURL,
          title: pageContent.title,
          length: pageContent.length,
          excerpt: pageContent.excerpt,
          byline: pageContent.byline,
          dir: pageContent.dir,
          siteName: pageContent.siteName,
          lang: pageContent.lang,
        },
      }),
    );
  } else {
    documents = await handlePDFFile(localFile);
  }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkOverlap: 20,
    chunkSize: 500,
  });
  const splitDocs = await splitter.splitDocuments(documents);
  await vectorstore.addDocuments(splitDocs);
  console.log('Added documents to vectorstore');
  return pageContent
    ? ({ vectorstore, pageURL: pageContent.pageURL, tabID: pageContent.tabID } as EmbedDocsOutput)
    : ({ vectorstore, fileName: localFile.name } as EmbedDocsOutput);
}

export async function getDefaultStarterQuestions(selectedParams, vectorStore) {
  try {
    console.log('getDefaultStarterQuestions', selectedParams);
    const llm = new Ollama({
      baseUrl: OLLAMA_BASE_URL,
      model: selectedParams.model.name,
      temperature: selectedParams.temperature,
    });
    console.log('vectorStore', vectorStore);
    const retriever = vectorStore.asRetriever();

    const generateStarterQuestionsPrompt = `
    Given the following context and metadata, generate 1-2 questions that can be asked about the context.
    Return the questions as a list of strings. No additional output is needed. No numbers needed. Format output as JSON array of strings.

    {context}

    Metadata:
    {metadata}
    `;

    const starterQPrompt = PromptTemplate.fromTemplate(generateStarterQuestionsPrompt);
    const chain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocumentsAsString),
        metadata: retriever.pipe(documents => getMetadataString(documents)),
      },
      starterQPrompt,
      llm,
      new StringOutputParser(),
    ]);

    const resultString = await chain.invoke('');
    const resultArray = JSON.parse(resultString); // Parse the JSON string to an array
    return resultArray;
  } catch (error) {
    console.error('Error in getDefaultStarterQuestions:', error);
    // Handle the error or return an empty array/fallback value
    return [];
  }
}

export async function* talkToDocument(selectedParams, vectorStore, input: ConversationalRetrievalQAChainInput) {
  console.log('talkToDocument', selectedParams);
  const llm = new Ollama({
    baseUrl: OLLAMA_BASE_URL,
    model: selectedParams.model.name,
    temperature: selectedParams.temperature,
  });
  console.log('question', input.question);
  console.log('chat_history', input.chat_history);
  console.log('vectorStore', vectorStore);
  let retriever = vectorStore.asRetriever();
  if (input.chat_history.length !== 0) {
    const baseCompressor = new EmbeddingsFilter({
      embeddings: new HuggingFaceTransformersEmbeddings({
        modelName: 'Xenova/jina-embeddings-v2-small-en',
      }),
      similarityThreshold: 0.6,
    });
    retriever = new ContextualCompressionRetriever({
      baseCompressor,
      baseRetriever: vectorStore.asRetriever(),
    });
  }
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
  Additionally you will be given metadata like
  title,content,length,excerpt,byline,dir,siteName,lang
  in the metadata field. Use this information to help you answer the question.

  {context}

  Metadata:
  {metadata}

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
      metadata: retriever.pipe(documents => getMetadataString(documents)),
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

function getMetadataString(documents: Document[]) {
  try {
    const metadata = documents[0].metadata;
    if (!metadata) {
      return '';
    }
    const result = [];

    for (const key in metadata) {
      // Check if the property is not an object and not an array
      if (Object.prototype.hasOwnProperty.call(metadata, key) && typeof metadata[key] !== 'object') {
        result.push(`${key}: ${metadata[key]}`);
      }
    }
    console.log('result', result);

    return result.join(' ');
  } catch (e) {
    console.log('error', e);
    return '';
  }
}

export const formatChatHistory = (chatHistory: { question: string; answer: string }[]) => {
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

export async function* chatWithLLM(selectedParams, input: ConversationalRetrievalQAChainInput) {
  console.log('chatWithLLM', selectedParams);
  const llm = new ChatOllama({
    baseUrl: OLLAMA_BASE_URL,
    model: selectedParams.model.name,
    temperature: selectedParams.temperature,
  });
  const chatPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      'The following is a friendly conversation between a human and an assistant. The assistant polite and helpful and provides lots of specific details from its context. If the assistant does not know the answer to a question, it truthfully says it does not know.',
    ],
    new MessagesPlaceholder('history'),
    ['human', '{input}'],
  ]);
  const chatHistory = [];

  // Flatten the array of message pairs into a single array of BaseMessage instances
  input.chat_history.forEach(element => {
    chatHistory.push(new HumanMessage(element.question));
    chatHistory.push(new AIMessage(element.answer));
  });
  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: 'history',
    chatHistory: new ChatMessageHistory(chatHistory),
  });
  const chain = new ConversationChain({
    memory: memory,
    prompt: chatPrompt,
    llm: llm,
    verbose: true,
  });
  const stream = await chain.stream({
    input: input.question,
  });

  for await (const chunk of stream) {
    yield chunk.response;
  }
}
