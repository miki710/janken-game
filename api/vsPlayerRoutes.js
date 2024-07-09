// routes/vsPlayerRoutes.js
import express from 'express';
const router = express.Router();

// 必要な関数や変数をserver.jsからインポート
import { isBothUsersReady, checkMatchReady, saveUserChoice, determineMatchResult, calculatePoints, matches, rooms } from '../api/server.js';


// 部屋の状態を取得するエンドポイント
router.get('/rooms', (req, res) => {
    try {
        const roomStates = Object.keys(rooms).map(room => ({
            name: room,
            players: rooms[room].players,
        }));
        res.json({ rooms: roomStates });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/check-matching', (req, res) => {
    const room = req.query.room;
    if (rooms[room].players.length >= 2) {
        res.json({ matched: true });
    } else {
        res.json({ matched: false });
    }
});

// プレイヤーが部屋に参加するエンドポイント
router.post('/join-room', (req, res) => {
    try {
        const room = req.query.room;
        const playerId = req.cookies.userId;
        console.log('Joining room:', room); // デバッグ情報を追加
        
        if (rooms[room]) { // 部屋が存在するか確認
            if (rooms[room].players.length < 2) { // 最大4人まで参加可能
                rooms[room].players.push(playerId);
                console.log('Room state after join:', rooms[room]); // ログ出力を追加
                res.json({ success: true });
            } else {
                res.json({ success: false, message: 'Room is full' });
            }
        } else {
            console.error('Room not found:', room); // エラーログを追加
            res.status(404).json({ error: 'Room not found' });
        }
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// マッチが準備完了状態になっているかを確認し、そのマッチリクエストを処理するエンドポイント
router.post('/match', (req, res) => {
    const userId = req.cookies.userId;
    const room = req.query.room;

    if (!userId) {
        return res.status(400).send('ユーザーIDがクッキーに存在しません');
    }

    if (!rooms[room]) {
        return res.status(404).send('部屋が存在しません');
    }

    const players = rooms[room].players;
    if (!players.includes(userId)) {
        return res.status(403).send('ユーザーはこの部屋に参加していません');
    }

    const opponentId = players.find(id => id !== userId);

    // マッチ情報の初期化
    matches[room] = {
        matchId: room, // マッチIDを保存
        players: players.reduce((acc, playerId) => {
            acc[playerId] = { userId: playerId, ready: false, hand: null, index: null, info: {}, points: 0 };
            return acc;
        }, {}),
        status: 'active'
    };

    // 各プレイヤーに対してレスポンスを送信
    players.forEach(playerId => {
        const response = {
            success: true,
            isMatched: true,
            matchId: room,
            yourId: playerId,
            opponentId: players.find(id => id !== playerId)
        };

        // ここでレスポンスを送信
        // 例えば、WebSocketを使用してリアルタイムにレスポンスを送信することができます
        // ここでは簡単のため、コンソールに出力します
        console.log('Sending response to player:', response);
    });

    // 最後にリクエストを送信したユーザーにレスポンスを返す
    res.json({
        success: true,
        isMatched: true,
        matchId: room,
        yourId: userId,
        opponentId: opponentId
    });
});



//状態をクライアントに通知するエンドポイント
router.get('/check-match-ready', (req, res) => {
    const { room } = req.query;
    console.log("Received GET request for /check-match-ready with matchId:", matchId);
    const match = matches[room];
    if (!match) {
        return res.status(404).json({ message: "Match not found" });
    }

    if (isBothUsersReady(match)) {
        // 両ユーザーが準備完了の場合の処理
        // ここで checkMatchReady を呼び出す
        checkMatchReady(room, matches, res, req, 0, false);
    } else {
        // まだ準備が整っていない場合の処理
        res.json({ message: 'Waiting for both users to be ready.' });
    }
});

// ユーザーの選択を保存
router.post('/play-match', async (req, res) => {
    try {
        const { userId, hand, index, info, room, opponentId, point } = req.body; // ユーザーIDと選択した画像を受け取る
        console.log("Received from client:", { userId, hand, index, info, opponentId, room, point });
        const match = matches[room]; // マッチIDを使用してマッチ情報を取得
        if (!match) {
            return res.status(404).json({ error: 'マッチが見つかりません' });
        }
        if (!match.players[userId]) {
            return res.status(404).json({ error: 'プレイヤーがマッチに存在しません' });
        }

        const player1 = match.players[userId];
        const player2 = match.players[opponentId];
        if (!player1 || !player2) {
            return res.status(404).json({ error: 'プレイヤー情報が不完全です' });
        }

        // ユーザーの選択を保存
        await saveUserChoice(userId, hand, index, info, room, point);

        // デバッグ用ログ
        console.log("Player 1 ready state:", match.players[userId].ready);
        console.log("Player 2 ready state:", match.players[opponentId].ready);
        
        // 両プレイヤーが準備完了か確認
        if (player1.ready && player2.ready) {
            // 勝敗判定の呼び出し
            const result1 = determineMatchResult(match, userId);
            const result2 = determineMatchResult(match, opponentId);

            // ポイント計算
            const newPoints1 = calculatePoints(player1.points, result1);
            const newPoints2 = calculatePoints(player2.points, result2);
       
            // ユーザーにポイントを返す
            res.json({
                status: 'finished',
                message: 'マッチが完了しました。',
                results: [
                    { userId: userId, points: newPoints1, result: result1 },
                    { userId: opponentId, points: newPoints2, result: result2 }
                ]
            });
        } else {
            res.json({
                status: 'waiting',
                message: '両プレイヤーの準備が完了していません'
            });
        }
    } catch (error) {
        console.error("Error during play-match:", error);
        res.status(500).json({ error: '内部サーバーエラーが発生しました' });
    }
});


export default router;