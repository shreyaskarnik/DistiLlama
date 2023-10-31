//  this is a common header component which will be used in both the summary and Q&A pages

import '@pages/common/Header.css';
import { FaBackspace } from 'react-icons/fa';
import { IoIosRefresh } from 'react-icons/io';
// eslint-disable-next-line react/prop-types
const Header = ({ onBack, onRefresh }) => {
  return (
    <div className="header">
      <FaBackspace size="2rem" className="button" onClick={onBack} />
      <IoIosRefresh size="2rem" className="button" onClick={onRefresh} />
    </div>
  );
};

export default Header;
