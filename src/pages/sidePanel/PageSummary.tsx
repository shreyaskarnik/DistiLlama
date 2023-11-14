import { LinearProgress } from '@mui/material';
import { VscBrowser } from 'react-icons/vsc';
/* eslint-disable react/prop-types */
function switchToTab(tabId) {
  // check if running on Chrome
  if (typeof chrome === 'undefined') {
    return;
  }
  chrome.tabs.update(tabId, { active: true }, function () {
    // You can handle errors here if the tab ID is invalid or the tab is closed
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    }
  });
}
export default function PageSummary({ loading, summary }) {
  return (
    <div>
      {/* while loading show LinearProgress  */}
      {loading ? (
        <div>
          <span>Generating summary...</span>
          <LinearProgress color="primary" />
        </div>
      ) : summary ? (
        <div>
          <div className="content-box">{summary.text}</div>
          <div className="summary-footer">
            <div>
              <span>Summary of:</span> {/* Shortened text */}
              <a href={summary.pageURL} target="_blank" rel="noopener noreferrer">
                {summary.pageURL}
              </a>
            </div>
            <div
              onClick={() => switchToTab(summary.tabID)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  switchToTab(summary.tabID);
                }
              }}
              tabIndex={0}
              role="button"
              style={{ cursor: 'pointer' }}>
              <VscBrowser size="1.5rem" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
