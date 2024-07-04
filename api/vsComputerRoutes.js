// routes/vsComputerRoutes.js
import express from 'express';
const router = express.Router();

// 必要な関数や変数をserver.jsからインポート
import { generateOpponentChoice, determineWinner } from '../api/server.js';

// ゲームの状態を管理する変数をここに移動
const gameResults = {};



router.post('/play', (req, res) => {
    const { hand, index, mode } = req.body; // ユーザーの選択を受け取る
    const opponentChoice = generateOpponentChoice(); // コンピュータの選択を生成
    //const result = determineWinner(hand, opponentChoice.hand); // 勝敗を決定

    /*
    const resultId = Date.now(); // 簡易的なID生成
    gameResults[resultId] = {
        result: result,
        opponent: opponentChoice
    };

    console.log("Generated Result ID:", resultId); // 結果IDをコンソールに出力
    */

    // 結果をクライアントに送信
    res.json({
        //resultId: resultId,
        user: {
            hand: hand,
            index: index
        },
        opponent: {
            hand: opponentChoice.hand,
            index: opponentChoice.index,
            info: opponentChoice.info
        },
        //result: result
     });
});

/*
router.get('/result/:id', (req, res) => {
    const { id } = req.params;
    const result = gameResults[id];
    if (result) {
        res.json(result);
    } else {
        res.status(404).json({ message: 'Result not found' });
    }
});
*/

export default router;
