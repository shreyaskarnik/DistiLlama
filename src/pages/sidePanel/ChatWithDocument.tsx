import React, { useCallback, useState } from 'react';
import { BsFillArrowRightSquareFill } from 'react-icons/bs';
import Settings from '@root/src/pages/sidePanel/Settings';

// eslint-disable-next-line react/prop-types
const ChatWithDocument = ({ handleQandAAction, setSelectedParams, setSelectedPDF }) => {
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleFileChange = useCallback(
    e => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedPDF(file);
        setSelectedFileName(file.name); // Set the file name
      }
    },
    [setSelectedPDF],
  );

  return (
    <div className="App-content">
      <div className="action">
        <Settings onParamChange={setSelectedParams} />
        <div className="form-container">
          <form onSubmit={handleQandAAction} className="qna-form">
            <div className="input-button-wrapper">
              <input
                id="file_input"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="file_input" className="dropzone-label">
                {selectedFileName || 'Click to select PDF file'}
              </label>
              <button type="submit" className="real-button">
                <BsFillArrowRightSquareFill size="2rem" />
              </button>
            </div>
            {selectedFileName && <div className="file-name-display">Selected File: {selectedFileName}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatWithDocument;
