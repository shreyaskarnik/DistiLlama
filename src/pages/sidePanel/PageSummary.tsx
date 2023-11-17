import { LinearProgress } from '@mui/material';
import PageMetadata from '@root/src/pages/sidePanel/PageMetadata';

/* eslint-disable react/prop-types */
export default function PageSummary({ loading, summary, taskType }) {
  console.log('PageSummary: ', loading, summary, taskType);
  return (
    <div>
      {/* while loading show LinearProgress  */}
      {loading ? (
        <div className="form-container">
          <span>Generating summary...</span>
          <LinearProgress color="primary" />
        </div>
      ) : summary ? (
        <div>
          <div className="content-box">{summary.text}</div>
          <div className="form-container">
            <PageMetadata metadata={summary} taskType={taskType} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
