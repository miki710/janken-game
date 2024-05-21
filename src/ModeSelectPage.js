import React from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function ModeSelectPage() {
    const navigate = useNavigate();

    const handleModeSelect = (mode) => {
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
        </div>
    );
}

export default ModeSelectPage;