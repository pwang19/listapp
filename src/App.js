import './App.css';
import React from 'react';
import Main from './components/Main';

function App() {
  return (
    <div className="App">
      <header className="App-header" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', width: '100%' }}>Lists</h1>
        <Main />
      </header>
    </div>
  );
}

export default App;
