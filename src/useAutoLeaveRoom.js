import { useEffect, useRef, useState } from 'react';

const useAutoLeaveRoom = (mode, room, timeout = 300000) => { // デフォルトで5分
  const timerRef = useRef(null);
  const [timeElapsed, setTimeElapsed] = useState(0); // 経過時間を管理

  const leaveRoom = () => {
    if (mode === 'vsPlayer' && room) {
      fetch(`${process.env.REACT_APP_SERVER_URL}/vs-player/leave-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room: room }),
        credentials: 'include'
      }).then(response => {
        if (!response.ok) {
          throw new Error('Failed to leave the room');
        }
        console.log('Successfully left the room due to inactivity');
      }).catch(error => {
        console.error('Error leaving the room:', error);
      });
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setTimeElapsed(0); // タイマーをリセット
    timerRef.current = setTimeout(leaveRoom, timeout);
  };

  useEffect(() => {
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
      clearTimeout(timerRef.current);
      clearInterval(intervalId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('beforeunload', leaveRoom);
    };
  }, [mode, room, timeout]);

  return timeElapsed;
};

export default useAutoLeaveRoom;