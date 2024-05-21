import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { parseFilename, playSound } from './utils.js';  // functionName を utils.js からインポート
import { attributeMap } from './attribute.js';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000');

socket.on('connect_error', (error) => {
    console.error('WebSocket Connection Error:', error);
});

export const images = {
    'Rock': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Rock1.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock2.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock3.webp`],
    'Scissor': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor4.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor5.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor6.webp`],
    'Paper': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Paper7.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper8.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper9.webp`]
};


function ImageSelectPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { mode } = location.state; // モードを取得
    const [isMatched, setIsMatched] = useState(false);

    const { point = 0 } = location.state || {};
    const [currentPoint, setCurrentPoint] = useState(point); // 受け取ったポイントを状態として保持

    const [userHand, setUserHand] = useState('');
    const [userJob, setUserJob] = useState('');
    const [userImageIndex, setUserImageIndex] = useState(0);
    const [computerHand, setComputerHand] = useState('');
    const [computerImageIndex, setComputerImageIndex] = useState(null);
    const [computerJob, setComputerJob] = useState('');
    // 状態の初期化
    const [userInfo, setUserInfo] = useState(null);
    const [computerInfo, setComputerInfo] = useState(null);
    
    useEffect(() => {
        if (mode === 'vsPlayer') {
            // 対人戦の場合、マッチングの成功を待つ
            socket.on('matchFound', () => {
                console.log('マッチングが成功しました。');
                setIsMatched(true); // マッチング成功状態を設定
            });

            return () => {
                socket.off('matchFound');
            };
        }
    }, [mode]);


    useEffect(() => {
        if (userInfo) {
          setUserJob(userInfo.job);
        }
      }, [userInfo]); 

    const handleChoice = (hand, index) => { 
        if (mode === 'vsPlayer' && !isMatched) {
            console.log('まだマッチングが完了していません。');
            return;
        }

        playSound('click');  // 選択時に音を再生
        //ユーザーの手を設定
        setUserHand(hand);
        setUserImageIndex(index); // 選択された画像のインデックスを保存
  
        // ユーザーの仕事を設定
        const userFileName = images[hand][index];
        const newUserInfo = parseFilename(userFileName, attributeMap);
        setUserInfo(newUserInfo);

        if (mode === 'vsComputer') {
            // コンピュータとの対戦の場合、サーバーにユーザーの選択を送信し、結果を待つ
            socket.emit('play', { hand: hand, index: index, mode: mode });
        } else if (mode === 'vsPlayer') {
            // 対人戦の場合、サーバーにユーザーの選択を送信
            socket.emit('play', { hand: hand, index: index, mode: mode });
        }
    };

    useEffect(() => {
        // サーバーからの結果を待ち受ける
        const handleResult = (data) => {
            console.log("Received data from server:", data);

            if (!data || !data.computer || !data.computer.hand || !data.computer.index || !data.computer.info || !data.computer.info.job) {
                console.error('Data is incomplete or malformed:', data);
                return; // データが不完全な場合は処理を中断
            }

            const newComputerHand = data.computer.hand;
            const newComputerImageIndex = data.computer.index;
            const newComputerInfo = data.computer.info; // 'info'を受け取るように変更
            const newComputerJob = newComputerInfo.job; // jobを正しく参照

            setComputerHand(newComputerHand);
            setComputerImageIndex(newComputerImageIndex);
            setComputerInfo(newComputerInfo);
            setComputerJob(newComputerJob); // jobをstateに設定
            
                console.log("遷移時のポイント:", currentPoint);
                setTimeout(() => {
                    navigate('/display', {
                        state: { 
                            user: { 
                                hand: userHand, 
                                job: userInfo.job, 
                                index: userImageIndex, 
                                point: currentPoint 
                            },
                            computer: {
                                 hand: newComputerHand, 
                                 job: newComputerInfo.job, 
                                 index: newComputerImageIndex 
                            }
                        }
                    });
                }, 3000); // 3000ミリ秒の遅延
            
        };
    
        socket.on('result', handleResult);
    
        return () => {
            socket.off('result', handleResult);
        };
    }, [userHand, userInfo, currentPoint]); // 依存関係にこれらを追加    

    

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