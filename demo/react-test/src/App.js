import React from 'react';
import logo from './logo.svg';
import './App.scss';
import ZedTest from './components/ZedTest'

function App() {
  return (
    <div className="app">
      <h1><img src={logo} className="App-logo" alt="logo" />Zed demo with React</h1>
      <ZedTest/>
    </div>
  );
}

export default App;
