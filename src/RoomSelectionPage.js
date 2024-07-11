import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from './UserContext.js'; // UserContextをインポート
import './App.css';

function RoomSelectionPage() {
  const [rooms, setRooms] = useState(['Room 1', 'Room 2', 'Room 3']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = location.state || {}; // location.stateからmodeを取得
  const { cookieUserId } = useContext(UserContext); // UserContextからcookieUserIdを取得

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/vs-player/rooms`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Rooms fetched:', data.rooms); // ログ出力を追加
      setRooms(data.rooms);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('部屋の情報を取得できませんでした。');
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初回ロード時に部屋の状態を取得
    fetchRooms();

    // 5秒ごとに部屋の状態を更新
    const interval = setInterval(fetchRooms, 5000);

    // クリーンアップ
    return () => clearInterval(interval);
  }, []);

  const handleRoomSelect = (room) => {
    // サーバーに部屋参加リクエストを送信
    console.log('Joining room:', room.name); // ログ出力を追加
    // サーバーに部屋参加リクエストを送信
    fetch(`${process.env.REACT_APP_SERVER_URL}/vs-player/join-room?room=${room.name}`, { 
      method: 'POST',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        console.log('Join room response:', data); // ログ出力を追加
        if (data.success) {
          navigate('/match', { state: { mode , room: room.name }});
        } else {
          alert(data.message);
        }
      });
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className='App-header'>
        <ul className="background">
            {Array.from({ length: 25 }).map((_, index) => (
                <li key={index}></li>
            ))}
        </ul>
      <h1>💜対戦部屋を選択💜</h1>
      {rooms.map((room, index) => (
        <button 
            key={index} 
            onClick={() => handleRoomSelect(room)} 
            className={`room-button ${room.players.length === 2 ? 'red-neon-border' : ''}`}
        >
          {room.name} - {room.players.length === 0 ? '0人' : room.players.length === 2 ? '満員' : `${room.players.length}人 - ID: ${room.players[0].slice(-5)}`}
        </button>
      ))}
      <div className="rainbow-border" style={{ marginTop: '20px' }}>
            <button 
              onClick={() => navigate('/')}
              className="rainbow-button vs-player"  // クラスを追加
              style={{ fontSize: '18px' }}
            >
              Top画面へ戻る
            </button>
        </div> 
       <p style={{ fontSize: '12px' }}>User ID: {cookieUserId}</p>
    </div>
  );
}

export default RoomSelectionPage;