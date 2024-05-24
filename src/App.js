import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ModeSelectPage from './ModeSelectPage.js'; // ModeSelectPage をインポート
import WaitingRoomPage from './WaitingRoomPage.js';
import ImageSelectPage from './ImageSelectPage.js';
import ImageDisplayPage from './ImageDisplayPage.js';
import { SocketProvider } from './context/SocketContext.js';

function App() {
  
  return (
    <BrowserRouter basename="/f2e/ms/janken-game2">
      <SocketProvider>
        <Routes>
          <Route path="/" element={<ModeSelectPage />} /> 
          <Route path="/waiting" element={<WaitingRoomPage />} />
          <Route path="/game" element={<ImageSelectPage />} /> 
          <Route path="/display" element={<ImageDisplayPage />} />
        </Routes>
      </SocketProvider>
  </BrowserRouter>
  );
}
      


export default App;