import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from './UserContext.js'; // UserContext をインポート
import useAutoLeaveRoom from './useAutoLeaveRoom.js'; 
import './App.css';

function MatchPage() {
    const { cookieUserId } = useContext(UserContext); // UserContext から userId を取得
    const [isMatched, setIsMatched] = useState(false);
    const [players, setPlayers] = useState([cookieUserId]);
    const [isMatchingProcess, setIsMatchingProcess] = useState(false);
    const [userId, setUserId] = useState(null);
    const [opponentId, setOpponentId] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, room } = location.state || {};

     // カスタムフックを使用
     const timeElapsed = useAutoLeaveRoom(mode, room);

     // 分と秒に変換する関数
     const formatTime = (seconds) => {
       const minutes = Math.floor(seconds / 60);
       const remainingSeconds = seconds % 60;
       const paddedMinutes = String(minutes).padStart(2, '0');
       const paddedSeconds = String(remainingSeconds).padStart(2, '0');
       return `${paddedMinutes}:${paddedSeconds}`;
     };

    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (!isMatchingProcess && !isMatched) {
                setIsMatchingProcess(true);
                try {
                    const serverUrl = process.env.REACT_APP_SERVER_URL;

                    // マッチング状態を確認
                    const checkResponse = await fetch(`${serverUrl}/vs-player/check-matching?room=${room}`, {
                        method: 'GET',
                        credentials: 'include'
                    });

                    if (!checkResponse.ok) {
                        throw new Error('サーバーからのレスポンスが正常ではありません。');
                    }

                    const checkData = await checkResponse.json();
                    console.log('Received check-matching data:', checkData);

                    if (checkData.matched) {
                        // マッチングが完了している場合、詳細情報を取得
                        const matchResponse = await fetch(`${serverUrl}/vs-player/match?room=${room}`, {
                            method: 'POST',
                            credentials: 'include'
                        });

                        if (!matchResponse.ok) {
                            throw new Error('サーバーからのレスポンスが正常ではありません。');
                        }

                        const matchData = await matchResponse.json();
                        console.log('Received match data:', matchData);

                        // yourId と opponentId を players 配列に追加
                        setPlayers([matchData.yourId, matchData.opponentId]);
                        setUserId(matchData.yourId);
                        setOpponentId(matchData.opponentId);
                        setIsMatched(true);
                        setIsMatchingProcess(false);
                        clearInterval(intervalId);
                    } else {
                        setIsMatchingProcess(false);
                    }
                } catch (error) {
                    setIsMatchingProcess(false);
                    console.error('エラー発生:', error);
                }
            }
        }, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, [room, navigate, mode, isMatchingProcess, isMatched]);

    useEffect(() => {
        if (isMatched) {
            navigate('/game', { state: { room, userId, opponentId, mode, isMatched: true }});
        }
    }, [isMatched, navigate, userId, room, opponentId, mode]);

    const handleExit = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/vs-player/leave-room`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ room })
          });
      
          if (!response.ok) {
            throw new Error('Failed to leave the room');
          }
      
          const data = await response.text();
          console.log(data); // ログ出力を追加
          navigate('/waiting', { state: { room } });
        } catch (error) {
          console.error('Error leaving the room:', error);
        }
    };
      

    return (
        <div className='App-header'>
             <ul className="background">
                {Array.from({ length: 25 }).map((_, index) => (
                    <li key={index}></li>
                ))}
            </ul>
            <div>
                <h2>{room}</h2> {/* 部屋名を表示 */}
            </div>
            <div>
                {players && players.length > 0 ? (
                    players.map((player, index) => (
                        <p key={index}>ID: {player.slice(-5)}</p>
                    ))
                ) : (
                    <p>プレイヤーがいません</p>
                )} 
            </div>
            <div className="rainbow-border">
                <button 
                    onClick={handleExit}
                    className="rainbow-button vs-player"  // クラスを追加
                    style={{ fontSize: '18px' }}
                >
                    退出する
                </button>
            </div>
            {mode === 'vsPlayer' && (
                <p style={{ fontSize: '14px' }}>{formatTime(timeElapsed)}</p>
            )}
            <p style={{ fontSize: '12px' }}>User ID: {cookieUserId}</p>
        </div>
    );
}

export default MatchPage;