/* eslint-disable react/prop-types */
export default function PageSummary({ loading, summary }) {
  return <div>{loading ? 'Generating...' : summary ? <div className="content-box">{summary}</div> : ''}</div>;
}
