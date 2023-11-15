import { LinearProgress } from '@mui/material';

/* eslint-disable react/prop-types */
export default function PageSummary({ loading, summary, taskType }) {
  console.log('taskType: ', taskType);
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
        </div>
      ) : null}
    </div>
  );
}
