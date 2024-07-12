import React, { useRef, useEffect } from 'react';
import './App.css'; // CSSファイルをインポート

const FireworksComponent = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let fireworks = [];
    let lastTime = 0;

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = 'red';
        this.radius = 2;
        this.speed = Math.random() * 3 + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.gravity = 0.05;
        this.opacity = 1;
      }
      update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += this.gravity * deltaTime;
        this.opacity -= 0.01 * deltaTime;
        this.radius -= 0.05 * deltaTime;
        if (this.radius < 0) { this.radius = 0; }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        ctx.closePath();
      }
    }

    const update = () => {
      const time = performance.now();
      const deltaTime = (time - lastTime) / 100;
      lastTime = time;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < fireworks.length; i++) {
        fireworks[i].update(deltaTime);
        fireworks[i].draw();
        if (fireworks[i].opacity <= 0 || fireworks[i].radius <= 0) {
          fireworks.splice(i, 1);
          i--;
        }
      }
      requestAnimationFrame(update);
    };

    const launchFireworks = (cx, cy) => {
      const colors = ['orange', 'red', 'yellow'];
      for (let i = 0; i < 100; i++) {
        const particle = new Particle(cx, cy);
        particle.color = colors[Math.floor(Math.random() * colors.length)];
        particle.radius = Math.random() * 2 + 1;
        fireworks.push(particle);
      }
    };

    lastTime = performance.now();
    update();
    const interval = setInterval(() => {
      const cx = Math.random() * canvas.width;
      const cy = Math.random() * canvas.height;
      launchFireworks(cx, cy);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fireworks-container">
      <h2 className="text">テスト</h2>
      <canvas
        ref={canvasRef}
        width="400"
        height="400"
        className="fireworks-canvas"
      ></canvas>
    </div>
  );
};

export default FireworksComponent;