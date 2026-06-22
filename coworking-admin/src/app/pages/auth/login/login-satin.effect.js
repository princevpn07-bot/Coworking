import { gsap } from 'gsap';

/**
 * 🌌 COVO 登入頁面 - 電影級 GSAP 入場暨卡片 3D 磁性物理交互引擎
 * 100% 獨立隔離，完全不改動、不干擾 Angular 原本的任何組件變更檢測與登入 API 功能！
 */
export function startLoginSatinEffect(container, zone) {
  if (!container) return { destroy: () => {} };

  // 1. 🚀【CORE ENTRY ANIMATIONS】：全域電影級高奢登場動畫軸
  // /* ENTRY */ 卡片與文字優雅浮現
  gsap.fromTo(container.querySelectorAll(".login-card"), 
    { y: 60, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", overwrite: "auto" }
  );

  gsap.fromTo(container.querySelectorAll(".login-title .char"),
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, stagger: 0.12, delay: 0.2, duration: 1, ease: "power4.out" }
  );

  gsap.fromTo(container.querySelectorAll(".login-subtitle"),
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, delay: 0.5, duration: 1, ease: "power4.out" }
  );

  // /* WATERMARK DRIFT */ 巨幅字體視差甩動
  gsap.fromTo(container.querySelectorAll(".login-watermark"),
    { y: 0, x: 0 },
    { y: -20, x: 10, duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut", overwrite: "auto" }
  );

  // /* COLOR SPLASH FLOAT */ 背景有機藝術光暈
  gsap.fromTo(container.querySelectorAll(".color-splash"),
    { x: 0, y: 0, scale: 1 },
    { x: 20, y: 20, scale: 1.1, duration: 12, repeat: -1, yoyo: true, ease: "sine.inOut", overwrite: "auto" }
  );

  // 2. 🚀【MAGNETIC INTERACTION】：隔離在 Angular 執行緒之外的 3D 卡片磁性懸浮
  let mouseMoveListener;
  let mouseLeaveListener;

  zone.runOutsideOutside || zone.runOutsideAngular(() => {
    mouseMoveListener = (e) => {
      // 動態偵測卡片，完美支援 Step 1 與 Step 2 (2FA 驗證碼) 切換時的節點刷新
      const card = container.querySelector(".login-card");
      if (!card) return;

      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;

      // 當滑鼠超出卡片大範圍（如拉開到450像素外），平滑回正，防止全域拉扯
      const distance = Math.sqrt(x * x + y * y);
      if (distance > 450) {
        gsap.to(card, { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.8, ease: "power3.out", overwrite: "auto" });
        return;
      }

      gsap.to(card, {
        x: x * 0.08,
        y: y * 0.08,
        rotateX: -y * 0.03,
        rotateY: x * 0.03,
        duration: 0.6,
        ease: "power3.out",
        overwrite: "auto"
      });
    };

    mouseLeaveListener = () => {
      const card = container.querySelector(".login-card");
      if (!card) return;

      gsap.to(card, {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 0.8,
        ease: "power4.out",
        overwrite: "auto"
      });
    };

    container.addEventListener("mousemove", mouseMoveListener);
    container.addEventListener("mouseleave", mouseLeaveListener);
  });

  // 返回清理接口，防止路由切換時產生監聽器殘留
  return {
    destroy: () => {
      if (container) {
        container.removeEventListener("mousemove", mouseMoveListener);
        container.removeEventListener("mouseleave", mouseLeaveListener);
      }
    }
  };
}