import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001');

function WaitingRoomPage() {
    const navigate = useNavigate();
    useEffect(() => {
        // サーバーにプレイヤーの待機を通知
        socket.emit('waitingForPlayer');

        // マッチングが成功したら、ゲーム画面に遷移する
        socket.on('matchFound', () => {
            // 例えば、ゲーム画面への遷移
            navigate('/game');
        });

        return () => {
            socket.off('matchFound');
        };
    }, []);

    return (
        <div>
            <h1>他のプレイヤーを待っています...</h1>
        </div>
    );
}

export default WaitingRoomPage;