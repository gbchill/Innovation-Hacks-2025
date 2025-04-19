import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import BrowserPage from './pages/BrowserPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/browser',
    element: <BrowserPage />
  }
]);

export default router;