import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
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

    const initialPoint = location.state && location.state.user ? location.state.user.point : 0;
    const [point, setPoint] = useState(initialPoint);
 
    // user オブジェクトから job プロパティを取り出し、存在しない場合はデフォルト値として空文字列 '' を設定
    const { job = '' } = user;
    const [userJob] = useState(job); // setUserJobを削除
    const [userHand, setUserHand] = useState(user ? user.hand : '');
    const [opponentHand, setOpponentHand] = useState(opponent ? opponent.hand : '');
    const [opponentJob] = useState(opponent ? opponent.job : ''); // setOpponentJobを削除
    const [userImageIndex] = useState(user && user.index !== null ? user.index : 0); // setUserImageIndexを削除
    const [opponentImageIndex] = useState(opponent && opponent.index !== null ? opponent.index : 0); // setOpponentImageIndexを削除

    const [result, setResult] = useState('');

    useEffect(() => {
      // クッキーから前回のポイントを読み取る
      const savedPoint = Cookies.get('point');
      const savedPointInt = savedPoint ? parseInt(savedPoint, 10) : 0;

      if (mode === 'vsComputer') {
        // vsComputerモードの場合、ImageSelectPageで計算されたポイントを加算
        const totalPoint = savedPointInt + point;
        setPoint(totalPoint);
      } else if (mode === 'vsPlayer') {
        // vsPlayerモードの場合、ImageSelectPageから渡されるポイントをそのまま使用
        const totalPoint = savedPointInt + initialPoint;
        // ポイントがマイナスにならないように調整
        const adjustedPoint = Math.max(totalPoint, 0);
        setPoint(adjustedPoint);
      }

      // 新しい合計ポイントをクッキーに保存
      Cookies.set('point', point, { expires: 1 }); // クッキーの有効期限を1日に設定
    }, [point]);

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