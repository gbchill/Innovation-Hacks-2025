import { Link } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-100">
      <h1 className="text-4xl font-bold text-green-700 mb-8">
        WorkNest is Ready!
      </h1>
      <Link 
        to="/browser" 
        className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
      >
        Open Embedded Browser
      </Link>
    </div>
  );
}

export default App;