// routes/vsPlayerRoutes.js
import express from 'express';
const router = express.Router();

// 必要な関数や変数をserver.jsからインポート
import { isBothUsersReady, checkMatchReady, saveUserChoice, determineMatchResult, calculatePoints, matches } from '../src/server.js';

// マッチが準備完了状態になっているかを確認し、その状態をクライアントに通知するエンドポイント
router.get('/check-match-ready', (req, res) => {
    const { matchId } = req.query;
    console.log("Received GET request for /check-match-ready with matchId:", matchId);
    const match = matches[matchId];
    if (!match) {
        return res.status(404).json({ message: "Match not found" });
    }

    if (isBothUsersReady(match)) {
        // 両ユーザーが準備完了の場合の処理
        // ここで checkMatchReady を呼び出す
        checkMatchReady(matchId, matches, res, req, 0, false);
    } else {
        // まだ準備が整っていない場合の処理
        res.json({ message: 'Waiting for both users to be ready.' });
    }
});

// ユーザーの選択を保存し、ランキングやポイントシステムに使用するためのエンドポイント
router.post('/play-match', async (req, res) => {
    try {
        const { userId, hand, index, info, matchId, opponentId, point } = req.body; // ユーザーIDと選択した画像を受け取る
        console.log("Received from client:", { userId, hand, index, info, opponentId, matchId, point });
        const match = matches[matchId]; // マッチIDを使用してマッチ情報を取得
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
        await saveUserChoice(userId, hand, index, info, matchId, point);
        
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