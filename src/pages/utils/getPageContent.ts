import { GetPageContentRequest, GetPageContentResponse } from '../content';

export async function getPageContent() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab.id) return;
  try {
    return await chrome.tabs.sendMessage<GetPageContentRequest, GetPageContentResponse>(tab.id, {
      action: 'getPageContent',
    });
  } catch (error) {
    console.error(error);
    throw new Error('Unable to get page content');
  }
}
