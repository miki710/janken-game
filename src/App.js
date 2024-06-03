import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ModeSelectPage from './ModeSelectPage.js'; // ModeSelectPage をインポート
import WaitingRoomPage from './WaitingRoomPage.js';
import ImageSelectPage from './ImageSelectPage.js';
import ImageDisplayPage from './ImageDisplayPage.js';


function App() {
  
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<ModeSelectPage />} /> 
          <Route path="/waiting" element={<WaitingRoomPage />} />
          <Route path="/game" element={<ImageSelectPage />} /> 
          <Route path="/display" element={<ImageDisplayPage />} />
        </Routes>
  </BrowserRouter>
  );
}
      


export default App;