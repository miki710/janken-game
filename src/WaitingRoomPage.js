import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


function WaitingRoomPage() {
    const navigate = useNavigate();
    const [isMatched, setIsMatched] = useState(false);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            try {
                const response = await fetch('サーバーのマッチング状態確認用URL');
                const data = await response.json();
                if (data.matchFound) {
                    setIsMatched(true);
                    clearInterval(intervalId);
                    navigate('/game');
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