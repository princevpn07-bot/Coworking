import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FloatingHeader } from '../../../shared/floating-header/floating-header';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink,FloatingHeader],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  currentSlide = 0;
  totalSlides = 3; // 🔒 剛性維持原汁原味 3 幕長軌道布局，排版 0 跑位！
  slideInterval: any;

  private lenis?: Lenis;
  private tickerHandler?: (time: number) => void;

  private isShaderVisible = false;

  isVideoPlaying = false;
  isFloatingVisible = false;
  scrollPercentage = 0;
  private userManuallyPaused = false;

  private prefaceStartFrame = 1;
  private prefaceEndFrame = 60;
  private prefaceSpeed = 0.15;
  private prefaceCurrentFrame = 0;
  private prefaceDirection = 1;
  private lastPrefaceFrame = -1;

  private lastLiquidIntensity = -1;
  private lastMatrixValue = '';

  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 0 };
  private mouseMoveListener?: (e: MouseEvent) => void;

  // 10張圓環卡片專屬變數
  private scrollRotation = { value: 0 };
  private entranceFactor = { value: 0 };
  private idleRotation = 0;
  hoveredIndex: number | null = null;

  private trajectories = [
    { from: { x: '-45vw', y: '-40vh', rX: 65,  rY: -30, rZ: -90, s: 0.3 } },
    { from: { x: '45vw',  y: '-35vh', rX: -45, rY: 60,  rZ: 130, s: 0.2 } },
    { from: { x: '-40vw', y: '45vh',  rX: 35,  rY: -50, rZ: -70, s: 0.3 } },
    { from: { x: '40vw',  y: '40vh',  rX: -60, rY: 35,  rZ: 95,  s: 0.2 } },
    { from: { x: '-50vw', y: '5vh',   rX: 15,  rY: 45,  rZ: -45, s: 0.4 } },
    { from: { x: '55vw',  y: '-5vh',  rX: -25, rY: -45, rZ: 65,  s: 0.3 } },
    { from: { x: '-10vw', y: '-50vh', rX: -70, rY: 15,  rZ: -110,s: 0.2 } },
    { from: { x: '15vw',  y: '50vh',  rX: 50,  rY: -15, rZ: 85,  s: 0.3 } },
    { from: { x: '-30vw', y: '-45vh', rX: 40,  rY: -20, rZ: -25, s: 0.3 } },
    { from: { x: '35vw',  y: '45vh',  rX: -30, rY: 40,  rZ: 55,  s: 0.2 } }
  ];

  @ViewChild('pinContainer') pinContainer!: ElementRef;
  @ViewChild('scrollWrapper') scrollWrapper!: ElementRef;
  @ViewChild('imageCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroVideo') heroVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('prefaceCanvas') prefaceCanvasRef!: ElementRef<HTMLCanvasElement>;

  private prefaceImages: HTMLImageElement[] = [];
  private prefaceFrameCount = 60;
  private images: HTMLImageElement[] = [];
  private frameCount = 300;

 constructor(private el: ElementRef, private zone: NgZone) {}

  ngOnInit() {
    this.slideInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    }, 5000);
  }

  ngAfterViewInit() {
   this.initSmoothScroll();
    this.initHeroCanvasEngine();
    this.initHorizontalScroll();
    this.initPhilosophyAnimation();
    this.initRentalPlansAnimation();
    this.initAmenitiesAnimation();   // 🚀【全量復原】：極致細節無憂辦公大視差彈跳引擎完美看守！
    this.initNetworkAnimation();     // 🚀【全量追加】：底部全球網絡雙向彈跳視差引擎就位！
    this.initTextRevealAnimation();  // 🚀【唯一新增點火】：全域文字滾動掃描揭露雷達啟動！
    this.prepareTypewriterTexts();

    setTimeout(() => {
      this.initBackgroundShaderEngine();
      ScrollTrigger.refresh();
    }, 200);
  }
