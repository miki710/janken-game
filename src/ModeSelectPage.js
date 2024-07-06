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
            <h1>じゃんけんゲーム</h1>
            <div className="hand-display">
                <div className="hand-container">
                    <img src="/image/backImage.jpg" alt="Card Back" style={{ width: '150px' }} />
                </div>
                <div className="hand-container">
                    <img src="/image/backImage.jpg" alt="Card Back" style={{ width: '150px' }} />
                </div>
            </div>
            <div className="rainbow-border">
                <button 
                    onClick={() => handleModeSelect('vsPlayer')}
                    className="rainbow-button vs-player"  // クラスを追加
                >
                    他のプレイヤーと対戦
                </button>
            </div>
            <div className="rainbow-border">
                <button 
                    onClick={() => handleModeSelect('vsComputer')}
                    className="rainbow-button vs-computer"  // クラスを追加
                >
                    PCと対戦
                </button>
            </div>
            <p>ポイント: {savedPoint}</p>
            <p>User ID: {cookieUserId}</p>
        </div>
    );
}

export default ModeSelectPage;