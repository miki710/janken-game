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
    
    const { user = {}, computer ={} } = location.state || {};
    const initialPoint = location.state && location.state.user ? location.state.user.point : 0;
    const [point, setPoint] = useState(initialPoint);
    console.log('Received user data:', location.state.user);
    console.log('Received computer data:', location.state.computer);
    console.log("受け取ったポイント:", initialPoint);

    // user オブジェクトから job プロパティを取り出し、存在しない場合はデフォルト値として空文字列 '' を設定
    const { job = '' } = user;
    const [userHand, setUserHand] = useState(user ? user.hand : '');
    const [userJob, setUserJob] = useState(job);
    const [computerHand, setComputerHand] = useState(computer ? computer.hand : '');
    const [computerJob, setComputerJob] = useState(computer ? computer.job : '');
    const [userImageIndex, setUserImageIndex] = useState(user && user.index !== null ? user.index : 0);
    const [computerImageIndex, setComputerImageIndex] = useState(computer && computer.index !== null ? computer.index : 0);
    const [userInfo, setUserInfo] = useState(null);

    const [result, setResult] = useState('');

    useEffect(() => {
      console.log("受け取ったユーザーポイント:", user.point);
    }, []);

  // じゃんけんの結果を計算し、ポイントを更新するための useEffect
  useEffect(() => {
    console.log("userHand:", userHand, "computerHand:", computerHand); // これらの値をログに出力
    if (userHand && computerHand) {
      const gameResult = judgeJanken(userHand, computerHand);
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
  }, [userHand, computerHand,]); // userHand と computerHand が変更されたときに実行

  const judgeJanken = (userHand, computerHand) => {
    if (userHand === computerHand) {
      playSound('draw');
      return '引き分け';
    } else if (
      (userHand === 'Rock' && computerHand === 'Scissor') ||
      (userHand === 'Scissor' && computerHand === 'Paper') ||
      (userHand === 'Paper' && computerHand === 'Rock')
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
    setComputerHand('');
    setResult('');
    navigate('/', { state: { point }}); // ポイントを渡す
  };


  return (
    <div className='App-header'>
        <p>結果: {result}</p> 
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
                <p>Computer:</p>   
                {computerHand !== '' && (
                <>
                    <p>{getHandEmoji(computerHand)}{computerJob}</p>
                    <img src={images[computerHand][computerImageIndex]} alt={computerHand} style={{ width: '150px' }} />
                </>
            )}
            </div>
        </div>
        <button onClick={resetGame}>もう一度勝負する</button>
    </div>
    )
}

export default ImageDisplayPage;