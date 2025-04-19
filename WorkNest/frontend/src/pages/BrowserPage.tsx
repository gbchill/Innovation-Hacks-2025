import ChromeBrowser from '../components/common/ChromeBrowser';
import { Link } from 'react-router-dom';

const BrowserPage = () => {
  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 bg-green-800 text-white">
        <div className="flex items-center">
          <Link to="/" className="mr-4 hover:bg-green-700 px-3 py-1 rounded">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-semibold">WorkNest Browser</h1>
        </div>
        <div className="text-sm">
          Powered by Chromium
        </div>
      </div>
      <ChromeBrowser initialUrl="https://www.google.com" />
    </div>
  );
};

export default BrowserPage;