// 🚀【唯一全新追加方法】：基於 Scroll 滾動進場的文字不規則大光圈掃描揭露特效
  private initTextRevealAnimation() {
    const nativeElement = this.el.nativeElement;
    const targets = nativeElement.querySelectorAll('.reveal-text');

    targets.forEach((text: any) => {
      gsap.fromTo(text,
        { opacity: 0, y: 32, filter: 'blur(8px)' }, // 初始埋入相機散景模糊與位移
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)', // 流暢清洗回正清晰
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: text,
            start: 'top 88%', // 滑入螢幕 88% 的黃金刻度時點火
            toggleActions: 'play reverse play reverse' // 🔒 雙向看守，回滑時自動消隱
          }
        }
      );
    });
  }
  toggleVideo(event: Event) {
    event.stopPropagation();
    const video = this.heroVideoRef?.nativeElement;
    if (!video) return;

    // 🔒 剛性上鎖：強制視訊完全靜音，去聲處理
    video.muted = true;

    if (video.paused) {
      this.isVideoPlaying = true;
      video.play().then(() => {
        this.userManuallyPaused = false;
      }).catch(err => {
        console.log('視訊播放受阻:', err);
        this.isVideoPlaying = false;
      });
    } else {
      video.pause();
      this.isVideoPlaying = false;
      this.userManuallyPaused = true;
    }
  }

  onVideoMouseEnter() {
    const video = this.heroVideoRef?.nativeElement;
    if (video && video.paused && !this.isVideoPlaying && !this.userManuallyPaused) {
      video.muted = true; // 🔒 剛性上鎖靜音
      this.isVideoPlaying = true;
      video.play().catch(() => {
        this.isVideoPlaying = false;
      });
    }
  }

  private updateHero3DParallax() {
    const nativeElement = this.el.nativeElement;
    const slidesWrapper = nativeElement.querySelector('.hero-slides-wrapper') as HTMLElement | null;

    if (!slidesWrapper) return;
    const scrollAmount = slidesWrapper.scrollWidth - window.innerWidth;
    if (this.lenis && this.lenis.scroll > (scrollAmount + 1500)) return;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const rotateY = this.mouse.x * 6;
    const rotateX = -this.mouse.y * 4;
    const moveX = this.mouse.x * 15;
    const moveY = this.mouse.y * 15;

    gsap.set(canvas, {
      rotationY: rotateY,
      rotationX: rotateX,
      x: moveX,
      y: moveY,
      scale: 1.04
    });

    const heroContent = nativeElement.querySelector('.hero-slide:first-child .hero-slide-content') as HTMLElement | null;
    if (heroContent) {
      gsap.set(heroContent, {
        x: this.mouse.x * -20,
        y: this.mouse.y * -12,
        z: 45,
        transformPerspective: 1000
      });
    }

    const slidesElements = nativeElement.querySelectorAll('.hero-slide');
    const secondSlide = slidesElements[1] as HTMLElement | undefined;
    if (secondSlide) {
      const secondSlideContent = secondSlide.querySelector('.hero-slide-content') as HTMLElement | null;
      const playBtnUI = secondSlide.querySelector('.video-ui-play-btn') as HTMLElement | null;

      if (secondSlideContent) {
        gsap.set(secondSlideContent, {
          x: this.mouse.x * -15,
          y: this.mouse.y * -10,
          z: 50,
          transformPerspective: 1000
        });
      }

      if (playBtnUI) {
        gsap.set(playBtnUI, {
          xPercent: -50,
          yPercent: -50,
          x: this.mouse.x * 25,
          y: this.mouse.y * 18,
          z: 70,
          transformPerspective: 1000
        });
      }
    }
  }

  private initBackgroundShaderEngine() {
    const canvas = this.prefaceCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 1920 * dpr;
    canvas.height = 1080 * dpr;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const targetSection = this.pinContainer?.nativeElement;
    if (!targetSection) return;

    for (let i = 0; i < this.prefaceFrameCount; i++) {
      const img = new Image();
      const paddedIndex = String(i).padStart(5, '0');
      img.src = `assets/Leaves swaying/Leaves swaying_${paddedIndex}.webp`;
      this.prefaceImages.push(img);
    }

    this.prefaceImages[this.prefaceStartFrame].onload = () => {
      ctx.save(); ctx.scale(dpr, dpr);
      ctx.drawImage(this.prefaceImages[this.prefaceStartFrame], 0, 0, 1920, 1080);
      ctx.restore();
    };

    ScrollTrigger.create({
      trigger: targetSection,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self: ScrollTrigger) => {
        this.isShaderVisible = self.isActive;
      }
    });
