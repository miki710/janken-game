import React, { useRef, useEffect } from 'react';

function Fireworks() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const particlesArray = [];
    const numberOfParticles = 50; // パーティクルの数を減らして小さくする

    class Particle {
      constructor(x, y, size, color, velocity) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.velocity = velocity;
        this.alpha -= 0.01; // 透明度の減少速度を遅くする
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
      }

      update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02; // 透明度の減少速度を調整
      }
    }

    function init() {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
      for (let i = 0; i < numberOfParticles; i++) {
        const x = canvas.width / 2;
        const y = canvas.height / 2;
        const size = Math.random() * 2 + 1; // パーティクルのサイズを小さくする
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1; // パーティクルの速度を調整
        const velocity = {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        };
        particlesArray.push(new Particle(x, y, size, color, velocity));
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
        if (particlesArray[i].alpha <= 0) {
          particlesArray.splice(i, 1);
          i--;
        }
      }
      requestAnimationFrame(animate);
    }

    init();
    animate();
  }, []);

  return <canvas ref={canvasRef} width={200} height={200} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}></canvas>;
}

export default Fireworks;