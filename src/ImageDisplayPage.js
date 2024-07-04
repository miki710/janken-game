import React, { useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'; // useNavigateをインポート
import { playSound, getHandEmoji } from './utils.js';
import { images } from './ImageSelectPage.js';
import { UserContext } from './UserContext.js';
import './App.css';

function ImageDisplayPage() {
    const navigate = useNavigate(); // useNavigateフックを使用
    const location = useLocation();
    console.log('Location state:', location.state);
    
    const { user = {}, opponent ={}, mode, result: initialResult } = location.state || {};

    const initialPoint = location.state && location.state.user ? location.state.user.point : 0;
    const [point, setPoint] = useState(initialPoint);
    const [prevPoint, setPrevPoint] = useState(initialPoint); // 追加
 
    // user オブジェクトから job プロパティを取り出し、存在しない場合はデフォルト値として空文字列 '' を設定
    const { job = '' } = user;
    const [userJob] = useState(job); // setUserJobを削除
    const [userHand, setUserHand] = useState(user ? user.hand : '');
    const [opponentHand, setOpponentHand] = useState(opponent ? opponent.hand : '');
    const [opponentJob] = useState(opponent ? opponent.job : ''); // setOpponentJobを削除
    const [userImageIndex] = useState(user && user.index !== null ? user.index : 0); // setUserImageIndexを削除
    const [opponentImageIndex] = useState(opponent && opponent.index !== null ? opponent.index : 0); // setOpponentImageIndexを削除
    const [result, setResult] = useState('');
    
    const [showResult, setShowResult] = useState(false);
    const [showPoint, setShowPoint] = useState(false); // 追加

    const { cookieUserId } = useContext(UserContext);

    useEffect(() => {
      console.log('useEffect for initial point and mode');
      // クッキーから前回のポイントを読み取る
      const savedPoint = Cookies.get('point') || '0'; // クッキーからポイントを取得、存在しない場合は'0'
      console.log('savedPoint:', savedPoint); // savedPointの値をログに出力
      setPrevPoint(savedPoint); // 初期化時に設定
      const savedPointInt = parseInt(savedPoint, 10);

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
    }, [mode, initialPoint]);

    // ポイントが更新されるたびにクッキーに保存
    useEffect(() => {
      console.log('useEffect for point update');
      Cookies.set('point', point, { expires: 1 }); // クッキーの有効期限を1日に設定
    }, [point]);

  // じゃんけんの結果を計算し、ポイントを更新するための useEffect
  useEffect(() => {
    console.log('useEffect for janken result');
    if (mode === 'vsComputer') { // PC戦の場合のみじゃんけんロジックを実行
      if (userHand && opponentHand) {
        const gameResult = judgeJanken(userHand, opponentHand);
        setResult(gameResult);
        if (gameResult === 'Win') {
          setPoint(prevPoint => {
            console.log("現在のポイント:", prevPoint); // 加算前のポイントをログに出力
            setPrevPoint(prevPoint); // 追加
            const newPoint = prevPoint + 10;
            console.log("新しいポイント:", newPoint); // 加算後のポイントをログに出力
            return Math.max(newPoint, 0); // ポイントがマイナスにならないように調整
          });
        } else if (gameResult === 'Lose') {
          setPoint(prevPoint => {
            console.log("現在のポイント:", prevPoint); // 減算前のポイントをログに出力
            setPrevPoint(prevPoint); // 追加
            const newPoint = prevPoint - 10;
            console.log("新しいポイント:", newPoint); // 減算後のポイントをログに出力
            return Math.max(newPoint, 0); // ポイントがマイナスにならないように調整
          });
        }
      }
    }
  }, []); // userHand と computerHand が変更されたときに実行

  useEffect(() => {
    const timer = setTimeout(() => {
        setShowResult(true);
        setTimeout(() => setShowPoint(true), 200); // 0.2秒後にポイントを表示
    }, 500); // 0.5秒後に表示

    return () => clearTimeout(timer); // クリーンアップ
  }, []);

  const judgeJanken = (userHand, opponentHand) => {
    if (userHand === opponentHand) {
      playSound('draw');
      return 'Draw';
    } else if (
      (userHand === 'Rock' && opponentHand === 'Scissor') ||
      (userHand === 'Scissor' && opponentHand === 'Paper') ||
      (userHand === 'Paper' && opponentHand === 'Rock')
    ) {
      playSound('win');  // 勝ったときに音を再生
      return 'Win';
    } else {
      playSound('lose');
      return 'Lose';
    }
  };

  const resetGame = () => {
    playSound('click');
    setUserHand('');
    setOpponentHand('');
    setResult('');
    navigate('/'); // ポイントを渡さずに遷移
  };

  const playAgain = () => {
    playSound('click');
    navigate('/game', { state: { mode }}); // /gameに遷移
  };

  return (
    <div className='App-header'>
        <h2>{mode === 'vsComputer' ? 'PC戦' : 'ユーザー戦'}</h2>

        <div className='hand-display'>
            <div className="hand-container">
                <p>You:</p>
                {userHand !== '' && (
                <>
                    <img src={images[userHand][userImageIndex]} alt={userHand} style={{ width: '150px' }} />
                    <p>{getHandEmoji(userHand)}{userJob}</p>
                </>
            )}
            </div>
            <div className="hand-container">
                <p>Opponent:</p>   
                {opponentHand !== '' && (
                <>
                    <img src={images[opponentHand][opponentImageIndex]} alt={opponentHand} style={{ width: '150px' }} />
                    <p>{getHandEmoji(opponentHand)}{opponentJob}</p>
                </>
            )}
            </div>
        </div>
        {mode === 'vsComputer' ? (
            <>
                {showResult && (
                    <p style={{ fontSize: '24px' }} className="bounce">{result}</p>
                )}
                <button 
                    onClick={playAgain}
                    style={{ fontSize: '18px' }}
                >
                    もう一度勝負する
                </button>
            </>
        ) : (
            <>
                {showResult && (
                    <p style={{ fontSize: '24px' }} className="bounce">{initialResult}</p>
                )}
            </>
        )}
        {showPoint && (
                <p className="flydown">ポイント: {prevPoint} ➡ {point}</p>
        )}    
        <button 
          onClick={resetGame}
          style={{ fontSize: '18px' }}
        >
          Top画面へ戻る
        </button>
        <p>User ID: {cookieUserId}</p>
    </div>
    )
}

// React.memoでラップする
const MemoizedMyComponent = React.memo(ImageDisplayPage);

export default MemoizedMyComponent;