// 🚀【效能提升】：將高頻滑鼠監聽移出 Angular 監測區，阻斷全域重繪
    this.zone.runOutsideAngular(() => {
    this.mouseMoveListener = (e: MouseEvent) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', this.mouseMoveListener);
  });
  }

  private updateBackgroundShaderLoop() {
    if (!this.isShaderVisible) return;

    const canvas = this.prefaceCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displacementMap = document.getElementById('glsl-displacement');
    const colorMatrix = document.getElementById('glsl-chromatic');

    this.prefaceCurrentFrame += this.prefaceSpeed * this.prefaceDirection;
    if (this.prefaceCurrentFrame >= this.prefaceEndFrame) {
      this.prefaceCurrentFrame = this.prefaceEndFrame; this.prefaceDirection = -1;
    } else if (this.prefaceCurrentFrame <= this.prefaceStartFrame) {
      this.prefaceCurrentFrame = this.prefaceStartFrame; this.prefaceDirection = 1;
    }

    gsap.set(canvas, { rotationY: this.mouse.x * 5, rotationX: -this.mouse.y * 3, x: this.mouse.x * 20, y: this.mouse.y * 20, scale: 1.05 });

    // 🚀【核心重構】：引進微小變動閾值過濾，阻斷 SVG 圖形樹每幀高頻重新繪製引起的效能雪崩
    if (displacementMap) {
      const liquidIntensity = Math.round(Math.min(this.mouse.speed * 100, 45));
      if (Math.abs(liquidIntensity - this.lastLiquidIntensity) > 1.5) {
        displacementMap.setAttribute('scale', liquidIntensity.toString());
        this.lastLiquidIntensity = liquidIntensity;
      }
    }

    if (colorMatrix) {
      const chromIntensity = Math.min(this.mouse.speed * 0.25, 0.1);
      const matrixValue = ` 1 0 0 ${chromIntensity.toFixed(4)} 0 0 1 0 0 0 0 0 1 ${(-chromIntensity).toFixed(4)} 0 0 0 0 1 0 `;
      if (matrixValue !== this.lastMatrixValue) {
        colorMatrix.setAttribute('values', matrixValue);
        this.lastMatrixValue = matrixValue;
      }
    }

    const index = Math.floor(this.prefaceCurrentFrame);
    if (index !== this.lastPrefaceFrame) {
      if (this.prefaceImages[index] && this.prefaceImages[index].complete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save(); ctx.scale(dpr, dpr);
        ctx.drawImage(this.prefaceImages[index], 0, 0, 1920, 1080);
        ctx.restore();
        this.lastPrefaceFrame = index;
      }
    }
  }

  private initHeroCanvasEngine() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 1920 * dpr; canvas.height = 1080 * dpr;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

    const nativeElement = this.el.nativeElement;
    const slidesWrapper = nativeElement.querySelector('.hero-slides-wrapper') as HTMLElement | null;
    const titleNode = nativeElement.querySelector('.hero-title') as HTMLElement | null;
    const subtitleNode = nativeElement.querySelector('.hero-subtitle') as HTMLElement | null;
    const searchBarNode = nativeElement.querySelector('.search-bar') as HTMLElement | null;

    if (!slidesWrapper || !titleNode) return;

    // 🚀【分排非同步延遲優化】：先初始化快取前 30 幀，防範 300 張 WebP 瞬間併發連線癱瘓瀏覽器管道
    const initialWarmFrames = 30;

    for (let i = 0; i < this.frameCount; i++) {
      const img = new Image();
      if (i < initialWarmFrames) {
      const paddedIndex = String(i).padStart(5, '0');
      img.src = `assets/office_light2/office_light_${paddedIndex}.webp`;
    }
      this.images.push(img);
    }
    // 首幕完成渲染後，空閒時間偷偷在後台補齊剩餘 270 張序列圖片
    setTimeout(() => {
      for (let i = initialWarmFrames; i < this.frameCount; i++) {
        const paddedIndex = String(i).padStart(5, '0');
        this.images[i].src = `assets/office_light2/office_light_${paddedIndex}.webp`;
      }
    }, 1200);

    // 🔒 雙開門初始合攏面狀態看守
    gsap.set('.left-door', { xPercent: 0 });
    gsap.set('.right-door', { xPercent: 0 });
    gsap.set('.gate-text-l', { x: 0, opacity: 1 });
    gsap.set('.gate-text-r', { x: 0, opacity: 1 });

    // 🔒 鏡頭初始清晰看守：確保網頁逆向回滑時，Canvas 濾鏡能完美重設清晰度
    if (canvas) gsap.set(canvas, { filter: 'blur(0px)' });

    this.images[0].onload = () => {
      ctx.save(); ctx.scale(dpr, dpr);
      ctx.drawImage(this.images[0], 0, 0, 1920, 1080);
      ctx.restore();
    };

    const rawText = titleNode.innerText || '';
    titleNode.innerHTML = '';
    [...rawText].forEach(char => {
      const span = document.createElement('span'); span.innerText = char; span.style.display = 'inline-block'; span.className = 'hero-scroll-char'; titleNode.appendChild(span);
    });
    const chars = nativeElement.querySelectorAll('.hero-scroll-char');

    if (subtitleNode) {
      const rawSubText = subtitleNode.innerText || ''; subtitleNode.innerHTML = '';
      [...rawSubText].forEach(char => {
        const span = document.createElement('span'); span.innerText = char; span.style.display = 'inline-block'; span.className = 'hero-subtitle-char'; if (char === ' ') span.innerHTML = '&nbsp;'; subtitleNode.appendChild(span);
      });
    }
    const subChars = nativeElement.querySelectorAll('.hero-subtitle-char');

    gsap.set(chars, { opacity: 0.05, y: 15, filter: 'blur(12px)' });
    if (subChars.length > 0) gsap.set(subChars, { opacity: 0.05, y: 10, filter: 'blur(8px)' });
    if (searchBarNode) gsap.set(searchBarNode, { opacity: 0, y: 25, scale: 0.97 });

    const getScrollAmount = () => { return slidesWrapper.scrollWidth - window.innerWidth; };

    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: () => `+=${getScrollAmount() + 2000}`,
        pin: true,
        scrub: 0.5,
        invalidateOnRefresh: true
      }
    });

    // 🎬【滾輪側開門核心段】：隨滾輪向下，左右門扉向兩側分開，COVO 完美撕裂滑開！
    masterTl.fromTo('.left-door', { xPercent: 0 }, { xPercent: -101, ease: 'power2.inOut', duration: 0.5 }, 0);
    masterTl.fromTo('.right-door', { xPercent: 0 }, { xPercent: 101, ease: 'power2.inOut', duration: 0.5 }, 0);
    masterTl.fromTo('.gate-text-l', { x: 0, opacity: 1 }, { x: -160, opacity: 0, ease: 'power2.inOut', duration: 0.5 }, 0);
    masterTl.fromTo('.gate-text-r', { x: 0, opacity: 1 }, { x: 160, opacity: 0, ease: 'power2.inOut', duration: 0.5 }, 0);

    masterTl.fromTo(slidesWrapper,
      { opacity: 0 },
      { opacity: 1, ease: 'none', duration: 0.4 },
      0
    );

    const frameData = { frame: 0 };
    masterTl.to(frameData, {
      frame: this.frameCount - 1,
      ease: 'none',
      duration: 2.0,
      onUpdate: () => {
        const index = Math.floor(frameData.frame);
        if (this.images[index] && this.images[index].complete) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save(); ctx.scale(dpr, dpr);
          ctx.drawImage(this.images[index], 0, 0, 1920, 1080);
          ctx.restore();
        }
      }
    }, 0);

    if (chars.length > 0) masterTl.to(chars, { opacity: 1, y: 0, filter: 'blur(0px)', stagger: { amount: 0.45 }, ease: 'power1.inOut', duration: 0.4 }, 0.05);
    if (subChars.length > 0) masterTl.to(subChars, { opacity: 1, y: 0, filter: 'blur(0px)', stagger: { amount: 0.4 }, ease: 'power1.inOut', duration: 0.4 }, 0.45);
    if (searchBarNode) masterTl.to(searchBarNode, { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.4 }, 0.75);

    // 🚀【核心優化】：讓第一幕圖片序列快要播放完畢時（時間軸 1.4s 處），就提早點火點燃橫向推移，達成高級交疊大視差過渡！
    masterTl.to(slidesWrapper, { x: () => -getScrollAmount(), ease: 'power2.inOut', duration: 2.0 }, 1.4);

    const slidesNodeList = nativeElement.querySelectorAll('.hero-slide');
    const slide1 = slidesNodeList[1] as HTMLElement | undefined;
    if (slide1) {
      const secondBg = slide1.querySelector('.hero-bg') as HTMLElement | null;
      const secondMedia = slide1.querySelector('.hero-bg video') as HTMLVideoElement | null;
      const secondContent = slide1.querySelector('.hero-slide-content') as HTMLElement | null;

      // 🌌【真·電影級大光圈焦距過渡】：在 1.4s ～ 3.2s 滑移期間，為 Canvas 圖片序列注入非對稱大景深模糊轉場
      // 圖片一邊橫向視差滑開、一邊由清晰平滑暈染成 24px 散景迷霧，完全消隱分界硬線，空間穿透感極強！
      if (canvas) {
        masterTl.fromTo(canvas,
          { x: 0, scale: 1.04, opacity: 1, filter: 'blur(0px)' },
          { x: 180, scale: 1.14, opacity: 0.05, filter: 'blur(24px)', ease: 'power2.inOut', duration: 1.8 },
          1.4
        );
      }

      // 第二幕視訊卡片隨時間軸刻度提早交疊展開 (配合 1.4s 推移，從原來的 2.4s 提前至 1.8s)
      if (secondBg && secondMedia) {
        if (secondMedia) secondMedia.muted = true; // 🔒 確保影片節點原生完全靜音上鎖，絕不產生聲音

        masterTl.fromTo(secondBg,
          { width: '84vw', height: '78vh', top: '11vh', left: '8vw', borderRadius: '24px' },
          { width: '100vw', height: '100vh', top: '0vh', left: '0vw', borderRadius: '0px', boxShadow: 'none', ease: 'power2.inOut', duration: 0.6 },
          1.8
        );

        // 🌌 將影片本體的橫向錯流對流與 Canvas 結合，製造無界限的絲滑浮現
        masterTl.fromTo(secondMedia,
          { xPercent: 32, scale: 1.25 },
          { xPercent: 0, scale: 1.00, ease: 'power2.inOut', duration: 0.6 },
          1.8
        );
      }
      if (secondContent) {
        masterTl.fromTo(secondContent,
          { opacity: 0, y: 40, filter: 'blur(10px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', ease: 'power2.out', duration: 0.3 },
          2.0
        );
      }

      // 離開第二幕收縮卡片 (對齊提早的時鐘刻度，由原先 3.4s 提前至 2.8s)
      if (secondBg && secondMedia) {
        masterTl.to(secondBg, {
          width: '84vw', height: '78vh', top: '11vh', left: '8vw',
          borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
          ease: 'power2.inOut', duration: 0.6
        }, 2.8);
        masterTl.to(secondMedia, { scale: 1.15, ease: 'power2.inOut', duration: 0.6 }, 2.8);
      }
      if (secondContent) {
        masterTl.to(secondContent, { opacity: 0, y: -40, filter: 'blur(10px)', ease: 'power2.in', duration: 0.3 }, 2.8);
      }
    }
  }

