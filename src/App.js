import './styles/index.css';
import React from 'react';
import Main from './components/Main';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Lists</h1>
        <ErrorBoundary>
          <Main />
        </ErrorBoundary>
      </header>
    </div>
  );
}

export default App;
