import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


function WaitingRoomPage() {
    const navigate = useNavigate();
    const [isMatched, setIsMatched] = useState(false);
    const [isMatchingProcess, setIsMatchingProcess] = useState(false);
    const [matchId, setMatchId] = useState(null);
    const [userId, setUserId] = useState(null);  // userIdの状態を追加
    const [opponentId, setOpponentId] = useState(null);  // opponentIdの状態を追加

    useEffect(() => {
        console.log('ポーリング開始');
        const intervalId = setInterval(async () => {
            console.log('ポーリング中...', intervalId);
            console.log('isMatchingProcess 状態:', isMatchingProcess);
            if (!isMatchingProcess && !isMatched) { // マッチングプロセス中でない場合のみリクエストを送信
                console.log('マッチングプロセスを開始します');
                setIsMatchingProcess(true); // マッチングプロセスを開始
                console.log('isMatchingProcess set to true');
                try {
                    const serverUrl = process.env.REACT_APP_SERVER_URL;
                    const gameMode = 'vsPlayer'; // ゲームモードを指定

                    const response = await fetch(`${serverUrl}/match`, {
                        method: 'POST',
                        headers: {
                        'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            mode: gameMode
                        }),
                        credentials: 'include' // クッキーを送信するために必要
                    });
               
                    if (!response.ok) {
                        throw new Error('サーバーからのレスポンスが正常ではありません。');
                    }
                    
                    const data = await response.json(); // サーバーからのレスポンスデータをJSON形式で受け取る
                    console.log('Received data:', data); // デバッグ情報をログに出力

                    if (data.success && data.isMatched) {
                        setMatchId(data.matchId);
                        setUserId(data.yourId);
                        setOpponentId(data.opponentId);
                        setIsMatched(true);                  
                        setIsMatchingProcess(false); // マッチングプロセスを終了
                        clearInterval(intervalId); // ここでの停止は適切
                    } else if (!data.success && data.message === '既にマッチングプロセス中です') {
                        console.log('エラー: 既にマッチングプロセス中です');
                    } else {
                        console.log('マッチング未完了:', data);
                        setIsMatchingProcess(false);
                        console.log('isMatchingProcess reset to false');
                    }
                            
                } catch (error) {
                    setIsMatchingProcess(false); // エラーが発生した場合もプロセスを終了
                    console.error('エラー発生:', error);
                }
            }
        }, 30000); // 3秒ごとにサーバーに問い合わせ

        console.log('intervalId:', intervalId); // intervalIdを出力

        return () => {
            console.log('ポーリング停止', intervalId);
            clearInterval(intervalId); // コンポーネントのアンマウント時にポーリングを停止
        };
    }, []); 

    useEffect(() => {
        console.log('isMatched has been updated to:', isMatched);
        if (isMatched) {
            console.log('Navigating to /game with isMatched:', isMatched);
            navigate('/game', { state: { matchId, userId, opponentId, mode: 'vsPlayer', isMatched: true }});
        }
    }, [isMatched]); // isMatched と navigate を依存配列に追加


    useEffect(() => {
        console.log('コンポーネントがマウントされました');

        return () => {
            console.log('コンポーネントがアンマウントされました');
        };
    }, []);


    return (
        <div>
            <h1>他のプレイヤーを待っています...</h1>
            {isMatched && <p>マッチングが見つかりました！ゲームに移動します。</p>}
        </div>
    );
}

export default WaitingRoomPage;