private initHorizontalScroll() {
    const container = this.pinContainer?.nativeElement;
    const wrapper = this.scrollWrapper?.nativeElement;
    if (!container || !wrapper) return;

    const getScrollAmount = () => { return wrapper.scrollWidth - window.innerWidth; };

    // 🚀【重鑄複合式橫向滾動時間軸】：實現前景橫向 wrapper 與背景巨幅長軌道大字體的非對稱對流大視差！
    const horizontalTl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        pin: true,
        scrub: 1,
        start: 'top top',
        end: () => `+=${getScrollAmount()}`,
        invalidateOnRefresh: true
      }
    });

    horizontalTl.to(wrapper, { x: () => -getScrollAmount(), ease: 'none' }, 0);
    // 🚀【背景大字體巨幅視差核心】：背景大字僅移動 35% 的橫向位移，使其速度遠慢於前景卡片，震撼拉開空間層次！
    horizontalTl.to('.horizontal-bg-typography', { x: () => -getScrollAmount() * 0.35, ease: 'none' }, 0);

    // 🚀【鼠標感應 3D 微傾斜與滑鼠吸附式文字動態完美整合】
    const cards = container.querySelectorAll('.horizontal-card');
    cards.forEach((card: any) => {
      const imageBox = card.querySelector('.image-box');
      const h3 = card.querySelector('h3');
      const loc = card.querySelector('.location');
      if (!imageBox) return;

      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        // 精密計算游標相對於卡片幾何中心的百分比位置 (-0.5 ~ 0.5)
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        // 1. 卡片主體 3D 精密微傾斜
        gsap.to(imageBox, {
          y: -12,              // 完美咬合原 CSS 懸停升起特效，絕不打架
          rotationY: x * 10,   // 3D 左右精密偏擺
          rotationX: -y * 10,  // 3D 上下精密偏擺
          transformPerspective: 1000,
          ease: 'power2.out',
          duration: 0.3,
          overwrite: 'auto'
        });

        // 2. 🚀【滑鼠吸附式文字動態 (Magnetic Glue)】
        // 當滑鼠靠近卡片時，文字層產生高階阻尼吸附引力，朝游標座標平滑漂移，展現強烈撕裂景深
        if (h3 && loc) {
          gsap.to([h3, loc], {
            x: x * 26,
            y: y * 16,
            ease: 'power2.out',
            duration: 0.4,
            overwrite: 'auto'
          });
        }
      });

      card.addEventListener('mouseleave', () => {
        // 卡片框架回正
        gsap.to(imageBox, {
          y: 0,
          rotationY: 0,
          rotationX: 0,
          ease: 'power2.out',
          duration: 0.5,
          overwrite: 'auto'
        });

        // 🚀【文字 Q 彈物理慣性回彈】：利用慣性彈簧曲線平滑回歸初始位置，手感極度絲滑
        if (h3 && loc) {
          gsap.to([h3, loc], {
            x: 0,
            y: 0,
            ease: 'back.out(1.5)',
            duration: 0.6,
            overwrite: 'auto'
          });
        }
      });
    });

    const nativeElement = this.el.nativeElement;
    const slidesList = nativeElement.querySelectorAll('.hero-slide');
    const secondSlide = slidesList[1] as HTMLElement | undefined;

    if (secondSlide) {
      const secondBg = secondSlide.querySelector('.hero-bg') as HTMLElement | null;
      const secondContent = secondSlide.querySelector('.hero-slide-content') as HTMLElement | null;
      const playBtnUI = secondSlide.querySelector('.video-ui-play-btn') as HTMLElement | null;

      if (secondBg) {
        gsap.to(secondBg, {
          y: '35vh', z: -250, rotationX: -12, opacity: 0.1, ease: 'none',
          scrollTrigger: { trigger: container, start: 'top bottom', end: 'top top', scrub: true }
        });
      }
      if (secondContent) {
        gsap.to(secondContent, {
          y: '-45vh', z: 150, rotationX: 15, opacity: 0, ease: 'none',
          scrollTrigger: { trigger: container, start: 'top bottom', end: 'top center', scrub: true }
        });
      }
      if (playBtnUI) {
        gsap.to(playBtnUI, {
          y: '-30vh', z: 220, opacity: 0, ease: 'none',
          scrollTrigger: { trigger: container, start: 'top bottom', end: 'top center', scrub: true }
        });
      }
    }

    const horizontalIntro = container.querySelector('.horizontal-intro') as HTMLElement | null;
    const horizontalGrid = container.querySelector('.horizontal-grid') as HTMLElement | null;

    if (horizontalIntro) {
      gsap.fromTo(horizontalIntro,
        { y: 180, z: -100, rotationX: 15, opacity: 0, transformPerspective: 2000 },
        { y: 0, z: 0, rotationX: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: container, start: 'top bottom', end: 'top center', scrub: true } }
      );
    }
    if (horizontalGrid) {
      gsap.fromTo(horizontalGrid,
        { y: 260, z: -60, rotationY: -10, opacity: 0.1, transformPerspective: 2000 },
        { y: 0, z: 0, rotationY: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: container, start: 'top bottom', end: 'top top', scrub: true } }
      );
    }
  }
  // ==========================================================================
  // 🔒 策展理念區段：🔒 原汁原味完美留存你的核心數字 (scrub: 1.5, progress * 180) 絕不改動
  // ==========================================================================
  private initPhilosophyAnimation() {
    const nativeElement = this.el.nativeElement;
    const section = nativeElement.querySelector('.philosophy');
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=5500',
        pin: true,
        scrub: 2, // 🔒 完美留存
        invalidateOnRefresh: true,
        onUpdate: (self: ScrollTrigger) => { this.scrollRotation.value = self.progress *130; } // 🔒 完美留存
      }
    });

    tl.to(section, {
      backgroundColor: '#0e0e10',
      boxShadow: '0 -30px 60px rgba(0, 0, 0, 0.4)',
      ease: 'expo.out',
      duration: 0.08
    });

    tl.to(this.entranceFactor, { value: 1, ease: 'power2.out', duration: 0.55 });
    tl.to({}, { duration: 0.55 });
    tl.to(this.entranceFactor, { value: 0, ease: 'power2.in', duration: 0.60 });

    tl.to(section, {
      backgroundColor: '#ffffff', // 🔒 完美留存全白底色
      boxShadow: '0 -30px 60px rgba(0, 0, 0, 0)',
      ease: 'power2.out',
      duration: 0.18
    });
  }

  private initRentalPlansAnimation() {
    const nativeElement = this.el.nativeElement;
    const section = nativeElement.querySelector('.rental-plans');
    if (!section) return;

    const cards = section.querySelectorAll('.visual-plan-card');
    const header = section.querySelector('.section-header');

    if (header) {
      gsap.fromTo(header,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }

    if (cards.length > 0) {
      gsap.fromTo(cards,
        { y: 320, scale: 0.7, opacity: 0, rotationX: 25, z: -400 },
        {
          y: 0, scale: 1, opacity: 1, rotationX: 0, z: 0,
          duration: 1.2,
          ease: 'back.out(1.8)',
          stagger: 0.18,
          transformPerspective: 1200,
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );

      cards.forEach((card: any) => {
        const img = card.querySelector('.card-image-box img');
        if (img) {
          gsap.fromTo(img,
            { yPercent: -18 },
            {
              yPercent: 18, ease: 'none',
              scrollTrigger: {
                trigger: card,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
              }
            }
          );
        }
      });
    }
  }

  // ==========================================================================
  // 🔒【原汁原味全量復原】：極致細節無憂辦公 雙向 Back 彈跳登場與滾動 Scrub
  // ==========================================================================
  private initAmenitiesAnimation() {
    const nativeElement = this.el.nativeElement;
    const section = nativeElement.querySelector('.amenities');
    if (!section) return;

    const header = section.querySelector('.section-header-left');
    const items = section.querySelectorAll('.amenity-item');
    const rightImgBox = section.querySelector('.amenities-right-image-box');
    const img = section.querySelector('.amenities-right-image-box img');

    if (header) {
      gsap.fromTo(header,
        { y: 60, opacity: 0, z: -100 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }

    if (items.length > 0) {
      gsap.fromTo(items,
        { y: 280, scale: 0.75, opacity: 0, rotationX: 20, z: -300 },
        {
          y: 0, scale: 1, opacity: 1, rotationX: 0, z: 0,
          duration: 1.1,
          ease: 'back.out(1.6)', // 🚀 注入原裝黃金彈跳力道
          stagger: 0.12,         // 🚀 原裝錯開 120 毫秒
          transformPerspective: 1200,
          scrollTrigger: {
            trigger: section,
            start: 'top 72%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }

    if (rightImgBox) {
      gsap.fromTo(rightImgBox,
        { x: 120, opacity: 0, scale: 0.9, rotationY: 15 },
        {
          x: 0, opacity: 1, scale: 1, rotationY: 0,
          duration: 1.3,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }

    if (img) {
      gsap.fromTo(img,
        { yPercent: -15 },
        {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true // 🚀 圖片緊咬滾輪，製造極強的 3D 穿透視差
          }
        }
      );
    }
  }

  // ==========================================================================
  // 🔒【原汁原味全量復原】：全球網絡 雙向鏡像 Back 彈跳登場與滾動 Scrub
  // ==========================================================================
 private initNetworkAnimation() {
    const nativeElement = this.el.nativeElement;
    const section = nativeElement.querySelector('.network');
    if (!section) return;

    const header = section.querySelector('.section-header');
    const regions = section.querySelectorAll('.region');

    // 1. 全球網絡標題升起過渡（雙向反轉完美咬合）
    if (header) {
      gsap.fromTo(header,
        { y: 60, opacity: 0, z: -80 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }

    // 2. 三大洲板塊：Stagger 階梯式點火 + Back.out 雙向立體彈跳
    if (regions.length > 0) {
      gsap.fromTo(regions,
        { y: 220, scale: 0.8, opacity: 0, rotationX: 15, z: -200 },
        {
          y: 0, scale: 1, opacity: 1, rotationX: 0, z: 0,
          duration: 1.2,
          ease: 'back.out(1.5)', // 🚀 注入與無憂辦公同等規格的黃金回彈慣性
          stagger: 0.15,         // 🚀 各大洲區塊錯開 150 毫秒跳躍顯影
          transformPerspective: 1200,
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }
  }

  onCardMouseEnter(index: number) {
    this.hoveredIndex = index;
    const nativeElement = this.el.nativeElement;
    const card = nativeElement.querySelectorAll('.floating-card')[index] as HTMLElement | undefined;
    if (card) {
      const chars = card.querySelectorAll('.char');
      gsap.fromTo(chars, { opacity: 0, y: 10, filter: 'blur(4px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', delay: 0.05, stagger: 0.03, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
    }
  }

  onCardMouseLeave() { this.hoveredIndex = null; }

  private prepareTypewriterTexts() {
    const nativeElement = this.el.nativeElement;
    const boxes = nativeElement.querySelectorAll('.hover-description-box p');
    boxes.forEach((p: any) => {
      const text = p.innerText; p.innerHTML = '';
      [...text].forEach(char => {
        const span = document.createElement('span'); span.innerText = char; span.className = 'char'; span.style.display = 'inline-block'; span.style.opacity = '0'; p.appendChild(span);
      });
    });
  }

  private updateCardsWheel() {
    const nativeElement = this.el.nativeElement;
    const cards = nativeElement.querySelectorAll('.floating-card');
    if (cards.length === 0) return;

    this.idleRotation += 0.15;
    const totalRotation = this.scrollRotation.value + this.idleRotation;
    const radius = window.innerWidth > 768 ? 340 : 170;
    const factor = this.entranceFactor.value;

    cards.forEach((card: any, index: number) => {
      const m = this.trajectories[index]; if (!m) return;
      const baseAngle = index * (360 / cards.length); const totalAngle = baseAngle + totalRotation; const angleRad = totalAngle * (Math.PI / 180);
      const targetX = Math.cos(angleRad) * radius; const targetY = Math.sin(angleRad) * radius;
      const fromXpx = (parseFloat(m.from.x) / 100) * window.innerWidth; const fromYpx = (parseFloat(m.from.y) / 100) * window.innerHeight;
      const currentX = fromXpx + (targetX - fromXpx) * factor; const currentY = fromYpx + (targetY - fromYpx) * factor;
      const currentScale = m.from.s + (1.0 - m.from.s) * factor; const currentOpacity = 0 + (1.0 - 0) * factor;
      const depthBlur = ((radius - targetY) / (radius * 2)) * 2.8; const entryBlur = 12 * (1 - factor); let totalBlur = entryBlur + (depthBlur * factor);
      const isHovered = this.hoveredIndex === index; const finalScale = isHovered ? currentScale * 1.15 : currentScale; if (isHovered) { totalBlur = 0; }
      gsap.set(card, { x: currentX, y: currentY, scale: finalScale, opacity: currentOpacity, zIndex: isHovered ? 999 : 3 });
      const inner = card.querySelector('.card-inner') as HTMLElement | null; if (inner) { gsap.set(inner, { rotationZ: totalAngle + 90, rotationX: 18, rotationY: -8 }); }
      const cardImg = card.querySelector('img') as HTMLElement | null; if (cardImg) { gsap.set(cardImg, { filter: `blur(${totalBlur}px)` }); }
    });

    const centerText = nativeElement.querySelector('.philosophy-center-text') as HTMLElement | null;
    if (centerText) {
      const breathingPulse = 1 + Math.sin(gsap.ticker.frame * 0.04) * 0.02;
      const currentScale = (0.75 + (1.0 - 0.75) * factor) * breathingPulse; const currentOpacity = 0 + (1.0 - 0) * factor; const currentBlur = 15 * (1 - factor);
      gsap.set(centerText, { scale: currentScale, opacity: currentOpacity, filter: `blur(${currentBlur}px)` });
    }
  }

  private initSmoothScroll() {
    // 🚀【全域動態效能點火】：將高阻尼滾動主核心、每幀更新循環（Ticker）、自動撥放判定完全包裹在 runOutsideAngular 中，阻斷 Angular 進行每秒數百次無意義的全網頁檢查
    this.zone.runOutsideAngular(() => {
    this.lenis = new Lenis({ duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });

    this.tickerHandler = (time: number) => {
      this.lenis?.raf(time * 1000);

      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;
      const dx = this.mouse.targetX - this.mouse.x;
      const dy = this.mouse.targetY - this.mouse.y;
      this.mouse.speed = Math.sqrt(dx * dx + dy * dy);

      this.updateCardsWheel();
      this.updateBackgroundShaderLoop();
      this.updateHero3DParallax();

      const slidesList = this.el.nativeElement.querySelectorAll('.hero-slide');
      const secondSlide = slidesList[1] as HTMLElement | undefined;
      const targetVideo = this.heroVideoRef?.nativeElement;

      if (secondSlide && targetVideo) {
        const rect = secondSlide.getBoundingClientRect();
        const isVisible = rect.right > 0 && rect.left < window.innerWidth;
        const isInAutoplayZone = rect.left < window.innerWidth * 0.50 && rect.right > window.innerWidth * 0.10;
          if (isInAutoplayZone) {
            if (!this.isVideoPlaying && !this.userManuallyPaused) {
              // 🚀 僅在 UI 狀態切換的關鍵節點，才返回 Zone 內觸發變更偵測，大幅釋放 CPU 壓力
              this.zone.run(() => { this.isVideoPlaying = true; });
              targetVideo.play().catch((err) => {
                console.log('自動點火受阻:', err);
                this.zone.run(() => { this.isVideoPlaying = false; });
            });
          }
        } else {
          if ((rect.left > window.innerWidth * 0.35 || !isVisible) && this.isVideoPlaying) {
            targetVideo.pause();
            this.isVideoPlaying = false;
          }
        }

        if (!isVisible) {
          this.userManuallyPaused = false;
        }
      }
    };

    // 🛠️【修復 VS Code 2774 警告】：移除原本有語法瑕疵的 ternary 判斷式，精密直接注入 high-frequency ticker 監聽
    gsap.ticker.add(this.tickerHandler);
    gsap.ticker.lagSmoothing(0);

    this.lenis.on('scroll', () => {
      ScrollTrigger.update();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      // 🚀 【即時點火】：每次滾動時，只要超過 200px（避開最頂部的 Cinematic Gate 大門間距），膠囊立刻進場
 // 精密計算膠囊進場與滾動進度條
        const nextFloatingVisible = scrollTop > 100;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const nextScrollPercentage = docHeight > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100))) : 0;

        // 🚀 優化防線：只有當畫面綁定變數真正發生狀態扭轉時，才導流回 Angular 區域內，避免滾動時後台瘋狂空轉
        if (this.isFloatingVisible !== nextFloatingVisible || this.scrollPercentage !== nextScrollPercentage) {
          this.zone.run(() => {
            this.isFloatingVisible = nextFloatingVisible;
            this.scrollPercentage = nextScrollPercentage;
      });
        }
      });
    });
  }
  ngOnDestroy() {
    if (this.slideInterval) clearInterval(this.slideInterval);
    if (this.tickerHandler) { gsap.ticker.remove(this.tickerHandler); }
    window.removeEventListener('mousemove', this.mouseMoveListener!);
    this.lenis?.destroy();
    ScrollTrigger.getAll().forEach((trigger: ScrollTrigger) => trigger.kill());
  }
}
