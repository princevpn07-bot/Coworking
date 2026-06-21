/**
 * 🌌 COVO 策展理念 - 電影級假 3D 多層級視差空間背景引擎 (真 3D 空間視角拖曳旋轉版)
 * 100% 獨立隔離，不改動前景卡片牆與標題原本的任何 GSAP 程式碼！
 * 完美補回滑鼠按住空白處左右上下旋轉 3D 空間視角的殿堂級動態，自帶高級物理滑行慣性。
 */
export function startPhilosophyParallax(meshGrid, sunlightGlows, bgText, cardsWrapper) {
  // 🔒 剛性安全防護：如果網頁節點還沒加載完全，直接攔截不執行
  if (!meshGrid || !sunlightGlows || !bgText || !cardsWrapper) {
    return { update: () => {}, destroy: () => {} };
  }

  // 💡【真 3D 空間視角拖曳控制矩陣】
  let rotationY = 0;      let targetRotationY = 0;
  let rotationX = 0;      let targetRotationX = 0;
  let velX = 0;           let velY = 0;
  let isDragging = false;
  let lastMouseX = 0;     let lastMouseY = 0;

  const sectionContainer = meshGrid.parentNode;

  // 1. 🚀 按住滑鼠：剛性排除卡片與對話框點擊，精準鎖定空白處
  const onMouseDown = (e) => {
    // 🔒【高階安全隔離】：如果點到的是卡片內部、對話框或按鈕，不觸發空間視角旋轉，保障基礎交互
    if (e.target.closest('.card-inner') || e.target.closest('.hover-description-box') || e.target.closest('a') || e.target.closest('button')) {
      return;
    }
    
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    
    // 🔒 剛性禁止網頁藍色文字選取與圖片拖動，徹底根除拖曳中斷死機的瀏覽器 Bug
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  };

  // 2. 🚀 移動滑鼠：實時換算空間多軸偏轉角度與甩動速度
  const onMouseMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;

      // 累加旋轉目標值（0.12 為精品展間高雅不突兀的旋轉靈敏度）
      targetRotationY += dx * 0.12;
      targetRotationX -= dy * 0.08;

      // 剛性限制垂直轉動視角上限，防止 3D 視角翻轉破模
      targetRotationX = Math.max(-14, Math.min(14, targetRotationX));

      // 捕獲當前滑鼠甩動的物理速度，用來轉化為放開後的慣性滑行
      velX = dx * 0.12;
      velY = -dy * 0.08;

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  };

  // 3. 🚀 放開滑鼠：解除鎖定
  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = 'auto';
      document.body.style.webkitUserSelect = 'auto';
    }
  };

  // 綁定局部空間視角監聽器
  sectionContainer.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  sectionContainer.addEventListener('mouseleave', onMouseUp);

  return {
    /**
     * 每一影格由前端主循環（Gsap Ticker）每秒 60 次高頻驅動的假 3D 渲染器
     */
    update: (mx, my, factor) => {
      // 💡【物理級慣性緩衝】：當滑鼠放開時，利用 0.93 的阻尼係數讓空間視角帶有高檔的滑行回饋
      if (!isDragging) {
        targetRotationY += velX;
        targetRotationX += velY;
        velX *= 0.93; // 慣性滑行徐徐減速
        velY *= 0.93;
        
        // 沉靜平緩地將垂直傾角引導回正，防止畫面定格在奇怪的角度
        targetRotationX += (0 - targetRotationX) * 0.02;
      }

      // 指數平滑插值（Lerp），創造頂級不生硬的機械平滑體感
      rotationY += (targetRotationY - rotationY) * 0.06;
      rotationX += (targetRotationX - rotationX) * 0.06;

      // ── 💡 遠近景多層級視差與手動 3D 空間偏轉矩陣完美交織 ──

      // 1. 【近景】洗鍊幾何建築網格線 (Z: -50px)：隨滑鼠微幅位移，並 100% 響應空間視角旋轉
      meshGrid.style.transform = `
        translate3d(${mx * 24}px, ${my * 18}px, -50px) 
        rotateY(${rotationY + mx * 3.5}deg) 
        rotateX(${rotationX - my * 2.0}deg)
      `;

      // 2. 【中景】清晨暖陽散光氣團 (Z: -260px)：結合滑鼠微動與視角旋轉，產生柔和的光影變幻
      sunlightGlows.style.transform = `
        translate3d(${-mx * 45}px, ${-my * 30}px, -260px) 
        scale(${1.0 + factor * 0.06}) 
        rotateY(${rotationY * 0.4 - mx * 1.5}deg)
        rotateX(${rotationX * 0.4}deg)
      `;

      // 3. 【最遠景】巨型霧化品牌字體牆 (Z: -450px)：大視差位移與深層透視變形
      bgText.style.transform = `
        translate3d(calc(-50% + ${-mx * 60}px), calc(-50% + ${-my * 35}px), -450px) 
        scale(${0.85 + factor * 0.15}) 
        rotateY(${rotationY * 0.2 - mx * 2.0}deg)
        rotateX(${rotationX * 0.2}deg)
      `;

      // 4. ✨【前景卡片總圓圓舞台】：整體上移 70 像素 + 3D 視角偏轉完美歸位！
      // 💡 透過將拖曳視角角度（rotationX/Y）乘以 0.8 倍權重施加在總舞台上，讓前景卡片牆隨背景同步偏轉！
      // 同時完美保留了 translateY(-70px) 防止底部切邊的優雅布局。
      cardsWrapper.style.transform = `
        translateY(-70px)
        rotateY(${rotationY * 0.8 + mx * 4.0}deg)
        rotateX(${rotationX * 0.8 - my * 2.5}deg)
      `;
      cardsWrapper.style.transformOrigin = "center center";
    },
    destroy: () => {
      sectionContainer.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      sectionContainer.removeEventListener('mouseleave', onMouseUp);
    }
  };
}