// server.js
import express from 'express';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import fs from 'fs';
import dotenv from 'dotenv';
// 例：utils.mjs を utils.js に変更した場合
import { parseFilename } from './utils.js';
import { attributeMap } from './attribute.js';
import cors from 'cors';

dotenv.config(); // 環境変数を読み込む
const app = express(); // express アプリケーションを初期化

// cookie-parser ミドルウェアを使用する
// これにより、リクエストに含まれるクッキーを解析し、req.cookies でアクセス可能にする
app.use(cookieParser());

// CORS設定はその他のミドルウェアやルートハンドラよりも前
const corsOptions = {
    origin: process.env.CLIENT_URL, // 環境変数からクライアントのURLを取得
    optionsSuccessStatus: 200,
    credentials: true // クレデンシャル付きのリクエストを許可
};

// CORS設定をコンソールに出力
console.log('CORS設定:', corsOptions);
console.log('クライアントURL:', process.env.CLIENT_URL);

app.use(cors(corsOptions));// CORS ミドルウェアを適用


// リクエストの詳細をログに記録するミドルウェア
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// レスポンスの内容をログに記録するミドルウェア
app.use((req, res, next) => {
    console.log("Middleware for logging response is running");
    const originalSend = res.send;
    res.send = function (body) {
        console.log(`Sending response with status ${res.statusCode}:`, body);
        originalSend.call(this, body);
    };
    next();
});

// JSON リクエストボディを解析
app.use(express.json());

// 環境に応じて証明書のパスを選択
const keyPath = process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_KEY_PATH : process.env.LOCAL_KEY_PATH;
const certPath = process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_CERT_PATH : process.env.LOCAL_CERT_PATH;

// SSL/TLS 証明書の設定
const options = {
    key: fs.readFileSync(keyPath), // SSLキーのパス（本番環境で使用）
    cert: fs.readFileSync(certPath) // SSL証明書のパス（本番環境で使用）
};

const server = https.createServer(options, app);


// ゲームの状態を管理する変数
let gameResults = {};
// ルート定義
app.post('/play', (req, res) => {
    const { hand, index, mode } = req.body; // ユーザーの選択を受け取る
    const computerChoice = generateComputerChoice(); // コンピュータの選択を生成
    const result = determineWinner(hand, computerChoice.hand); // 勝敗を決定

    // 結果を保存
    const resultId = Date.now(); // 簡易的なID生成
    gameResults[resultId] = {
        result: result,
        computer: computerChoice
    };

    console.log("Generated Result ID:", resultId); // 結果IDをコンソールに出力

    // 結果をクライアントに送信
    res.json({
        resultId: resultId,
        user: {
            hand: hand,
            index: index
        },
        computer: {
            hand: computerChoice.hand,
            index: computerChoice.index,
            info: computerChoice.info
        },
        result: result
     });
});

app.get('/result/:id', (req, res) => {
    const { id } = req.params;
    const result = gameResults[id];
    if (result) {
        res.json(result);
    } else {
        res.status(404).json({ message: 'Result not found' });
    }
});

let waitingPlayers = [];
let activeMatching = new Set(); // アクティブなマッチングプロセスに参加しているユーザーIDを追跡

app.post('/match', (req, res) => {
    const userId = req.cookies.userId;
    if (!userId) {
        return res.status(400).send('ユーザーIDがクッキーに存在しません');
    }

    if (activeMatching.has(userId)) {
        return res.json({
            success: false,
            message: '既にマッチングプロセス中です'
        });
    }

    activeMatching.add(userId);
    waitingPlayers.push(userId);

    tryMatchPlayers(res);
});

function tryMatchPlayers(res) {
    while (waitingPlayers.length >= 2) {
        const player1 = waitingPlayers.shift();
        const player2 = waitingPlayers.shift();

        if (player1 === player2) {
            console.error('同一プレイヤーがマッチングしようとしました:', player1);
            activeMatching.delete(player1); // マッチングリストから削除
            waitingPlayers.unshift(player1); // 再度キューに戻す
            continue; // 次のマッチングを試みる
        }

        activeMatching.delete(player1);
        activeMatching.delete(player2);

        res.json({
            success: true,
            isMatched: true,
            players: [player1, player2]
        });
        return; // マッチングが成功したのでレスポンスを送信
    }

    res.json({
        success: false,
        isMatched: false
    });
}

// サーバーを起動
const PORT = process.env.PORT || 3001;

// ルートハンドラ
app.get('/', (req, res) => {
    if (!req.cookies.userId) {
        // ユーザーIDがクッキーに存在しない場合、新しいIDを生成して設定
        const userId = uuidv4();
        res.cookie('userId', userId, { maxAge: 900000, httpOnly: true, secure: true, sameSite: 'None' });
        res.send('新しいユーザーIDがクッキーに設定されました: ' + userId);
    } else {
        // ユーザーIDが既にクッキーに存在する場合
        res.send('既存のユーザーIDを使用します: ' + req.cookies.userId);
    }
});

export const images = {
    'Rock': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Rock1.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock2.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock3.webp`],
    'Scissor': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor4.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor5.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor6.webp`],
    'Paper': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Paper7.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper8.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper9.webp`]
};

function generateComputerChoice() {
    const allImages = Object.values(images).flat();
    const randomImageIndex = Math.floor(Math.random() * allImages.length);
    const randomImage = allImages[randomImageIndex];

    let newComputerHand = '';
    let newComputerImageIndex = 0;
    Object.entries(images).forEach(([key, value]) => {
        const foundIndex = value.indexOf(randomImage);
        if (foundIndex !== -1) {
            newComputerHand = key;
            newComputerImageIndex = foundIndex;
        }
    });

    const computerFileName = images[newComputerHand][newComputerImageIndex];
    const newComputerInfo = parseFilename(computerFileName, attributeMap);

    console.log("Generated newComputerInfo:", newComputerInfo); // ログ出力

    return {
        hand: newComputerHand,
        index: newComputerImageIndex,
        info: newComputerInfo
    };
}

function determineWinner(userHand, computerHand) {
    if (userHand === computerHand) {
        return '引き分け';
    } else if (
        (userHand === 'Rock' && computerHand === 'Scissor') ||
        (userHand === 'Scissor' && computerHand === 'Paper') ||
        (userHand === 'Paper' && computerHand === 'Rock')
    ) {
        return '勝ち';
    } else {
        return '負け';
    }
}

// 他のすべてのルートとミドルウェアの後に追加
app.use((err, req, res, next) => {
    console.error(err.stack); // エラーの詳細をコンソールに出力
    res.status(500).send('サーバー内部でエラーが発生しました');
});


server.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました`);
    // 開発環境ではポート3001を使用し、本番環境ではポート443を推奨（環境によって設定を変更してください）
});