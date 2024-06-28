// server.js
import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { parseFilename } from '../src/utils.js';
import { attributeMap } from '../src/attribute.js';
import baseRoutes from '../api/baseRoutes.js'; // baseRoutesをインポート
import vsComputerRoutes from '../api/vsComputerRoutes.js'; // vsComputerRoutesをインポート
import vsPlayerRoutes from '../api/vsPlayerRoutes.js';
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


app.use(cors(corsOptions));// CORS ミドルウェアを適用
app.use(express.json());

// リクエストの詳細をログに記録するミドルウェア
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Received cookies:', req.cookies); // クッキーの内容をログに出力
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


let waitingPlayers = [];
let activeMatching = new Set(); // アクティブなマッチングプロセスに参加しているユーザーIDを追跡
export let matches = {}; // すべてのマッチ情報を保持するオブジェクト

export function handleMatchRequest(req, res) {
    const userId = req.cookies.userId;
    console.log('Received match request from user:', userId); // デバッグ用ログ

    if (!userId) {
        console.log('ユーザーIDがクッキーに存在しません');
        return res.status(400).send('ユーザーIDがクッキーに存在しません');
    }

    if (activeMatching.has(userId)) {
        console.log('User already in matching process:', userId);
        return res.json({
            success: false,
            message: '既にマッチングプロセス中です'
        });
    }

    activeMatching.add(userId);
    waitingPlayers.push({ userId, res });
    console.log('Added user to waitingPlayers:', userId); // デバッグ用ログ

    // マッチングを試みる
    tryMatchPlayers();
}

function tryMatchPlayers() {
    console.log('Trying to match players...'); // デバッグ用ログ
    while (waitingPlayers.length >= 2) {
        const player1 = waitingPlayers.shift();
        const player2 = waitingPlayers.shift();
        console.log('Match found:', player1.userId, player2.userId);

          // マッチIDの生成
          const matchId = generateMatchId();

          // マッチ情報の初期化
          matches[matchId] = {
              players: {
                [player1.userId]: { userId: player1.userId, ready: false, hand: null, index: null, info: {}, points: 0},
                [player2.userId]: { userId: player2.userId, ready: false, hand: null, index: null, info: {}, points: 0}
              },
              status: 'active'
          };

        activeMatching.delete(player1.userId);
        activeMatching.delete(player2.userId);

        // ここで相互に opponentId を設定
        const response1 = {
            success: true,
            isMatched: true,
            matchId: matchId, // マッチIDをレスポンスに含める
            yourId: player1.userId,
            opponentId: player2.userId
        };
        const response2 = {
            success: true,
            isMatched: true,
            matchId: matchId, // マッチIDをレスポンスに含める
            yourId: player2.userId,
            opponentId: player1.userId
        };

        if (!player1.res.headersSent) {
            player1.res.json(response1);
        }
        if (!player2.res.headersSent) {
            player2.res.json(response2);
        }
    }
}

function generateMatchId() {
    return Date.now().toString(); // 簡易的なマッチID生成
}

export const checkMatchReady = (matchId, matches, res, req, attempts = 0, responseSent = false) => {
        console.log(`checkMatchReady function started for matchId: ${matchId}`);

        if (responseSent) {
            return; // レスポンスが既に送信されていれば何もしない
        }
    
        const match = matches[matchId];
        const players = Object.values(match.players);
        const player1 = players[0];
        const player2 = players[1];

        if (!player1 || !player2) {
            res.status(404).json({ message: "Player information is incomplete" });
            return;
        }
        
        if (req.cookies.userId !== player1.userId && req.cookies.userId !== player2.userId) {
            res.status(403).json({ message: "Unauthorized access" });
            return;
        }

        if (Object.values(match.players).every(player => player.ready)) {
            if (req.cookies.userId === player1.userId) {
                res.json({ 
                    ready: true,
                    result: determineMatchResult(match, player1.userId),
                    yourHand: player1.hand,
                    yourIndex: player1.index,
                    opponentHand: player2.hand,
                    opponentIndex: player2.index,
                    opponentInfo: player2.info
                });
            } else if (req.cookies.userId === player2.userId) {
                res.json({ 
                    ready: true,
                    result: determineMatchResult(match, player2.userId),
                    yourHand: player2.hand,
                    yourIndex: player2.index,
                    opponentHand: player1.hand,
                    opponentIndex: player1.index,
                    opponentInfo: player1.info
                });
            }
            responseSent = true; // レスポンスが送信されたことを記録
        } else if (attempts < 30) { // 最大30秒間試行
            setTimeout(() => checkMatchReady(matchId, matches, res, req, attempts + 1, responseSent), 1000);
        } else {
            console.log(`マッチID: ${matchId} の準備がタイムアウトしました。`); // ログ出力を追加
            res.status(408).json({ message: 'タイムアウト: マッチが準備完了になりませんでした。' });
            responseSent = true; // レスポンスが送信されたことを記録
        }
};


