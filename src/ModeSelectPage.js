import React from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import { playSound } from './utils.js';
import Cookies from 'js-cookie';

function ModeSelectPage() {
    const navigate = useNavigate();
    const [cookieUserId, setCookieUserId] = useState('Unknown User');
    const [savedPoint, setSavedPoint] = useState(0);

    useEffect(() => {
        const userId = Cookies.get('userId');
        const point = Cookies.get('point') || 0;
        console.log('User ID from cookie:', userId); // デバッグ用ログ
        console.log('Point from cookie:', point); // デバッグ用ログ
        if (userId) {
            setCookieUserId(userId);
        }
        setSavedPoint(point);
    }, []);
    

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
            <p>Points: {savedPoint}</p>
        </div>
    );
}

export default ModeSelectPage;