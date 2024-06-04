import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


function WaitingRoomPage() {
    const navigate = useNavigate();
    const [isMatched, setIsMatched] = useState(false);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            try {
                const serverUrl = process.env.REACT_APP_SERVER_URL;
                console.log(process.env.REACT_APP_SERVER_URL); 
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
    
                if (data.success) {
                    setIsMatched(true);
                    clearInterval(intervalId);
                    navigate('/game', { state: { mode: 'vsPlayer'}}); // マッチング成功時にゲームページへ遷移
                }

            } catch (error) {
                console.error('マッチング状態の確認中にエラーが発生しました:', error);
            }
        }, 3000); // 3秒ごとにサーバーに問い合わせ

        return () => {
            clearInterval(intervalId); // コンポーネントのアンマウント時にポーリングを停止
        };
    }, [navigate]);

    return (
        <div>
            <h1>他のプレイヤーを待っています...</h1>
            {isMatched && <p>マッチングが見つかりました！ゲームに移動します。</p>}
        </div>
    );
}

export default WaitingRoomPage;