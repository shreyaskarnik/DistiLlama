import React, { useCallback, useState, useEffect } from 'react';
import { BsFillArrowRightSquareFill } from 'react-icons/bs';
import ModelDropDown from '@root/src/pages/sidePanel/Models';

// eslint-disable-next-line react/prop-types
const ChatWithDocument = ({ handleQandAAction, setSelectedModel, setSelectedPDF }) => {
  const [fileDraggedOver, setFileDraggedOver] = useState(false);
  const onDragOver = useCallback(event => {
    event.preventDefault(); // Prevent file from being opened
    setFileDraggedOver(true);
  }, []);
  const handleDragLeave = () => {
    setFileDraggedOver(false);
  };
  const handleFileChange = useCallback(
    e => {
      if (e.target.files && e.target.files[0]) {
        setSelectedPDF(e.target.files[0]);
        setFileDraggedOver(true);
      }
    },
    [setSelectedPDF],
  );
  const onDrop = useCallback(
    event => {
      event.preventDefault();
      setFileDraggedOver(false);
      if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        const file = event.dataTransfer.files[0];
        setSelectedPDF(file);
        // Create a new event with the file as the target value
        const syntheticEvent = {
          target: {
            files: [file],
          },
        };
        handleFileChange(syntheticEvent); // Handle the file selection
        // Trigger the Q&A action as if the form was submitted
        handleQandAAction(event);
      }
    },
    [setSelectedPDF, handleQandAAction, handleFileChange],
  );

  useEffect(() => {
    setSelectedPDF(null);
    setSelectedModel(null);
  }, [setSelectedModel, setSelectedPDF]);

  return (
    <div className="App-content">
      <div className="action">
        <ModelDropDown onModelChange={setSelectedModel} />
        <div className="form-container">
          <form onSubmit={handleQandAAction} className="qna-form">
            <div className="input-button-wrapper" onDragOver={onDragOver} onDrop={onDrop}>
              <input
                id="file_input"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }} // Hide the input field
              />
              <label
                htmlFor="file_input"
                className={`dropzone-label ${fileDraggedOver ? 'file-dragged-over' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={handleDragLeave}
                onDrop={onDrop}>
                Drag and drop your PDF here, or click to select files
              </label>
              <button type="submit" className="real-button">
                <BsFillArrowRightSquareFill size="2rem" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatWithDocument;
