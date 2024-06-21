import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'; // useNavigateをインポート
import { playSound, getHandEmoji } from './utils.js';
import { images } from './ImageSelectPage.js';
import './App.css';

function ImageDisplayPage() {
    const navigate = useNavigate(); // useNavigateフックを使用
    const location = useLocation();
    console.log('Location state:', location.state);
    
    const { user = {}, opponent ={}, mode, result: initialResult } = location.state || {};
    const [gameResult, setGameResult] = useState(initialResult); // 勝敗結果を状態として保存

    const initialPoint = location.state && location.state.user ? location.state.user.point : 0;
    const [point, setPoint] = useState(initialPoint);
    console.log('Received user data:', location.state.user);
    console.log('Received computer data:', location.state.opponent);
    console.log("受け取ったポイント:", initialPoint);

    // user オブジェクトから job プロパティを取り出し、存在しない場合はデフォルト値として空文字列 '' を設定
    const { job = '' } = user;
    const [userHand, setUserHand] = useState(user ? user.hand : '');
    const [userJob, setUserJob] = useState(job);
    const [opponentHand, setOpponentHand] = useState(opponent ? opponent.hand : '');
    const [opponentJob, setOpponetJob] = useState(opponent ? opponent.job : '');
    const [userImageIndex, setUserImageIndex] = useState(user && user.index !== null ? user.index : 0);
    const [opponentImageIndex, setOpponentImageIndex] = useState(opponent && opponent.index !== null ? opponent.index : 0);
    const [userInfo, setUserInfo] = useState(null);

    const [result, setResult] = useState('');

    useEffect(() => {
      console.log('Received opponentHand:', opponentHand);
      console.log('Received opponentImageIndex:', opponentImageIndex);
      console.log('Image path:', images[opponentHand][opponentImageIndex]);
    }, []);


  // じゃんけんの結果を計算し、ポイントを更新するための useEffect
  useEffect(() => {
    if (mode === 'vsComputer') { // PC戦の場合のみじゃんけんロジックを実行
      if (userHand && opponentHand) {
        const gameResult = judgeJanken(userHand, opponentHand);
        setResult(gameResult);
        if (gameResult === '勝ち') {
          setPoint(prevPoint => {
            console.log("現在のポイント:", prevPoint); // 加算前のポイントをログに出力
            const newPoint = prevPoint + 10;
            console.log("新しいポイント:", newPoint); // 加算後のポイントをログに出力
            return newPoint;
          });
        }
      }
    }
  }, []); // userHand と computerHand が変更されたときに実行

  const judgeJanken = (userHand, opponentHand) => {
    if (userHand === opponentHand) {
      playSound('draw');
      return '引き分け';
    } else if (
      (userHand === 'Rock' && opponentHand === 'Scissor') ||
      (userHand === 'Scissor' && opponentHand === 'Paper') ||
      (userHand === 'Paper' && opponentHand === 'Rock')
    ) {
      playSound('win');  // 勝ったときに音を再生
      return '勝ち';
    } else {
      playSound('lose');
      return '負け';
    }
  };

  const resetGame = () => {
    setUserHand('');
    setOpponentHand('');
    setResult('');
    navigate('/', { state: { point }}); // ポイントを渡す
  };


  return (
    <div className='App-header'>
         {mode === 'vsComputer' ? (
                <p>結果 (PC戦): {result}</p>  // PC戦の結果を表示
            ) : (
                <p>結果 (ユーザー戦): {initialResult}</p>  // ユーザー戦の結果を表示
          )}
        <p>ポイント: {point}</p>  
        <div className='hand-display'>
            <div className="hand-container">
                <p>You:</p>
                {userHand !== '' && (
                <>
                    <p>{getHandEmoji(userHand)}{userJob}</p>
                    <img src={images[userHand][userImageIndex]} alt={userHand} style={{ width: '150px' }} />
                </>
            )}
            </div>
            <div className="hand-container">
                <p>Opponent:</p>   
                {opponentHand !== '' && (
                <>
                    <p>{getHandEmoji(opponentHand)}{opponentJob}</p>
                    <img src={images[opponentHand][opponentImageIndex]} alt={opponentHand} style={{ width: '150px' }} />
                </>
            )}
            </div>
        </div>
        <button onClick={resetGame}>もう一度勝負する</button>
    </div>
    )
}

// React.memoでラップする
const MemoizedMyComponent = React.memo(ImageDisplayPage);

export default MemoizedMyComponent;