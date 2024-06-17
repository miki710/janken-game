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

    const [userHand, setUserHand] = useState('');
    const [userJob, setUserJob] = useState('');
    const [userImageIndex, setUserImageIndex] = useState(0);
    const [opponentHand, setOpponentHand] = useState('');
    const [opponentImageIndex, setOpponentImageIndex] = useState(null);
    const [opponentJob, setOpponentJob] = useState('');
    // 状態の初期化
    const [userInfo, setUserInfo] = useState(null);
    const [opponentInfo, setOpponentInfo] = useState(null);

    const [userHandSelected, setUserHandSelected] = useState(false); //他のプレイヤーと対戦する場合に使用


    useEffect(() => {
        console.log('Updated userInfo:', userInfo);  // userInfoが更新された後の値を確認
        if (userInfo) {
          setUserJob(userInfo.job);
        }
      }, [userInfo]); 

    const handleChoice = async (hand, index) => { 
        console.log("isMatched:", isMatched, "mode:", mode);  // 状態をログに出力

        playSound('click');  // 選択時に音を再生

        try {
            if (mode === 'vsPlayer') {
                // ユーザー同士の対戦処理
                setUserHand(hand);
                setUserImageIndex(index);
                setUserHandSelected(true);
                
                // ユーザーの仕事を設定
                const userFileName = images[hand][index];
                const newUserInfo = await parseFilename(userFileName, attributeMap);
                console.log('newUserInfo:', newUserInfo);  // newUserInfoの内容を確認
                setUserInfo(newUserInfo);
            
                const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/play-match`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify({ 
                        userId: userId, 
                        hand: hand,
                        index: index,
                        info: newUserInfo,  // userInfoをサーバーに送信
                        opponentId: opponentId, // 対戦相手のID
                        matchId: matchId // マッチID
                     }),
                });
                const data = await response.json();
                console.log('Received data:', data);
                if (data.result) {
                    console.log('Match result:', data.result);
                    // ここで勝敗結果を表示する処理を追加
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
                                index: data.opponentImageIndex 
                            },
                            result: data.result
                        }
                    });
                } else {
                    console.error('No match result received');
                }
            } else if (mode === 'vsComputer') {
                // コンピューターとの対戦処理
                setUserHand(hand);
                setUserImageIndex(index); // 選択された画像のインデックスを保存
                setUserHandSelected(true); // ユーザーが手を選択したことを示す
  
                // ユーザーの仕事を設定
                const userFileName = images[hand][index];
                const newUserInfo = await parseFilename(userFileName, attributeMap);
                console.log('newUserInfo:', newUserInfo);  // newUserInfoの内容を確認
                setUserInfo(newUserInfo);
            
                const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/play`, {
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
                    const resultResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/result/${data.resultId}`);
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
                    
                    if (resultData && resultData.opponent && resultData.opponent.info) {
                        setOpponentInfo(resultData.opponent.info);
                        setTimeout(() => {
                            navigate('/display', {
                                state: {
                                    user: {
                                        hand: userHand,
                                        job: userInfo ? userInfo.job : '未定義', // userInfoがnullでなければjobを使用、そうでなければ'未定義'を設定
                                        index: userImageIndex,
                                        point: currentPoint
                                    },
                                    opponent: {
                                        hand: resultData.opponent.hand,
                                        job: resultData.opponent.info.job,
                                        index: resultData.opponent.index
                                    }
                                }
                            });
                        }, 3000); // 3000ミリ秒の遅延後にナビゲーションを実行
                    }
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
        }}
    }, [userInfo, opponentInfo, opponentHand, opponentImageIndex]);  // 依存関係に computerHand と computerImageIndex を追加

      
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