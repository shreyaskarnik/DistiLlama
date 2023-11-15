import { VscBrowser } from 'react-icons/vsc';
import PropTypes from 'prop-types';
function switchToTab(tabId, pageURL) {
  // check if running on Chrome
  if (typeof chrome === 'undefined') {
    return;
  }
  chrome.tabs.update(tabId, { active: true }, function () {
    // You can handle errors here if the tab ID is invalid or the tab is closed
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      // open a new tab with the url
      chrome.tabs.create({ url: pageURL });
    }
  });
}
// eslint-disable-next-line react/prop-types
export default function PageMetadata({ metadata, taskType, formContainerHeight }) {
  const style = formContainerHeight ? { bottom: `${formContainerHeight}px` } : {};
  let className = !formContainerHeight ? 'summary-footer' : 'summary-footer summary-footer-fixed';
  if (metadata.fileName !== '') {
    className += ' summary-docs';
  }
  return metadata ? (
    <div>
      <div className={className} style={style}>
        {metadata.pageURL ? (
          <div>
            {taskType === 'summary' ? <span>Summarized</span> : null}
            {taskType === 'qanda' ? <span>Chatting with</span> : null}
            <a href={metadata.pageURL} target="_blank" rel="noopener noreferrer">
              {metadata.pageURL}
            </a>
          </div>
        ) : null}
        {metadata.tabID ? (
          <div
            onClick={() => switchToTab(metadata.tabID, metadata.pageURL)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                switchToTab(metadata.tabID, metadata.pageURL);
              }
            }}
            tabIndex={0}
            role="button"
            style={{ cursor: 'pointer' }}>
            <VscBrowser size="1.5rem" />
          </div>
        ) : null}
        {metadata.fileName ? (
          <div>
            <span>Chatting with: {metadata.fileName}</span>
          </div>
        ) : null}
      </div>
    </div>
  ) : null;
}

PageMetadata.propTypes = {
  taskType: PropTypes.string.isRequired,
  formContainerHeight: PropTypes.number,
  metadata: PropTypes.shape({
    text: PropTypes.string, // can be optional
    pageURL: PropTypes.string, // can be optional
    fileName: PropTypes.string, // can be optional
    tabID: PropTypes.number, // can be optional
  }),
};
