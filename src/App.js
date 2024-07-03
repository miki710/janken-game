import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useEffect, useContext } from 'react';
import ModeSelectPage from './ModeSelectPage.js'; // ModeSelectPage をインポート
import WaitingRoomPage from './WaitingRoomPage.js';
import ImageSelectPage from './ImageSelectPage.js';
import ImageDisplayPage from './ImageDisplayPage.js';
import { UserProvider, UserContext } from './UserContext.js';

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

function AppContent() {
  const { setCookieUserId } = useContext(UserContext);

  useEffect(() => {
    // ルートURLにアクセスしてユーザーIDをクッキーに設定する関数
    const initializeUserId = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/`, {
          method: 'GET',
          credentials: 'include' // クッキーを含める
        });
        const data = await response.text();
        console.log(data); // レスポンスの確認
        
        // ユーザーIDだけを抽出
        const userId = data.replace(/.*: /, '').trim();
        setCookieUserId(userId); // ユーザーIDをコンテキストに設定
      } catch (error) {
        console.error('ユーザーIDの初期化中にエラーが発生しました:', error);
      }
    };

    initializeUserId();
  }, [setCookieUserId]);

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