import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal'; // react-modalをインポート

Modal.setAppElement('#root'); // アクセシビリティのために必要

const useAutoLeaveRoom = (mode, room, timeout = 60000) => { // デフォルトで1分
  const timerRef = useRef(null);
  const [timeElapsed, setTimeElapsed] = useState(0); // 経過時間を管理
  const navigate = useNavigate(); // useNavigateフックを使用

  const leaveRoom = async () => {
    console.log('Attempting to leave the room due to inactivity'); // デバッグ用ログ
    if (mode === 'vsPlayer' && room) {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/vs-player/leave-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room: room }),
        credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to leave the room');
        }

        console.log('Successfully left the room due to inactivity');
        navigate('/'); // 5分後にModeSelectPageに遷移
      } catch (error) {
        console.error('Error leaving the room:', error);
      }
    }
  };

  const resetTimer = () => {
    console.log('Resetting timer'); // デバッグ用ログ
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setTimeElapsed(0); // タイマーをリセット
    timerRef.current = setTimeout(leaveRoom, timeout);
  };

  useEffect(() => {
    console.log('Setting up event listeners'); // デバッグ用ログ
    const handleActivity = () => {
      resetTimer();
    };

    const countUp = () => {
      setTimeElapsed(prev => prev + 1);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('beforeunload', leaveRoom); // ページを閉じる前に退出処理を行う

    resetTimer();
    const intervalId = setInterval(countUp, 1000); // 1秒ごとにカウントアップ

    return () => {
      console.log('Cleaning up event listeners'); // デバッグ用ログ
      clearTimeout(timerRef.current);
      clearInterval(intervalId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('beforeunload', leaveRoom);
    };
  }, [mode, room, timeout]);

  useEffect(() => {
    if (timeElapsed >= 60) {
      alert('悪い子は退出させちゃうわよ💜');
      // 部屋から退出する処理を追加
      navigate('/'); // トップページに戻る
    }
  }, [timeElapsed, navigate]);

  return timeElapsed;
};

export default useAutoLeaveRoom;