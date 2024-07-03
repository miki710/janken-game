import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import { playSound } from './utils.js';
import { UserContext } from './UserContext.js';
import Cookies from 'js-cookie'

function ModeSelectPage() {
    const navigate = useNavigate();
    const { cookieUserId } = useContext(UserContext);
    const savedPoint = Cookies.get('point') || 0; // クッキーからポイントを取得

    const handleModeSelect = (mode) => {
        // クリック音を再生
        playSound('click');

        if (mode === 'vsPlayer') {
            navigate('/waiting');
        } else {
            navigate('/game', { state: { mode } });
        }
    };

    return (
        <div className='App-header'>
            <h2>じゃんけんゲーム</h2>
            <button onClick={() => handleModeSelect('vsPlayer')}>他のプレイヤーと対戦</button>
            <button onClick={() => handleModeSelect('vsComputer')}>PCと対戦</button>
            <p>User ID: {cookieUserId}</p>
            <p>ポイント: {savedPoint}</p>
        </div>
    );
}

export default ModeSelectPage;