let userChoices = {}; // ユーザーの選択を保存するためのオブジェクト

export async function saveUserChoice(userId, hand, index, info, matchId, point) {
    console.log('Received info:', info); // infoの内容をログ出力
    // ユーザーの選択を保存
    const userChoice = { hand, index, info, points: point };
    userChoices[userId] = userChoice;

    const match = matches[matchId];
    if (match && match.players[userId]) {
        match.players[userId].hand = hand; // ユーザーの手を保存
        match.players[userId].index = index; // ユーザーのインデックスを保存
        match.players[userId].info = info; // ユーザーの情報を保存
        match.players[userId].points = point; // ユーザーのポイントを保存
        match.players[userId].ready = true; // ユーザーを準備完了状態に設定
    }
}


export function isBothUsersReady(match) {
    return Object.values(match.players).every(player => player.ready && player.hand !== null);
}

export function determineMatchResult(match, userId) {
    const players = Object.values(match.players);
    const player1 = players.find(p => p.userId === userId);
    const player2 = players.find(p => p.userId !== userId);
    // 勝敗判定ロジックを実装
    if (player1.hand === player2.hand) {
        return '引き分け';
    }
    if ((player1.hand === 'Rock' && player2.hand === 'Scissor') ||
        (player1.hand === 'Scissor' && player2.hand === 'Paper') ||
        (player1.hand === 'Paper' && player2.hand === 'Rock')) {
        const result = '勝ち';
        return result;
    } else {
        const result = '負け';
        return result;
    }
}

export function calculatePoints(currentPoints, result) {
    let newPoints = currentPoints;

    if (result === '勝ち') {
        newPoints += 20;  // 勝った場合は20ポイントを加算
    } else if (result === '引き分け') {
        // 引き分けの場合はポイント変動なし
    } else if (result === '負け') {
        newPoints -= 10;  // 負けた場合は10ポイントを減算
    }

    return newPoints;
}



export const images = {
    'Rock': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Rock1.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock2.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock3.webp`],
    'Scissor': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor4.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor5.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor6.webp`],
    'Paper': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Paper7.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper8.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper9.webp`]
};

export function generateOpponentChoice() {
    const allImages = Object.values(images).flat();
    const randomImageIndex = Math.floor(Math.random() * allImages.length);
    const randomImage = allImages[randomImageIndex];

    let newOpponentHand = '';
    let newOpponentImageIndex = 0;
    Object.entries(images).forEach(([key, value]) => {
        const foundIndex = value.indexOf(randomImage);
        if (foundIndex !== -1) {
            newOpponentHand = key;
            newOpponentImageIndex = foundIndex;
        }
    });

    const opponentFileName = images[newOpponentHand][newOpponentImageIndex];
    const newOpponentInfo = parseFilename(opponentFileName, attributeMap);

    console.log("Generated newComputerInfo:", newOpponentInfo); // ログ出力

    return {
        hand: newOpponentHand,
        index: newOpponentImageIndex,
        info: newOpponentInfo
    };
}

export function determineWinner(userHand, opponentHand) {
    if (userHand === opponentHand) {
        return '引き分け';
    } else if (
        (userHand === 'Rock' && opponentHand === 'Scissor') ||
        (userHand === 'Scissor' && opponentHand === 'Paper') ||
        (userHand === 'Paper' && opponentHand === 'Rock')
    ) {
        return '勝ち';
    } else {
        return '負け';
    }
}


// サーバーを起動
const PORT = process.env.PORT || 3001;

// ルートハンドラ
app.use('/api', baseRoutes);
app.use('/api/vs-computer', vsComputerRoutes);
app.use('/api/vs-player', vsPlayerRoutes);

// エラーハンドリングミドルウェアをルートハンドラの後に追加
app.use((err, req, res, next) => {
    console.error('Post-route Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
    next();
});


app.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました`);
    // 開発環境ではポート3001を使用し、本番環境ではポート443を推奨（環境によって設定を変更してください）
});

export default app;