import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal'; // react-modalをインポート

Modal.setAppElement('#root'); // アクセシビリティのために必要

const useAutoLeaveRoom = (mode, room, timeout = 60000) => { // デフォルトで1分
  const timerRef = useRef(null);
  const [timeElapsed, setTimeElapsed] = useState(0); // 経過時間を管理
  const [modalIsOpen, setModalIsOpen] = useState(false); // モーダルの開閉状態を管理
  const navigate = useNavigate(); // useNavigateフックを使用

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
        navigate('/'); // 5分後にModeSelectPageに遷移
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

  useEffect(() => {
    if (timeElapsed >= 60) {
      setModalIsOpen(true); // モーダルを開く
    }
  }, [timeElapsed]);

  return { 
    timeElapsed, 
    modal: (
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Inactivity Alert"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '200px', // 幅を調整
            height: '100px', // 高さを調整
            backgroundColor: 'rgba(0, 0, 0, 0)', // 背景色を完全に透明に設定
            color: 'white', // テキスト色を白に設定
            border: '2px solid white', // 白い枠線
            boxShadow: '0 0 20px #9400D3, inset 0 0 20px #9400D3' // パープルネオンの影（外側と内側）
          }
        }}
      >
        <p>悪い子は退出させちゃうわよ💜</p>
        <button onClick={() => setModalIsOpen(false)}>Close Modal</button>
      </Modal>
    )
  };
};

export default useAutoLeaveRoom;