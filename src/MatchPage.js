import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './App.css';

function MatchPage() {
    const [isMatched, setIsMatched] = useState(false);
    const [players, setPlayers] = useState([]);
    const [isMatchingProcess, setIsMatchingProcess] = useState(false);
    const [userId, setUserId] = useState(null);
    const [opponentId, setOpponentId] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, room } = location.state || {};

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

                        // matchData.players が配列であることを確認
                        const playersArray = Array.isArray(matchData.players) ? matchData.players : [];

                        setPlayers([matchData.yourId, ...playersArray]);
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

    return (
        <div className='App-header'>
             <ul className="background">
                {Array.from({ length: 25 }).map((_, index) => (
                    <li key={index}></li>
                ))}
            </ul>
            {isMatched ? (
                <h1>マッチングしました！</h1>
            ) : (
                <h1>マッチングを待っています...</h1>
            )}
            <div>
                <h2>参加プレイヤー:</h2>
                <ul>
                    {players && players.length > 0 ? (
                        players.map((player, index) => (
                            <li key={index}>{player}</li>
                        ))
                    ) : (
                        <li>プレイヤーがいません</li>
                    )} 
                </ul>
            </div>
        </div>
    );
}

export default MatchPage;