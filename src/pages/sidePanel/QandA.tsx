import { getPageContent } from '@src/pages/utils/getPageContent';
import { BaseLanguageModel } from 'langchain/base_language';
import { ChatOllama } from 'langchain/chat_models/ollama';
import { OllamaEmbeddings } from 'langchain/embeddings/ollama';
import { Document } from 'langchain/document';
import { ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from 'langchain/prompts';
import { AIMessage, BaseMessage, HumanMessage } from 'langchain/schema';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { BaseRetriever } from 'langchain/schema/retriever';
import { RunnableSequence } from 'langchain/schema/runnable';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { VoyVectorStore } from 'langchain/vectorstores/voy';
import { Voy as VoyClient } from 'voy-search';

export type ChatWindowMessage = {
  content: string;
  role: 'human' | 'ai';
  runId?: string;
  traceUrl?: string;
};

const OLLAMA_BASE_URL = 'http://localhost:11435';
const pageContent = await getPageContent();
const embeddings = new OllamaEmbeddings({
  baseUrl: OLLAMA_BASE_URL,
  model: 'mistral',
});
const voyClient = new VoyClient();
const vectorstore = new VoyVectorStore(voyClient, embeddings);
const ollama = new ChatOllama({
  baseUrl: OLLAMA_BASE_URL,
  temperature: 0.3,
  model: 'mistral',
});
const REPHRASE_QUESTION_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone Question:`;

const rephraseQuestionChainPrompt = PromptTemplate.fromTemplate(REPHRASE_QUESTION_TEMPLATE);

const RESPONSE_SYSTEM_TEMPLATE = `You are an experienced researcher, expert at interpreting and answering questions based on provided sources. Using the provided context, answer the user's question to the best of your ability using the resources provided.
Generate a concise answer for a given question based solely on the provided search results (URL and content). You must only use information from the provided search results. Use an unbiased and journalistic tone. Combine search results together into a coherent answer. Do not repeat text.
If there is nothing in the context relevant to the question at hand, just say "Hmm, I'm not sure." Don't try to make up an answer.
Anything between the following \`context\` html blocks is retrieved from a knowledge bank, not part of the conversation with the user.
<context>
    {context}
<context/>

REMEMBER: If there is no relevant information within the context, just say "Hmm, I'm not sure." Don't try to make up an answer. Anything between the preceding 'context' html blocks is retrieved from a knowledge bank, not part of the conversation with the user.`;

const responseChainPrompt = ChatPromptTemplate.fromMessages<{
  context: string;
  chat_history: BaseMessage[];
  question: string;
}>([['system', RESPONSE_SYSTEM_TEMPLATE], new MessagesPlaceholder('chat_history'), ['user', `{question}`]]);

const formatDocs = (docs: Document[]) => {
  return docs.map((doc, i) => `<doc id='${i}'>${pageContent}</doc>`).join('\n');
};
const createRetrievalChain = (llm: BaseLanguageModel, retriever: BaseRetriever, chatHistory: ChatWindowMessage[]) => {
  if (chatHistory.length) {
    return RunnableSequence.from([rephraseQuestionChainPrompt, llm, new StringOutputParser(), retriever, formatDocs]);
  } else {
    return RunnableSequence.from([input => input.question, retriever, formatDocs]);
  }
};
const embedDocs = async () => {
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
};

const _formatChatHistoryAsMessages = async (chatHistory: ChatWindowMessage[]) => {
  return chatHistory.map(chatMessage => {
    if (chatMessage.role === 'human') {
      return new HumanMessage(chatMessage.content);
    } else {
      return new AIMessage(chatMessage.content);
    }
  });
};

const queryVectorStore = async (messages: ChatWindowMessage[]) => {
  const text = messages[messages.length - 1].content;
  const chatHistory: ChatWindowMessage[] = messages.slice(0, -1);

  const retrievalChain = createRetrievalChain(ollama, vectorstore.asRetriever(), chatHistory);
  const responseChain = RunnableSequence.from([responseChainPrompt, ollama, new StringOutputParser()]);

  const fullChain = RunnableSequence.from([
    {
      question: input => input.question,
      chat_history: RunnableSequence.from([input => input.chat_history, _formatChatHistoryAsMessages]),
      context: RunnableSequence.from([
        input => {
          const formattedChatHistory = input.chat_history
            .map((message: ChatWindowMessage) => `${message.role.toUpperCase()}: ${message.content}`)
            .join('\n');
          return {
            question: input.question,
            chat_history: formattedChatHistory,
          };
        },
        retrievalChain,
      ]),
    },
    responseChain,
  ]);

  const stream = await fullChain.stream({
    question: text,
    chat_history: chatHistory,
  });

  for await (const chunk of stream) {
    if (chunk) {
      self.postMessage({
        type: 'chunk',
        data: chunk,
      });
    }
  }

  self.postMessage({
    type: 'complete',
    data: 'OK',
  });
};

// Listen for messages from the main thread
// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener('message', async (event: any) => {
  self.postMessage({
    type: 'log',
    data: `Received data!`,
  });

  if (event.data.pdf) {
    try {
      await embedDocs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      self.postMessage({
        type: 'error',
        error: e.message,
      });
      throw e;
    }
  } else {
    try {
      await queryVectorStore(event.data.messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      self.postMessage({
        type: 'error',
        error: `${e.message}. Make sure you are running Ollama.`,
      });
      throw e;
    }
  }

  self.postMessage({
    type: 'complete',
    data: 'OK',
  });
});
