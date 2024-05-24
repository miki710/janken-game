import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext'; // SocketContextからuseSocketをインポート


function WaitingRoomPage() {
    const socket = useSocket(); // SocketContextからsocketインスタンスを取得
    const navigate = useNavigate();
    useEffect(() => {
        // サーバーにプレイヤーの待機を通知
        socket.emit('waitingForPlayer');

        // マッチングが成功したら、ゲーム画面に遷移する
        const handleMatchFound = () => {
            navigate('/game');
        };
        socket.on('matchFound', handleMatchFound);

        // コンポーネントのアンマウント時にイベントリスナーを削除
        return () => {
            socket.off('matchFound', handleMatchFound);
        };
    }, [socket, navigate]); // 依存配列にsocketとnavigateを追加

    return (
        <div>
            <h1>他のプレイヤーを待っています...</h1>
        </div>
    );
}

export default WaitingRoomPage;