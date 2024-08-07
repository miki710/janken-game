import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import React, { useState, useEffect, useContext } from 'react';
import { parseFilename, playSound, getHandEmoji } from './utils.js';  // functionName を utils.js からインポート
import { attributeMap } from './attribute.js';
import { UserContext } from './UserContext.js';
import useAutoLeaveRoom from './useAutoLeaveRoom.js'; // カスタムフックをインポート
import Cookies from 'js-cookie'


export const images = {
    'Rock': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Rock1.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock2.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock3.webp`],
    'Scissor': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor4.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor5.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor6.webp`],
    'Paper': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Paper7.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper8.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper9.webp`]
};


function ImageSelectPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { room, userId, opponentId, mode, isMatched } = location.state || {}; // stateがnullの場合に備えてデフォルト値を設定

    const { point = 0 } = location.state || {};
    const [currentPoint, setCurrentPoint] = useState(point); // 受け取ったポイントを状態として保持
    const [isPointUpdated, setIsPointUpdated] = useState(false);  // ポイントが更新されたかどうかを追跡する状態

    const [userHand, setUserHand] = useState('');
    const [userImageIndex, setUserImageIndex] = useState(0);
    const [opponentHand, setOpponentHand] = useState('');
    const [opponentImageIndex, setOpponentImageIndex] = useState(0);
    const [userInfo, setUserInfo] = useState({});
    const [opponentInfo, setOpponentInfo] = useState(null);

    const savedPoint = Cookies.get('point') || 0; // クッキーからポイントを取得
    const { cookieUserId } = useContext(UserContext);

    // カスタムフックを使用
    const timeElapsed = useAutoLeaveRoom(mode, room);

    // 分と秒に変換する関数
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const paddedMinutes = String(minutes).padStart(2, '0');
      const paddedSeconds = String(remainingSeconds).padStart(2, '0');
      return `${paddedMinutes}:${paddedSeconds}`;
    };

    const checkMatchReady = async (room) => {
         // userInfoがnullまたはundefinedでないことを確認
        if (!userInfo && !userInfo.job && !opponentInfo && !opponentInfo.job) {
            console.error('userInfoが未定義、またはopponentInfoが未定義、またはjobプロパティが存在しません。');
            return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/vs-player/check-match-ready?room=${room}`, {
                method: 'GET', // リクエストメソッドをGETに変更
                credentials: 'include' // クッキーを含める
            });
            const data = await response.json();

            if (data.ready) {
                // マッチが準備完了した場合の処理
                navigate('/display', {
                    state: {
                        user: {
                            hand: userHand,
                            job: userInfo.job,
                            index: userImageIndex,
                            point: currentPoint,
                            userId: userId
                        },
                        opponent: {
                            hand: data.opponentHand,
                            job: data.opponentInfo.job,
                            index: data.opponentIndex,
                            opponentId: opponentId
                        },
                        result: data.result,
                        mode: mode,  // location.stateから受け取ったmodeを使用
                        room: room
                    }
                });
            } else {
                console.error('Error: opponentInfo is undefined or not ready');
                // マッチがまだ準備中の場合、再度ポーリング
                setTimeout(() => checkMatchReady(room), 3000);
            }
        } catch (error) {
            console.error('Error checking match readiness:', error);
            setTimeout(() => checkMatchReady(room), 5000);
        }
    };

    // useEffectを追加してuserInfoの更新を監視
    useEffect(() => {
        console.log('Effect running: userInfo', userInfo, 'currentPoint', currentPoint);
        if (mode === 'vsPlayer' && userInfo && userInfo.job && isPointUpdated) {
            console.log('checkMatchReady is called');
            checkMatchReady(room);
            setIsPointUpdated(false);  // フラグをリセット
        }
    }, [userInfo, isPointUpdated]);  

    useEffect(() => {
        console.log('userInfo changed:', userInfo);
    }, [userInfo]);
    
    useEffect(() => {
        console.log('isPointUpdated changed:', isPointUpdated);
    }, [isPointUpdated]);
    
    const handleChoice = async (hand, index) => { 
        console.log("isMatched:", isMatched, "mode:", mode);  // 状態をログに出力
        playSound('click');  // 選択時に音を再生

        try {
            if (mode === 'vsPlayer') {
                setUserHand(hand);
                setUserImageIndex(index);
                
                // ユーザーの仕事を設定
                const userFileName = images[hand][index];
                const newUserInfo = await parseFilename(userFileName, attributeMap);        
                setUserInfo(newUserInfo);
                
                if (newUserInfo && newUserInfo.job) {
                    const intervalId = setInterval(async () => {
                        console.log("Sending to server:", { userId, hand, index, newUserInfo, opponentId, room, point });
                        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/vs-player/play-match`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json'},
                            credentials: 'include',
                            body: JSON.stringify({ 
                                userId: userId, 
                                hand: hand,
                                index: index,  // 選択した画像のインデックス
                                info: newUserInfo,  // ユーザー情報
                                opponentId: opponentId,
                                room: room, // マッチID
                                point: currentPoint
                            }),
                        });
                        const data = await response.json();
                        console.log("Received from server:", data);
                        if (data && data.results) {
                            const userResult = data.results.find(result => result.userId === userId);
                            if (userResult && userResult.points !== undefined) {
                                setCurrentPoint(userResult.points); // サーバーから受け取った新しいポイントで更新
                                setIsPointUpdated(true);  // ポイントが更新されたことを示すフラグを設定
                                clearInterval(intervalId); // ポーリングを停止
                            }
                        }
                    }, 3000); // 3秒ごとにリクエストを送信
                }
                

            } else if (mode === 'vsComputer') {
                // コンピューターとの対戦処理
                setUserHand(hand);
                setUserImageIndex(index); // 選択された画像のインデックスを保存
  
                // ユーザーの仕事を設定
                const userFileName = images[hand][index];
                const newUserInfo = await parseFilename(userFileName, attributeMap);
                console.log('newUserInfo:', newUserInfo);  // newUserInfoの内容を確認
                setUserInfo(newUserInfo);
            
                const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/vs-computer/play`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json'},
                    credentials: 'include', // サーバー側で `credentials: true` を設定している場合
                    body: JSON.stringify({ hand: hand, index: index, mode: mode }),
                });
                const data = await response.json();
                console.log('Received data:', data);
                if (data && data.opponent) {
                    console.log('Computer data:', data.opponent);
                    setOpponentHand(data.opponent.hand);
                    setOpponentImageIndex(data.opponent.index);
                    setOpponentInfo(data.opponent.info);
            }
            } else { 
                console.error('No valid mode selected');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        if (mode === 'vsComputer') {
            if (userInfo && opponentInfo) {
                console.log('Updated userInfo:', userInfo);
                console.log('Updated computerInfo:', opponentInfo);
                navigate('/display', {
                    state: { 
                        user: { 
                            hand: userHand, 
                            job: userInfo.job,
                            index: userImageIndex, 
                            point: currentPoint 
                        },
                        opponent: {
                            hand: opponentHand, 
                            job: opponentInfo.job,
                            index: opponentImageIndex 
                        },
                        mode: mode  // ここで mode を渡す
                    }
                });
            }
        }
    }, [userInfo, opponentInfo, opponentHand, opponentImageIndex]);  

    // handに基づいてattributeMapのキーを計算する関数
    const getAttributeKey = (hand, index) => {
        switch (hand) {
            case 'Rock':
                return index + 1;
            case 'Scissor':
                return index + 4;
            case 'Paper':
                return index + 7;
            default:
                return null;
        }
    };

     // 対戦相手の状態を確認する関数を追加
     useEffect(() => {
        if (mode === 'vsPlayer') {
        const checkOpponentStatus = async () => {
            console.log('Checking opponent status...'); // デバッグ用ログ
            try {
                const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/vs-player/check-opponent-status?room=${room}`, {
                    method: 'GET',
                    credentials: 'include'
                });

                console.log('Response status:', response.status); // デバッグ用ログ

                if (!response.ok) {
                    throw new Error('Failed to check opponent status');
                }

                const data = await response.json();
                console.log('Opponent status data:', data); // デバッグ用ログ
                if (data.opponentLeft) {
                    alert('あなたはたった一人部屋に取り残されました');
                    // 部屋からユーザーを削除するリクエストを送信
                    await fetch(`${process.env.REACT_APP_SERVER_URL}/vs-player/leave-room`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ room })
                    });
                    navigate('/'); // 対戦相手が退出した場合、モード選択画面に戻る
                }
            } catch (error) {
                console.error('Error checking opponent status:', error);
            }
        };

        const intervalId = setInterval(checkOpponentStatus, 5000); // 5秒ごとに対戦相手の状態を確認

        return () => clearInterval(intervalId);
        }
    }, [room, userId, navigate]);
      
  return (
    <>
    <ul className="background">
        {Array.from({ length: 25 }).map((_, index) => (
            <li key={index}></li>
        ))}
    </ul>
    <div className="App">
        <header className="App-header">
            <ul className="background">
                {Array.from({ length: 25 }).map((_, index) => (
                    <li key={index}></li>
                ))}
            </ul>
            <h3>{mode === 'vsPlayer' ? `ユーザー戦 ${room}` : 'PC戦'}</h3>          
                {isMatched || mode !== 'vsPlayer' ? (
                    Object.entries(images).map(([hand, imagePaths]) => (
                    <div 
                        key={hand} 
                        style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            marginBottom: '10px',
                            marginTop: hand === 'Rock' ? '20px' : '0'  // グーの画像の上に余白を追加
                        }}
                    >
                        {imagePaths.map((path, index) => (
                            <div key={index} style={{ textAlign: 'center', margin: '0 5px' }}>
                            <img
                                src={path}
                                alt={hand}
                                className={`image ${userHand === hand && userImageIndex === index ? 'selected' : ''}`}
                                style={{ width: '100px', margin: '5px 5px 0px 5px' }}  // 下のマージンを2pxに設定
                                onClick={() => handleChoice(hand, index)}
                            />
                            <p style={{ fontSize: '12px', marginTop: '0px' }}>{getHandEmoji(hand)} {attributeMap[getAttributeKey(hand, index)].job}</p>
                            </div>
                        ))}
                    </div>
                ))
                ) : null}   
                <p>ポイント: {savedPoint}</p>
                {mode === 'vsComputer' && (
                    <div className="rainbow-border">
                        <button 
                            onClick={() => {
                                playSound('click'); 
                                navigate('/');
                            }} 
                            className="rainbow-button vs-player" 
                            style={{ fontSize: '18px' }}
                        >
                            Top画面へ戻る
                        </button>
                    </div>
                )}
                {mode === 'vsPlayer' && (
                    <p style={{ fontSize: '14px' }}>{formatTime(timeElapsed)}</p>
                )}
                <p style={{ fontSize: '12px' }}>User ID: {cookieUserId}</p>
                {mode === 'vsPlayer' && <p style={{ fontSize: '12px' }}>対戦相手ID: {opponentId}</p>}
            </header>
        </div>
        </>
    );
}

export default ImageSelectPage;