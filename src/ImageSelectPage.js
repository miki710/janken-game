import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { parseFilename, playSound } from './utils.js';  // functionName を utils.js からインポート
import { attributeMap } from './attribute.js';


export const images = {
    'Rock': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Rock1.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock2.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock3.webp`],
    'Scissor': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor4.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor5.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor6.webp`],
    'Paper': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Paper7.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper8.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper9.webp`]
};


function ImageSelectPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { matchId, userId, opponentId, mode, isMatched } = location.state || {}; // stateがnullの場合に備えてデフォルト値を設定
    console.log(location.state)

    const { point = 0 } = location.state || {};
    const [currentPoint, setCurrentPoint] = useState(point); // 受け取ったポイントを状態として保持
    const [isPointUpdated, setIsPointUpdated] = useState(false);  // ポイントが更新されたかどうかを追跡する状態

    const [userHand, setUserHand] = useState('');
    const [userImageIndex, setUserImageIndex] = useState(0);
    const [opponentHand, setOpponentHand] = useState('');
    const [opponentImageIndex, setOpponentImageIndex] = useState(0);
    const [userInfo, setUserInfo] = useState({});
    const [opponentInfo, setOpponentInfo] = useState(null);


      const checkMatchReady = async (matchId) => {
         // userInfoがnullまたはundefinedでないことを確認
        if (!userInfo && !userInfo.job && !opponentInfo && !opponentInfo.job) {
            console.error('userInfoが未定義、またはopponentInfoが未定義、またはjobプロパティが存在しません。');
            return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/vs-player/check-match-ready?matchId=${matchId}`, {
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
                            point: currentPoint
                        },
                        opponent: {
                            hand: data.opponentHand,
                            job: data.opponentInfo.job,
                            index: data.opponentIndex
                        },
                        result: data.result,
                        mode: mode  // location.stateから受け取ったmodeを使用
                    }
                });
            } else {
                console.error('Error: opponentInfo is undefined or not ready');
                // マッチがまだ準備中の場合、再度ポーリング
                setTimeout(() => checkMatchReady(matchId), 3000);
            }
        } catch (error) {
            console.error('Error checking match readiness:', error);
            setTimeout(() => checkMatchReady(matchId), 5000);
        }
    };

    // useEffectを追加してuserInfoの更新を監視
    useEffect(() => {
        console.log('Effect running: userInfo', userInfo, 'currentPoint', currentPoint);
        if (mode === 'vsPlayer' && userInfo && userInfo.job && isPointUpdated) {
            checkMatchReady(matchId);
            setIsPointUpdated(false);  // フラグをリセット
        }
    }, [userInfo, isPointUpdated]);  
    
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
                        console.log("Sending to server:", { userId, hand, index, newUserInfo, opponentId, matchId, point });
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
                                matchId: matchId, // マッチID
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
                

                if (data.resultId) {
                    const resultResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/vs-computer/result/${data.resultId}`);
                    if (!resultResponse.ok) {
                        throw new Error(`HTTP error! status: ${resultResponse.status}`);
                    }

                    const resultData = await resultResponse.json();
                    console.log('Game result:', resultData);
                    if (!resultData || !resultData.opponent || !resultData.opponent.info) {
                        throw new Error('Received data is incomplete or malformed');
                    }
                    setOpponentInfo(resultData.opponent.info);
                    console.log('Set opponentInfo:', resultData.opponent.info);
                }
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

      
  return (
    <div className="App">
            <header className="App-header">
                <p>じゃんけんゲーム: {mode === 'vsPlayer' ? 'ユーザー戦' : 'PC戦'}</p>
                {isMatched || mode !== 'vsPlayer' ? (
                    Object.entries(images).map(([hand, imagePaths]) => (
                    <div key={hand}>
                        <p>{hand}</p>
                        {imagePaths.map((path, index) => (
                            <img
                                key={index}
                                src={path}
                                alt={hand}
                                className={`image ${userHand === hand && userImageIndex === index ? 'selected' : ''}`}
                                style={{ width: '100px', margin: '5px' }}
                                onClick={() => handleChoice(hand, index)}
                            />
                        ))}
                    </div>
                ))
                ) : null}
            </header>
        </div>
    );
}

export default ImageSelectPage;