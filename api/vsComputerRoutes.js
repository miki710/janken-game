// routes/vsComputerRoutes.js
import express from 'express';
const router = express.Router();

// 必要な関数や変数をserver.jsからインポート
import { generateOpponentChoice } from '../api/server.js';


router.post('/play', (req, res) => {
    const { hand, index, mode } = req.body; // ユーザーの選択を受け取る
    const opponentChoice = generateOpponentChoice(); // コンピュータの選択を生成

    // 結果をクライアントに送信
    res.json({
        user: {
            hand: hand,
            index: index
        },
        opponent: {
            hand: opponentChoice.hand,
            index: opponentChoice.index,
            info: opponentChoice.info
        }
     });
});


export default router;
