//  this is a common header component which will be used in both the summary and Q&A pages

import '@pages/common/Header.css';
import { FaBackspace, FaCog } from 'react-icons/fa';
import { IoIosRefresh } from 'react-icons/io';
// eslint-disable-next-line react/prop-types
const Header = ({ onBack, onRefresh, onOpenSettings }) => {
  return (
    <div className="header">
      <FaBackspace size="2rem" className="button" onClick={onBack} title="Go Back" />
      <FaCog size="2rem" className="button center-button" onClick={onOpenSettings} title="Settings" />
      <IoIosRefresh size="2rem" className="button" onClick={onRefresh} title="Refresh" />
    </div>
  );
};

export default Header;
