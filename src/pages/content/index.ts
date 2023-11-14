import { Readability } from '@mozilla/readability';

export type GetPageContentRequest = {
  action: 'getPageContent';
  tabID?: number;
};

export type GetPageContentResponse = {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
  lang: string;
  pageURL: string;
  tabID?: number;
};

chrome.runtime.onMessage.addListener((request: GetPageContentRequest, _sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    try {
      const documentClone = document.cloneNode(true) as Document;
      console.log('extracting content');
      const article = new Readability(documentClone).parse();
      if (article) {
        const a: GetPageContentResponse = { ...article, pageURL: documentClone.URL, tabID: request.tabID };
        console.log('sending response', a);
        sendResponse(a);
      } else {
        sendResponse({ error: 'Readability failed' });
      }
    } catch (e) {
      console.error('Error in parsing:', e);
      sendResponse({ error: 'Readability exception' });
    }
    return true; // will respond asynchronously
  }
});

console.log('content loaded');
