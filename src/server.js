// server.js
import express from 'express';
import http from 'http';
import { Server as socketIo } from 'socket.io';
   // 例：utils.mjs を utils.js に変更した場合
import { parseFilename } from './utils.js';
import { attributeMap } from './attribute.js';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new socketIo(server, {
    cors: {
      origin: "http://localhost:3000", // クライアントのURL
      methods: ["GET", "POST"]
    }
});

const corsOptions = {
    origin: 'http://localhost:3000', // クライアントのURL
    optionsSuccessStatus: 200
  };
  
  app.use(cors(corsOptions));



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

let waitingPlayers = [];

io.on('connection', (socket) => {
    console.log('新しいユーザーが接続しました:', socket.id);

    socket.on('play', (data) => {
        console.log('Received play event:', data);  // 受け取ったデータをログ出力
        if (data.mode === 'vsComputer') {
            const computerChoice = generateComputerChoice();
            console.log('Computer choice:', computerChoice);  // コンピュータの選択をログ出力
            const result = determineWinner(data.hand, computerChoice.hand);
            socket.emit('result', { 
                result: result, 
                hand: computerChoice.hand,
                index: computerChoice.index,
                info: computerChoice.info
            });
        }
    });

    socket.on('waitingForPlayer', () => {
        console.log('プレイヤーがマッチングを待っています:', socket.id);
        waitingPlayers.push(socket);

        if (waitingPlayers.length >= 2) {
            const player1 = waitingPlayers.shift();
            const player2 = waitingPlayers.shift();
            player1.emit('matchFound');
            player2.emit('matchFound');
            console.log('マッチング成功:', player1.id, 'と', player2.id);
        }
    });

    socket.on('disconnect', () => {
        waitingPlayers = waitingPlayers.filter(player => player.id !== socket.id);
        console.log('ユーザーが切断しました:', socket.id);
    });
});

server.listen(3001, () => {
    console.log('サーバーがポート3001で起動しました');
});