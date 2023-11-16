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
export default function PageMetadata({ metadata, taskType }) {
  return metadata ? (
    <div className={`page-metadata${taskType === 'summary' ? ' page-metadata-summary' : ''}`}>
      <div className="metadata-content">
        {metadata.tabID && (
          <div
            onClick={() => switchToTab(metadata.tabID, metadata.pageURL)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                switchToTab(metadata.tabID, metadata.pageURL);
              }
            }}
            tabIndex={0}
            role="button"
            className="icon-wrapper"
            title="Switch to tab">
            <VscBrowser size="1em" /> {/* Adjust the size as needed */}
          </div>
        )}
        {/* Display task type specific text */}
        {taskType === 'summary' && <span className="task-type-text">Summarized: </span>}
        {taskType === 'qanda' && <span className="task-type-text">Chatting with: </span>}
        {/* Display the page URL or file name */}
        {metadata.pageURL ? (
          <a href={metadata.pageURL} target="_blank" rel="noopener noreferrer">
            {metadata.pageURL}
          </a>
        ) : metadata.fileName ? (
          <span className="task-type-text">Chatting with: {metadata.fileName}</span>
        ) : null}
      </div>
    </div>
  ) : null;
}

PageMetadata.propTypes = {
  taskType: PropTypes.string.isRequired,
  metadata: PropTypes.shape({
    text: PropTypes.string, // can be optional
    pageURL: PropTypes.string, // can be optional
    fileName: PropTypes.string, // can be optional
    tabID: PropTypes.number, // can be optional
  }),
};
