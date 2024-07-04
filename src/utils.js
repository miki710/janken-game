export const parseFilename = (filename, attributeMap) => {
        const identifierMatch = filename.match(/(\d+)\.\w+$/); // ファイル名の末尾にある数字を抽出
        const identifier = identifierMatch ? parseInt(identifierMatch[0], 10) : null;
        const attributes = attributeMap[identifier]; // 対応表から属性を取得

        return attributes; // 'hand'を含めずに属性のみを返す
      };

// 効果音を再生する関数
export const playSound = (soundType) => {
  let soundFile = '';
  switch (soundType) {
      case 'click':
          soundFile = 'click.mp3';
          break;
      case 'win':
          soundFile = 'win.mp3';
          break;
      case 'draw':
          soundFile = 'draw.mp3';
          break;
      case 'lose':
          soundFile = 'lose.mp3';
          break;
      default:
          return;
  }
  const audio = new Audio(`${process.env.REACT_APP_SOUND_BASE_URL}sound/${soundFile}`);
  audio.play();
};

// 手の絵文字を返す関数
export const getHandEmoji = (hand) => {
  switch (hand) {
      case 'Rock':
          return '✊';
      case 'Scissor':
          return '✌️';
      case 'Paper':
          return '✋';
      default:
          return '';
  }
};
