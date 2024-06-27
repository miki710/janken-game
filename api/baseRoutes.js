// routes/baseRoutes.js
import express from 'express';
import { v4 as uuidv4 } from 'uuid'; // uuidv4をインポート

const router = express.Router();

router.get('/', (req, res) => {
    if (!req.cookies.userId) {
        // ユーザーIDがクッキーに存在しない場合、新しいIDを生成して設定
        const userId = uuidv4();
        res.cookie('userId', userId, { 
            expires: new Date(Date.now() + 86400000), // 24時間後に期限切れ
            httpOnly: true, 
            secure: true, 
            sameSite: 'None' 
        });
        res.send('永続クッキーを設定しました: ' + userId);
    } else {
        // ユーザーIDが既にクッキーに存在する場合
        res.send('既存のユーザーIDを使用します: ' + req.cookies.userId);
    }
});

export default router;