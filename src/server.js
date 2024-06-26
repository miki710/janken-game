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

// JSON リクエストボディを解析
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
    const opponentChoice = generateOpponentChoice(); // コンピュータの選択を生成
    const result = determineWinner(hand, opponentChoice.hand); // 勝敗を決定

    // 結果を保存
    const resultId = Date.now(); // 簡易的なID生成
    gameResults[resultId] = {
        result: result,
        opponent: opponentChoice
    };

    console.log("Generated Result ID:", resultId); // 結果IDをコンソールに出力

    // 結果をクライアントに送信
    res.json({
        resultId: resultId,
        user: {
            hand: hand,
            index: index
        },
        opponent: {
            hand: opponentChoice.hand,
            index: opponentChoice.index,
            info: opponentChoice.info
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
let matches = {}; // すべてのマッチ情報を保持するオブジェクト

function handleMatchRequest(req, res) {
    const userId = req.cookies.userId;
    if (!userId) {
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

    // マッチングを試みる
    tryMatchPlayers();
}

function tryMatchPlayers() {
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

app.post('/match', handleMatchRequest);

// マッチが準備完了状態になっているかを確認し、その状態をクライアントに通知するエンドポイント
app.get('/check-match-ready', (req, res) => {
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

    const checkMatchReady = (matchId, matches, res, req, attempts = 0, responseSent = false) => {
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


// ユーザーの選択を保存し、ランキングやポイントシステムに使用するためのエンドポイント
app.post('/play-match', async (req, res) => {
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

let userChoices = {}; // ユーザーの選択を保存するためのオブジェクト

async function saveUserChoice(userId, hand, index, info, matchId, point) {
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


function isBothUsersReady(match) {
    return Object.values(match.players).every(player => player.ready && player.hand !== null);
}

function determineMatchResult(match, userId) {
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

function calculatePoints(currentPoints, result) {
    let newPoints = currentPoints;

    if (result === '勝ち') {
        newPoints += 20;  // 勝った場合は20ポイントを加算
    } else if (result === '引き分け') {
        // 引き分けの場合はポイント変動なし
    } else if (result === '負け') {
        newPoints -= 10;  // 負けた場合は10ポイントを減算
        if (newPoints < 0) {
            newPoints = 0;  // ポイントが負にならないように調整
        }
    }

    return newPoints;
}



// サーバーを起動
const PORT = process.env.PORT || 3001;

// ルートハンドラ
app.get('/', (req, res) => {
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

export const images = {
    'Rock': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Rock1.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock2.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Rock3.webp`],
    'Scissor': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor4.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor5.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Scissor6.webp`],
    'Paper': [`${process.env.REACT_APP_IMAGE_BASE_URL}/Paper7.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper8.webp`, `${process.env.REACT_APP_IMAGE_BASE_URL}/Paper9.webp`]
};

function generateOpponentChoice() {
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

function determineWinner(userHand, opponentHand) {
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

// 他のすべてのルートとミドルウェアの後に追加
app.use((err, req, res, next) => {
    console.error(err.stack); // エラーの詳細をコンソールに出力
    res.status(500).send('サーバー内部でエラーが発生しました');
});


server.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました`);
    // 開発環境ではポート3001を使用し、本番環境ではポート443を推奨（環境によって設定を変更してください）
});0