export function startGateInk(canvas, container, heroCanvas) {
  const ctx = canvas.getContext('2d');
  let animId;
  let inkDrops = [];
  const dpr = window.devicePixelRatio || 1;

  // 1. ✨【純粹宣紙毛細孔吸水洇染與重力慢滴落粒子類別】
  class CapillaryInkDrop {
    constructor(x, y, baseRadius) {
      this.x = x;
      this.y = y;
      
      // 💡 水墨擴散面積調校：中等大氣的吸水面積，確保劃開時的底圖透出非常清晰
      this.targetRadius = baseRadius * (2.4 + Math.random() * 1.0);
      this.radius = baseRadius * 0.2; // 剛落紙的濃郁墨點
      
      // 💡 水流的感覺：結合液體原地吸水擴散，並帶有重力緩慢下墜流淌的物理抖動
      this.driftX = (Math.random() - 0.5) * 0.12;
      this.driftY = 0.4 + Math.random() * 0.5; // 沉靜、黏滯的慢速下滑水流感
      
      this.life = 1.0;
      // 💡 黃金中速淡出：卡在最舒服的中間數時間（1.5 秒），擴散定型後優雅地慢慢淡出消失
      this.decay = 0.012 + Math.random() * 0.005; 
      
      this.seed = Math.random() * 888.88;
      this.numPoints = 60; // 超高密度頂點，用來雕琢水墨特有的微觀毛邊
      
      // 🚀【核心紙張力學】：不均勻吸水毛細孔隙率矩陣
      // 模擬宣紙內部縱橫交錯的編織纖維，讓水墨在擴散時自動洇出不規則的凹凸拉扯
      this.porosityMap = [];
      for (let i = 0; i < this.numPoints; i++) {
        this.porosityMap.push(0.75 + Math.random() * 0.55); 
      }
    }

    update() {
      // 緩慢的水流流淌物理位移
      this.x += this.driftX + Math.sin(this.y * 0.03 + this.seed) * 0.12;
      this.y += this.driftY;
      
      // 指數型吸水洇染（落紙前半段迅速鋪開，後半段被纖維咬住停止變大）
      if (this.radius < this.targetRadius) {
        this.radius += (this.targetRadius - this.radius) * 0.045;
      }

      this.life -= this.decay;
      if (this.life <= 0) this.life = 0;
    }

    // 🌟【流體紙張走墨路徑生成引擎】
    createInkPath(r) {
      ctx.beginPath();
      for (let j = 0; j < this.numPoints; j++) {
        const angle = (j / this.numPoints) * Math.PI * 2;
        
        // 💡 疊加低頻流體波動與中高頻微觀粗糙毛刺，強迫圓周呈現完美水墨毛邊
        const warpLow = Math.sin(angle * 4.0 + this.seed) * 0.07;
        const warpMedium = Math.cos(angle * 12.0 - this.seed * 0.5) * 0.035;
        const warpHigh = Math.sin(angle * 32.0 + this.seed * 2.0) * 0.012;
        
        const totalOffset = (warpLow + warpMedium + warpHigh) * r;
        const currentRadius = Math.max(2.0, (r + totalOffset) * this.porosityMap[j]);
        
        const vertexX = this.x + Math.cos(angle) * currentRadius;
        const vertexY = this.y + Math.sin(angle) * currentRadius;
        
        if (j === 0) ctx.moveTo(vertexX, vertexY);
        else ctx.lineTo(vertexX, vertexY);
      }
      ctx.closePath();
    }
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  // 2. 🚀【路徑線性密集內插】：確保滑鼠快速划過時，水流連變聯成面，絕不蹦出顆粒圓點
  let lastX = null, lastY = null;

  const onPointerMove = (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (lastX !== null && lastY !== null) {
      const dx = x - lastX;
      const dy = y - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const steps = Math.max(1, Math.floor(distance / 2));
      for (let i = 0; i < steps; i++) {
        const interX = lastX + (dx / steps) * i;
        const interY = lastY + (dy / steps) * i;
        
        // 注入具備水流擴散感的中等大小墨滴種子 (25px - 38px)
        inkDrops.push(new CapillaryInkDrop(interX, interY, 25 + Math.random() * 13));
      }
    } else {
      inkDrops.push(new CapillaryInkDrop(x, y, 30));
    }

    lastX = x;
    lastY = y;
  };
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerleave', () => { lastX = null; lastY = null; });

  // 3. 🚀【核心多層級 Stencil 逆向水墨顯影主循環】
  const loop = () => {
    // 每一影格 100% 清空畫布，保持畫布透明，完美展現下方 100% 固體不透明的純黑大門
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    if (inkDrops.length === 0) {
      animId = requestAnimationFrame(loop);
      return;
    }

    ctx.save();

    // ── 💡 階段 A：在透明畫布上交織生成帶有宣紙不規則毛邊的水墨白遮罩 ──
    for (let i = inkDrops.length - 1; i >= 0; i--) {
      const p = inkDrops[i];
      p.update();

      if (p.life <= 0 || p.radius < 1.0) {
        inkDrops.splice(i, 1);
        continue;
      }

      ctx.save();
      const smoothAlpha = Math.sin(p.life * Math.PI * 0.5);

      // 建立宣紙洇染毛邊路徑
      p.createInkPath(p.radius);

      // 調配水墨特有「墨分五色」的濡濕漸層感，邊緣帶有輕薄透明的水漬圈
      const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 1.15);
      radGrad.addColorStop(0, `rgba(255, 255, 255, ${smoothAlpha})`);         // 墨心：100% 強力顯影
      radGrad.addColorStop(0.60, `rgba(255, 255, 255, ${smoothAlpha * 0.75})`); // 墨身：自然水流融合
      radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');                     // 墨尾：完美咬合

      ctx.fillStyle = radGrad;
      ctx.fill();
      ctx.restore();
    }

    // ── 💡 階段 B：切換 GPU 指令，將底層 3D 圖片畫布完美灌入水墨範圍中 ──
    // 核心魔法：利用 source-in，將抓取到的高清 office 底圖 100% 剔透地填滿水墨開出來的凹槽！
    ctx.globalCompositeOperation = 'source-in';
    
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    if (heroCanvas && heroCanvas.width > 0) {
      ctx.drawImage(heroCanvas, 0, 0, w, h);
    }

    ctx.restore();
    animId = requestAnimationFrame(loop);
  };
  loop();

  return {
    destroy: () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      container.removeEventListener('pointermove', onPointerMove);
    }
  };
}