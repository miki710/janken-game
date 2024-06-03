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
        console.log('Updated userInfo:', userInfo);  // userInfoが更新された後の値を確認
        if (userInfo) {
          setUserJob(userInfo.job);
        }
      }, [userInfo]); 

    const handleChoice = async (hand, index) => { 
        if (mode === 'vsPlayer' && !isMatched) {
            console.log('まだマッチングが完了していません。');
            return;
        }

        console.log("handleChoiceがトリガーされました。", hand, index);
       // その他の処理...
        playSound('click');  // 選択時に音を再生
        //ユーザーの手を設定
        setUserHand(hand);
        setUserImageIndex(index); // 選択された画像のインデックスを保存
  
        // ユーザーの仕事を設定
        const userFileName = images[hand][index];
        const newUserInfo = await parseFilename(userFileName, attributeMap);
        console.log('newUserInfo:', newUserInfo);  // newUserInfoの内容を確認
        setUserInfo(newUserInfo);

        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                credentials: 'include', // サーバー側で `credentials: true` を設定している場合
                body: JSON.stringify({ hand: hand, index: index, mode: mode }),
            });
            const data = await response.json();
            console.log('Received data:', data);
            if (data && data.computer) {
                console.log('Computer data:', data.computer);
                setComputerHand(data.computer.hand);
                setComputerImageIndex(data.computer.index);
                setComputerInfo(data.computer.info);
            } else {
                console.error('No computer data received');
            }

            // サーバーから受け取ったIDを保存
            const resultId = data.resultId;
        
            const resultResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/result/${resultId}`);
            const resultData = await resultResponse.json();
            console.log('Game result:', resultData);
            if (!resultData || !resultData.computer || !resultData.computer.info) {
                throw new Error('Received data is incomplete or malformed');
            }
            setComputerInfo(resultData.computer.info);
            console.log('Set computerInfo:', resultData.computer.info);
        } catch (error) {
            console.error('Error during game processing:', error);
        }
    };

    useEffect(() => {
        console.log('computerHand:', computerHand);
        console.log('computerImageIndex:', computerImageIndex);
        console.log('computerInfo:', computerInfo);
        if (userInfo && computerInfo) {
            console.log('Updated userInfo:', userInfo);
            console.log('Updated computerInfo:', computerInfo);
            navigate('/display', {
                state: { 
                    user: { 
                        hand: userHand, 
                        job: userInfo.job,
                        index: userImageIndex, 
                        point: currentPoint 
                    },
                    computer: {
                        hand: computerHand, 
                        job: computerInfo.job,
                        index: computerImageIndex 
                    }
                }
            });
        }
    }, [userInfo, computerInfo, computerHand, computerImageIndex]);  // 依存関係に computerHand と computerImageIndex を追加


    useEffect(() => {
        // PC戦の場合はポーリングを行わない
        if (mode === 'vsComputer') return;

        // ユーザー戦の場合のみポーリングを開始
        if (mode === 'vsPlayer' && isMatched) {
        const intervalId = setInterval(async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/result`);
                const data = await response.json();
                if (data && data.computer) {
                    console.log("Received data from server:", data);
    
                    if (!data || !data.computer || !data.computer.hand || !data.computer.index || !data.computer.info || !data.computer.info.job) {
                        console.error('Data is incomplete or malformed:', data);
                        return; // データが不完全な場合は処理を中断
                    }
    
                    const newComputerHand = data.computer.hand;
                    const newComputerImageIndex = data.computer.index;
                    const newComputerInfo = data.computer.info;
                    const newComputerJob = newComputerInfo.job;
    
                    setComputerHand(newComputerHand);
                    setComputerImageIndex(newComputerImageIndex);
                    setComputerInfo(newComputerInfo);
                    setComputerJob(newComputerJob);
    
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
                }
            } catch (error) {
                console.error('Error fetching result:', error);
            }
        }, 3000); // 3秒ごとにサーバーから結果をチェック
    
        return () => clearInterval(intervalId); // コンポーネントのアンマウント時にポーリングを停止
    }
    }, [mode, isMatched]); // 依存関係に navigate を追加

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