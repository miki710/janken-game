import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


function WaitingRoomPage() {
    const navigate = useNavigate();
    const [isMatched, setIsMatched] = useState(false);
    const [isMatchingProcess, setIsMatchingProcess] = useState(false);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (!isMatchingProcess) { // マッチングプロセス中でない場合のみリクエストを送信
            setIsMatchingProcess(true); // マッチングプロセスを開始
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
                console.log('Received data:', data); // デバッグ情報をログに出力

                if (data.success && data.isMatched) {
                    setIsMatched(true);
                    setIsMatchingProcess(false); // マッチングプロセスを終了
                    clearInterval(intervalId);
                    navigate('/game', { state: { mode: 'vsPlayer', isMatched: true }}); // マッチング成功時にゲームページへ遷移
                } else if (!data.success && data.message === '既にマッチングプロセス中です') {
                    console.log('isMatchingProcess:', isMatchingProcess); // ステートの値をログ出力
                    // ポーリングを続ける
                } else {
                    setIsMatchingProcess(false);
                    console.log('マッチングが完了していません');
                }

            } catch (error) {
                setIsMatchingProcess(false); // エラーが発生した場合もプロセスを終了
                console.error('マッチング状態の確認中にエラーが発生しました:', error);
            }
        }
        }, 3000); // 3秒ごとにサーバーに問い合わせ

        return () => {
            clearInterval(intervalId); // コンポーネントのアンマウント時にポーリングを停止
        };
    }, [navigate, isMatchingProcess]); // isMatchingProcess を依存配列に追加

    return (
        <div>
            <h1>他のプレイヤーを待っています...</h1>
            {isMatched && <p>マッチングが見つかりました！ゲームに移動します。</p>}
        </div>
    );
}

export default WaitingRoomPage;