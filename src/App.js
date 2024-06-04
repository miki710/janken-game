import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import ModeSelectPage from './ModeSelectPage.js'; // ModeSelectPage をインポート
import WaitingRoomPage from './WaitingRoomPage.js';
import ImageSelectPage from './ImageSelectPage.js';
import ImageDisplayPage from './ImageDisplayPage.js';


function App() {
  useEffect(() => {
    // ルートURLにアクセスしてユーザーIDをクッキーに設定する関数
    const initializeUserId = async () => {
      try {
        const response = await fetch('https://localhost:3001/', {
          method: 'GET',
          credentials: 'include' // クッキーを含める
        });
        const data = await response.text();
        console.log(data); // レスポンスの確認
      } catch (error) {
        console.error('ユーザーIDの初期化中にエラーが発生しました:', error);
      }
    };

    initializeUserId();
  }, []);
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