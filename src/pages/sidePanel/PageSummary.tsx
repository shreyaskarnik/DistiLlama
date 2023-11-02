import { LinearProgress } from '@mui/material';
/* eslint-disable react/prop-types */
export default function PageSummary({ loading, summary }) {
  return (
    <div>
      {/* while loading show LinearProgress  */}
      {loading ? (
        <div>
          <span>Generating summary...</span>
          <LinearProgress color="primary" />
        </div>
      ) : (
        <div className="content-box">{summary}</div>
      )}
    </div>
  );
}
