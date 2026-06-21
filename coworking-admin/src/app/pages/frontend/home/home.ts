import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FloatingHeader } from '../../../shared/floating-header/floating-header';
// @ts-ignore
import { startLiquidGlass } from './liquid-glass.effect.js';
// @ts-ignore
import { startGateInk } from './gate-ink.effect.js';
// @ts-ignore
import { startPhilosophyParallax } from './philosophy-parallax.effect.js';
// @ts-ignore
import { startPhilosophyFluid } from './philosophy-fluid.effect.js';
gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FloatingHeader],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  currentSlide = 0;
  totalSlides = 3;
  slideInterval: any;

  private lenis?: Lenis;
  private tickerHandler?: (time: number) => void;

  isShaderVisible = false;
  isVideoPlaying = false;
  isFloatingVisible = false;
  isPhilosophyVisible = false; // ✨ 【補上這行】初始化策展理念的可見度狀態
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

  private scrollVelocity = 0;
  private currentLiquidScale = 0;
  private currentRGBIntensity = 0;

  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 0 };
  private mouseMoveListener?: (e: MouseEvent) => void;

  // 10張圓環卡片專屬變數
  private scrollRotation = { value: 0 };
  private entranceFactor = { value: 0 };
  private idleRotation = 0;
  hoveredIndex: number | null = null;

  // 滑鼠拉動圓環與實體甩動慣性控制組
  private dragRotation = 0;
  private targetDragRotation = 0;
  private isDraggingWheel = false;
  private lastWheelMouseX = 0;
  private wheelVelocity = 0;

  // 💡 ✨【核心宣告修正】：全量補足幾何像素探針變數，剛性洗淨 ts(2339) 亮紅線報錯！
  public isMouseOverSection = false;
  private lastGlobalMouseX = 0;
  private lastGlobalMouseY = 0;
  private sectionMouseX = 9999;
  private sectionMouseY = 9999;

  private trajectories = [
    { from: { x: '-45vw', y: '-40vh', rX: 65, rY: -30, rZ: -90, s: 0.3 } },
    { from: { x: '45vw', y: '-35vh', rX: -45, rY: 60, rZ: 130, s: 0.2 } },
    { from: { x: '-40vw', y: '45vh', rX: 35, rY: -50, rZ: -70, s: 0.3 } },
    { from: { x: '40vw', y: '40vh', rX: -60, rY: 35, rZ: 95, s: 0.2 } },
    { from: { x: '-50vw', y: '5vh', rX: 15, rY: 45, rZ: -45, s: 0.4 } },
    { from: { x: '55vw', y: '-5vh', rX: -25, rY: -45, rZ: 65, s: 0.3 } },
    { from: { x: '-10vw', y: '-50vh', rX: -70, rY: 15, rZ: -110, s: 0.2 } },
    { from: { x: '15vw', y: '50vh', rX: 50, rY: -15, rZ: 85, s: 0.3 } },
    { from: { x: '-30vw', y: '-45vh', rX: 40, rY: -20, rZ: -25, s: 0.3 } },
    { from: { x: '35vw', y: '45vh', rX: -30, rY: 40, rZ: 55, s: 0.2 } }
  ];

  @ViewChild('pinContainer') pinContainer!: ElementRef;
  @ViewChild('scrollWrapper') scrollWrapper!: ElementRef;
  @ViewChild('imageCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroVideo') heroVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('prefaceCanvas') prefaceCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('liquidGlassCanvas') liquidGlassCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('gateContainer') gateContainerRef!: ElementRef;
  @ViewChild('gateInkCanvas') gateInkCanvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('philosophyBgText') philosophyBgTextRef!: ElementRef;
  @ViewChild('philosophyGlows') philosophyGlowsRef!: ElementRef;
  @ViewChild('philosophyMeshGrid') philosophyMeshGridRef!: ElementRef;
  @ViewChild('philosophy3dWrapper') philosophy3dWrapperRef!: ElementRef;
  @ViewChild('philosophyFluidCanvas') philosophyFluidCanvasRef!: ElementRef<HTMLCanvasElement>;

  private philosophyParallaxEngine?: { update: (mx: number, my: number, f: number) => void; destroy: () => void };
  private liquidGlassEngine?: { destroy: () => void };
  private gateInkEngine?: { destroy: () => void };
// 💡 ✨ 新增：儲存新流體引擎的控制權
  private philosophyFluidEngine?: { destroy: () => void };
  private prefaceImages: HTMLImageElement[] = [];
  private prefaceFrameCount = 60;
  private images: HTMLImageElement[] = [];
  private frameCount = 300;

  constructor(private el: ElementRef, private zone: NgZone) { }

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
    this.initAmenitiesAnimation();
    this.initNetworkAnimation();
    this.initTextRevealAnimation();
    this.prepareTypewriterTexts();
    this.initWheelDragInteraction();

    setTimeout(() => {
      this.initBackgroundShaderEngine();

      const canvas = this.liquidGlassCanvasRef?.nativeElement;
      const container = this.pinContainer?.nativeElement;
      if (canvas && container) {
        this.liquidGlassEngine = startLiquidGlass(canvas, container, this.zone, this);
      }

      const gateCanvas = this.gateInkCanvasRef?.nativeElement;
      const gateContainer = this.gateContainerRef?.nativeElement;
      const heroCanvas = this.canvasRef?.nativeElement;

      if (gateCanvas && gateContainer && heroCanvas) {
        this.gateInkEngine = startGateInk(gateCanvas, gateContainer, heroCanvas);
      }

      const meshGrid = this.philosophyMeshGridRef?.nativeElement;
      const glows = this.philosophyGlowsRef?.nativeElement;
      const bgText = this.philosophyBgTextRef?.nativeElement;
      const cardsWrapper = this.philosophy3dWrapperRef?.nativeElement;

      if (meshGrid && glows && bgText && cardsWrapper) {
        this.philosophyParallaxEngine = startPhilosophyParallax(meshGrid, glows, bgText, cardsWrapper);
      }
      // 💡 ✨【本步驟新增點】：在幕後安全初始化策展理念專用流體引擎
      const pFluidCanvas = this.philosophyFluidCanvasRef?.nativeElement;
      const pSectionContainer = this.el.nativeElement.querySelector('#philosophy') as HTMLElement | null;
      if (pFluidCanvas && pSectionContainer) {
        this.philosophyFluidEngine = startPhilosophyFluid(pFluidCanvas, pSectionContainer, this.zone, this);
      }
      ScrollTrigger.refresh();
    }, 200);
  }

  private initWheelDragInteraction() {
    this.zone.runOutsideAngular(() => {
      const philosophySection = this.el.nativeElement.querySelector('#philosophy') as HTMLElement | null;
      if (!philosophySection) return;

      philosophySection.addEventListener('pointermove', (e: PointerEvent) => {
        const rect = philosophySection.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2 - 70;

        this.lastGlobalMouseX = e.clientX;
        this.lastGlobalMouseY = e.clientY;
        this.sectionMouseX = e.clientX - centerX;
        this.sectionMouseY = e.clientY - centerY;
        this.isMouseOverSection = true;

        if (this.isDraggingWheel) {
          const deltaX = e.clientX - this.lastWheelMouseX;
          this.targetDragRotation += deltaX * 0.28;
          this.wheelVelocity = deltaX * 0.28;
          this.lastWheelMouseX = e.clientX;
        }
      });

      philosophySection.addEventListener('pointerdown', (e: PointerEvent) => {
        const targetElement = e.target as HTMLElement | null;
        if (!targetElement) return;

        if (targetElement.closest('.hover-description-box') || targetElement.closest('a') || targetElement.closest('button')) {
          return;
        }

        // 如果使用者抓取的是卡片本身，交由 JS 特效檔全權獨立控制，此處跳過
        if (targetElement.closest('.floating-card')) return;

        this.isDraggingWheel = true;
        this.lastWheelMouseX = e.clientX;
        this.wheelVelocity = 0;
      });

      const stopDragging = () => {
        if (this.isDraggingWheel) {
          this.isDraggingWheel = false;
        }
      };

      philosophySection.addEventListener('pointerleave', () => {
        this.isMouseOverSection = false;
        this.sectionMouseX = 9999;
        this.sectionMouseY = 9999;
        stopDragging();
      });
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
    });
  }

  private initTextRevealAnimation() {
    const nativeElement = this.el.nativeElement;
    const targets = nativeElement.querySelectorAll('.reveal-text');
    targets.forEach((text: any) => {
      gsap.fromTo(text,
        { opacity: 0, y: 32, filter: 'blur(8px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: text, start: 'top 88%', toggleActions: 'play reverse play reverse' }
        }
      );
    });
  }

  toggleVideo(event: Event) {
    event.stopPropagation();
    const video = this.heroVideoRef?.nativeElement;
    if (!video) return;
    video.muted = true;
    if (video.paused) {
      this.isVideoPlaying = true;
      video.play().then(() => { this.userManuallyPaused = false; }).catch(() => { this.isVideoPlaying = false; });
    } else {
      video.pause(); this.isVideoPlaying = false; this.userManuallyPaused = true;
    }
  }

  onVideoMouseEnter() {
    const video = this.heroVideoRef?.nativeElement;
    if (video && video.paused && !this.isVideoPlaying && !this.userManuallyPaused) {
      video.muted = true; this.isVideoPlaying = true; video.play().catch(() => { this.isVideoPlaying = false; });
    }
  }

  private updateHero3DParallax() {
    const nativeElement = this.el.nativeElement;
    const slidesWrapper = nativeElement.querySelector('.hero-slides-wrapper') as HTMLElement | null;
    if (!slidesWrapper) return;
    const scrollAmount = slidesWrapper.scrollWidth - window.innerWidth;
    if (this.lenis && this.lenis.scroll > (scrollAmount + 1500)) return;

    const canvas = this.canvasRef?.nativeElement; if (!canvas) return;
    gsap.set(canvas, { rotationY: this.mouse.x * 6, rotationX: -this.mouse.y * 4, x: this.mouse.x * 15, y: this.mouse.y * 15, scale: 1.04 });

    const heroContent = nativeElement.querySelector('.hero-slide:first-child .hero-slide-content') as HTMLElement | null;
    if (heroContent) { gsap.set(heroContent, { x: this.mouse.x * -20, y: this.mouse.y * -12, z: 45, transformPerspective: 1000 }); }

    const slidesElements = nativeElement.querySelectorAll('.hero-slide');
    const secondSlide = slidesElements[1] as HTMLElement | undefined;
    if (secondSlide) {
      const secondSlideContent = secondSlide.querySelector('.hero-slide-content') as HTMLElement | null;
      const playBtnUI = secondSlide.querySelector('.video-ui-play-btn') as HTMLElement | null;
      if (secondSlideContent) { gsap.set(secondSlideContent, { x: this.mouse.x * -15, y: this.mouse.y * -10, z: 50, transformPerspective: 1000 }); }
      if (playBtnUI) { gsap.set(playBtnUI, { xPercent: -50, yPercent: -50, x: this.mouse.x * 25, y: this.mouse.y * 18, z: 70, transformPerspective: 1000 }); }
    }
  }

  private initBackgroundShaderEngine() {
    const canvas = this.prefaceCanvasRef?.nativeElement; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 1920 * dpr; canvas.height = 1080 * dpr;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

    const targetSection = this.pinContainer?.nativeElement; if (!targetSection) return;

    for (let i = 0; i < this.prefaceFrameCount; i++) {
      const img = new Image(); const paddedIndex = String(i).padStart(5, '0');
      img.src = `assets/Leaves swaying/Leaves swaying_${paddedIndex}.webp`; this.prefaceImages.push(img);
    }

    this.prefaceImages[this.prefaceStartFrame].onload = () => {
      ctx.save(); ctx.scale(dpr, dpr); ctx.drawImage(this.prefaceImages[this.prefaceStartFrame], 0, 0, 1920, 1080); ctx.restore();
    };

    ScrollTrigger.create({ trigger: targetSection, start: 'top bottom', end: 'bottom top', onToggle: (self: ScrollTrigger) => { this.isShaderVisible = self.isActive; } });

    this.zone.runOutsideAngular(() => {
      this.mouseMoveListener = (e: MouseEvent) => {
        this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1; this.mouse.targetY = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener('mousemove', this.mouseMoveListener);
    });
  }

  private updateBackgroundShaderLoop() {
    if (!this.isShaderVisible) return;
    const displacementMap = document.getElementById('glsl-displacement');
    const colorMatrix = document.getElementById('glsl-chromatic');
    if (!displacementMap || !colorMatrix) return;

    const canvas = this.prefaceCanvasRef?.nativeElement; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    this.prefaceCurrentFrame += this.prefaceSpeed * this.prefaceDirection;
    if (this.prefaceCurrentFrame >= this.prefaceEndFrame) { this.prefaceCurrentFrame = this.prefaceEndFrame; this.prefaceDirection = -1; }
    else if (this.prefaceCurrentFrame <= this.prefaceStartFrame) { this.prefaceCurrentFrame = this.prefaceStartFrame; this.prefaceDirection = 1; }

    gsap.set(canvas, { rotationY: this.mouse.x * 5, rotationX: -this.mouse.y * 3, x: this.mouse.x * 20, y: this.mouse.y * 20, scale: 1.05 });

    const absVelocity = Math.abs(this.scrollVelocity);
    const targetScale = Math.min(this.mouse.speed * 240 + absVelocity * 2.0, 250);
    const targetRGB = Math.min(0.005 + this.mouse.speed * 0.5 + absVelocity * 0.005, 0.35);

    this.currentLiquidScale += (targetScale - this.currentLiquidScale) * 0.08;
    this.currentRGBIntensity += (targetRGB - this.currentRGBIntensity) * 0.08;

    const liquidIntensity = Math.round(this.currentLiquidScale);
    if (Math.abs(liquidIntensity - this.lastLiquidIntensity) > 0.5) { displacementMap.setAttribute('scale', liquidIntensity.toString()); this.lastLiquidIntensity = liquidIntensity; }

    if (Math.abs(this.currentRGBIntensity - parseFloat(this.lastMatrixValue || '0')) > 0.001) {
      const matrixValue = ` 1 0 0 ${this.currentRGBIntensity.toFixed(4)} 0  0 1 0 0 0  0 0 1 ${(-this.currentRGBIntensity).toFixed(4)} 0  0 0 0 1 0 `;
      colorMatrix.setAttribute('values', matrixValue); this.lastMatrixValue = this.currentRGBIntensity.toString();
    }

    const index = Math.floor(this.prefaceCurrentFrame);
    if (index !== this.lastPrefaceFrame) {
      if (this.prefaceImages[index] && this.prefaceImages[index].complete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.scale(dpr, dpr); ctx.drawImage(this.prefaceImages[index], 0, 0, 1920, 1080); ctx.restore(); this.lastPrefaceFrame = index;
      }
    }
  }

  private initHeroCanvasEngine() {
    const canvas = this.canvasRef?.nativeElement; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 1920 * dpr; canvas.height = 1080 * dpr;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

    const nativeElement = this.el.nativeElement;
    const slidesWrapper = nativeElement.querySelector('.hero-slides-wrapper') as HTMLElement | null;
    const titleNode = nativeElement.querySelector('.hero-title') as HTMLElement | null;
    const subtitleNode = nativeElement.querySelector('.hero-subtitle') as HTMLElement | null;
    const searchBarNode = nativeElement.querySelector('.search-bar') as HTMLElement | null;
    if (!slidesWrapper || !titleNode) return;

    const initialWarmFrames = 30;
    for (let i = 0; i < this.frameCount; i++) {
      const img = new Image();
      if (i < initialWarmFrames) { const paddedIndex = String(i).padStart(5, '0'); img.src = `assets/office_light2/office_light_${paddedIndex}.webp`; }
      this.images.push(img);
    }
    setTimeout(() => {
      for (let i = initialWarmFrames; i < this.frameCount; i++) { const paddedIndex = String(i).padStart(5, '0'); this.images[i].src = `assets/office_light2/office_light_${paddedIndex}.webp`; }
    }, 1200);

    gsap.set('.left-door', { xPercent: 0 }); gsap.set('.right-door', { xPercent: 0 });
    gsap.set('.gate-text-l', { x: 0, opacity: 1 }); gsap.set('.gate-text-r', { x: 0, opacity: 1 });

    this.images[0].onload = () => { ctx.save(); ctx.scale(dpr, dpr); ctx.drawImage(this.images[0], 0, 0, 1920, 1080); ctx.restore(); };

    const rawText = titleNode.innerText || ''; titleNode.innerHTML = '';
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
      scrollTrigger: { trigger: '.hero', start: 'top top', end: () => `+=${getScrollAmount() + 2000}`, pin: true, scrub: 0.5, invalidateOnRefresh: true }
    });

    masterTl.fromTo('.left-door', { xPercent: 0 }, { xPercent: -101, ease: 'power2.inOut', duration: 0.5 }, 0);
    masterTl.fromTo('.right-door', { xPercent: 0 }, { xPercent: 101, ease: 'power2.inOut', duration: 0.5 }, 0);
    masterTl.fromTo('.gate-text-l', { x: 0, opacity: 1 }, { x: -160, opacity: 0, ease: 'power2.inOut', duration: 0.5 }, 0);
    masterTl.fromTo('.gate-text-r', { x: 0, opacity: 1 }, { x: 160, opacity: 0, ease: 'power2.inOut', duration: 0.5 }, 0);
    masterTl.set('.cinematic-gate', { display: 'none' }, 0.5);

    masterTl.fromTo(slidesWrapper, { opacity: 1, scale: 1.06 }, { opacity: 1, scale: 1.00, ease: 'power1.inOut', duration: 0.5 }, 0);

    const frameData = { frame: 0 };
    masterTl.to(frameData, {
      frame: this.frameCount - 1, ease: 'none', duration: 2.0,
      onUpdate: () => {
        const index = Math.floor(frameData.frame);
        if (this.images[index] && this.images[index].complete) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.scale(dpr, dpr); ctx.drawImage(this.images[index], 0, 0, 1920, 1080); ctx.restore();
        }
      }
    }, 0);

    if (chars.length > 0) masterTl.to(chars, { opacity: 1, y: 0, filter: 'blur(0px)', stagger: { amount: 0.45 }, ease: 'power1.inOut', duration: 0.4 }, 0.05);
    if (subChars.length > 0) masterTl.to(subChars, { opacity: 1, y: 0, filter: 'blur(0px)', stagger: { amount: 0.4 }, ease: 'power1.inOut', duration: 0.4 }, 0.45);
    if (searchBarNode) masterTl.to(searchBarNode, { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.4 }, 0.75);

    masterTl.to(slidesWrapper, { x: () => -getScrollAmount(), ease: 'power2.inOut', duration: 2.0 }, 1.4);

    const slidesNodeList = nativeElement.querySelectorAll('.hero-slide');
    const slide1 = slidesNodeList[1] as HTMLElement | undefined;
    if (slide1) {
      const secondBg = slide1.querySelector('.hero-bg') as HTMLElement | null;
      const secondMedia = slide1.querySelector('.hero-bg video') as HTMLVideoElement | null;
      const secondContent = slide1.querySelector('.hero-slide-content') as HTMLElement | null;

      if (canvas) { masterTl.fromTo(canvas, { x: 0, scale: 1.04, opacity: 1, filter: 'blur(0px)' }, { x: 180, scale: 1.14, opacity: 0.05, filter: 'blur(24px)', ease: 'power2.inOut', duration: 1.8 }, 1.4); }
      if (secondBg && secondMedia) {
        secondMedia.muted = true;
        masterTl.fromTo(secondBg, { width: '84vw', height: '78vh', top: '11vh', left: '8vw', borderRadius: '24px' }, { width: '100vw', height: '100vh', top: '0vh', left: '0vw', borderRadius: '0px', boxShadow: 'none', ease: 'power2.inOut', duration: 0.6 }, 1.8);
        masterTl.fromTo(secondMedia, { xPercent: 32, scale: 1.25 }, { xPercent: 0, scale: 1.00, ease: 'power2.inOut', duration: 0.6 }, 1.8);
      }
      if (secondContent) { masterTl.fromTo(secondContent, { opacity: 0, y: 40, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', ease: 'power2.out', duration: 0.3 }, 2.0); }
      if (secondBg && secondMedia) {
        masterTl.to(secondBg, { width: '84vw', height: '78vh', top: '11vh', left: '8vw', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', ease: 'power2.inOut', duration: 0.6 }, 2.8);
        masterTl.to(secondMedia, { scale: 1.15, ease: 'power2.inOut', duration: 0.6 }, 2.8);
      }
      if (secondContent) { masterTl.to(secondContent, { opacity: 0, y: -40, filter: 'blur(10px)', ease: 'power2.in', duration: 0.3 }, 2.8); }
    }
  }

  private initHorizontalScroll() {
    const container = this.pinContainer?.nativeElement; const wrapper = this.scrollWrapper?.nativeElement; if (!container || !wrapper) return;
    const getScrollAmount = () => { return wrapper.scrollWidth - window.innerWidth; };

    const horizontalTl = gsap.timeline({
      scrollTrigger: { trigger: container, pin: true, scrub: 1, start: 'top top', end: () => `+=${getScrollAmount()}`, invalidateOnRefresh: true }
    });
    horizontalTl.to(wrapper, { x: () => -getScrollAmount(), ease: 'none' }, 0);
    horizontalTl.to('.horizontal-bg-typography', { x: () => -getScrollAmount() * 0.35, ease: 'none' }, 0);

    const cards = container.querySelectorAll('.horizontal-card');
    cards.forEach((card: any) => {
      const imageBox = card.querySelector('.image-box'); const h3 = card.querySelector('h3'); const loc = card.querySelector('.location'); if (!imageBox) return;

      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width - 0.5; const y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(imageBox, { y: -12, rotationY: x * 10, rotationX: -y * 10, transformPerspective: 1000, ease: 'power2.out', duration: 0.3, overwrite: 'auto' });
        if (h3 && loc) { gsap.to([h3, loc], { x: x * 26, y: y * 16, ease: 'power2.out', duration: 0.4, overwrite: 'auto' }); }
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(imageBox, { y: 0, rotationY: 0, rotationX: 0, ease: 'power2.out', duration: 0.5, overwrite: 'auto' });
        if (h3 && loc) { gsap.to([h3, loc], { x: 0, y: 0, ease: 'back.out(1.5)', duration: 0.6, overwrite: 'auto' }); }
      });
    });

    const nativeElement = this.el.nativeElement; const slidesList = nativeElement.querySelectorAll('.hero-slide'); const secondSlide = slidesList[1] as HTMLElement | undefined;
    if (secondSlide) {
      const secondBg = secondSlide.querySelector('.hero-bg') as HTMLElement | null;
      const secondContent = secondSlide.querySelector('.hero-slide-content') as HTMLElement | null;
      const playBtnUI = secondSlide.querySelector('.video-ui-play-btn') as HTMLElement | null;
      if (secondBg) { gsap.to(secondBg, { y: '35vh', z: -250, rotationX: -12, opacity: 0.1, ease: 'none', scrollTrigger: { trigger: container, start: 'top bottom', end: 'top top', scrub: true } }); }
      if (secondContent) { gsap.to(secondContent, { y: '-45vh', z: 150, rotationX: 15, opacity: 0, ease: 'none', scrollTrigger: { trigger: container, start: 'top bottom', end: 'top center', scrub: true } }); }
      if (playBtnUI) { gsap.to(playBtnUI, { y: '-30vh', z: 220, opacity: 0, ease: 'none', scrollTrigger: { trigger: container, start: 'top bottom', end: 'top center', scrub: true } }); }
    }

    const horizontalIntro = container.querySelector('.horizontal-intro') as HTMLElement | null;
    if (horizontalIntro) {
      gsap.fromTo(horizontalIntro, { y: 180, z: -100, rotationX: 15, opacity: 0, transformPerspective: 2000 }, { y: 0, z: 0, rotationX: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: container, start: 'top bottom', end: 'top center', scrub: true } });
    }
  }

  private initPhilosophyAnimation() {
    const nativeElement = this.el.nativeElement; 
    const section = nativeElement.querySelector('.philosophy'); 
    if (!section) return;
    // ✨ 【新增這段】：當進入或離開策展理念區塊時，自動解凍/凍結 WebGL 渲染
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom', // 當區塊頂部進入螢幕底部時就開始準備渲染
    end: 'bottom top',   // 當區塊底部離開螢幕頂部時停止渲染
    onToggle: (self) => {
      this.isPhilosophyVisible = self.isActive;
    }
  });
    
    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: '+=5500', pin: true, scrub: 2, invalidateOnRefresh: true, onUpdate: (self: ScrollTrigger) => { this.scrollRotation.value = self.progress * 130; } }
    });
    tl.to(section, { backgroundColor: '#0e0e10', boxShadow: '0 -30px 60px rgba(0, 0, 0, 0.4)', ease: 'expo.out', duration: 0.08 });
    tl.to(this.entranceFactor, { value: 1, ease: 'power2.out', duration: 0.55 }); tl.to({}, { duration: 0.55 }); tl.to(this.entranceFactor, { value: 0, ease: 'power2.in', duration: 0.60 });
    tl.to(section, { backgroundColor: '#ffffff', boxShadow: '0 -30px 60px rgba(0, 0, 0, 0)', ease: 'power2.out', duration: 0.18 });
  }

  private initRentalPlansAnimation() {
    const nativeElement = this.el.nativeElement; const section = nativeElement.querySelector('.rental-plans'); if (!section) return;
    const cards = section.querySelectorAll('.visual-plan-card'); const header = section.querySelector('.section-header');
    if (header) { gsap.fromTo(header, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play reverse play reverse' } }); }
    if (cards.length > 0) {
      gsap.fromTo(cards, { y: 320, scale: 0.7, opacity: 0, rotationX: 25, z: -400 }, { y: 0, scale: 1, opacity: 1, rotationX: 0, z: 0, duration: 1.2, ease: 'back.out(1.8)', stagger: 0.18, transformPerspective: 1200, scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play reverse play reverse' } });
      cards.forEach((card: any) => {
        const img = card.querySelector('.card-image-box img');
        if (img) { gsap.fromTo(img, { yPercent: -18 }, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } }); }
      });
    }
  }

  private initAmenitiesAnimation() {
    const nativeElement = this.el.nativeElement; const section = nativeElement.querySelector('.amenities'); if (!section) return;
    const header = section.querySelector('.section-header-left'); const items = section.querySelectorAll('.amenity-item'); const rightImgBox = section.querySelector('.amenities-right-image-box'); const img = section.querySelector('.amenities-right-image-box img');
    if (header) { gsap.fromTo(header, { y: 60, opacity: 0, z: -100 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play reverse play reverse' } }); }
    if (items.length > 0) { gsap.fromTo(items, { y: 280, scale: 0.75, opacity: 0, rotationX: 20, z: -300 }, { y: 0, scale: 1, opacity: 1, rotationX: 0, z: 0, duration: 1.1, ease: 'back.out(1.6)', stagger: 0.12, transformPerspective: 1200, scrollTrigger: { trigger: section, start: 'top 72%', toggleActions: 'play reverse play reverse' } }); }
    if (rightImgBox) { gsap.fromTo(rightImgBox, { x: 120, opacity: 0, scale: 0.9, rotationY: 15 }, { x: 0, opacity: 1, scale: 1, rotationY: 0, duration: 1.3, ease: 'power2.out', scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play reverse play reverse' } }); }
    if (img) { gsap.fromTo(img, { yPercent: -15 }, { yPercent: 15, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } }); }
  }

  private initNetworkAnimation() {
    const nativeElement = this.el.nativeElement; const section = nativeElement.querySelector('.network'); if (!section) return;
    const header = section.querySelector('.section-header'); const regions = section.querySelectorAll('.region');
    if (header) { gsap.fromTo(header, { y: 60, opacity: 0, z: -80 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play reverse play reverse' } }); }
    if (regions.length > 0) {
      gsap.fromTo(regions, { y: 220, scale: 0.8, opacity: 0, rotationX: 15, z: -200 }, { y: 0, scale: 1, opacity: 1, rotationX: 0, z: 0, duration: 1.2, ease: 'back.out(1.5)', stagger: 0.15, transformPerspective: 1200, scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play reverse play reverse' } });
    }
  }

  onCardMouseEnter(index: number) {
    const nativeElement = this.el.nativeElement;
    const card = nativeElement.querySelectorAll('.floating-card')[index] as HTMLElement | undefined;
    if (card) {
      const chars = card.querySelectorAll('.char');
      gsap.fromTo(chars, { opacity: 0, y: 10, filter: 'blur(4px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', delay: 0.05, stagger: 0.03, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
    }
  }

  onCardMouseLeave() { }

  private prepareTypewriterTexts() {
    const nativeElement = this.el.nativeElement; const boxes = nativeElement.querySelectorAll('.hover-description-box p');
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

    if (!this.isDraggingWheel) {
      this.targetDragRotation += this.wheelVelocity;
      this.wheelVelocity *= 0.93;
    }
    this.dragRotation += (this.targetDragRotation - this.dragRotation) * 0.1;

    this.idleRotation += 0.15;
    const totalRotation = this.scrollRotation.value + this.idleRotation + this.dragRotation;
    const radius = window.innerWidth > 768 ? 340 : 170;
    const factor = this.entranceFactor.value;

    let newHoveredIndex: number | null = null;

    if (this.isMouseOverSection && factor > 0.01) {
      for (let i = 0; i < cards.length; i++) {
        const cardEl = cards[i] as HTMLElement;

        // 🔒 剛性安全攔截：如果這張卡片已被標記為受特效控制或正在吸入，跳過計算
        if (cardEl.dataset['controlled'] === 'true') continue;

        const rect = cardEl.getBoundingClientRect();

        if (
          this.lastGlobalMouseX >= rect.left &&
          this.lastGlobalMouseX <= rect.right &&
          this.lastGlobalMouseY >= rect.top &&
          this.lastGlobalMouseY <= rect.bottom
        ) {
          newHoveredIndex = i;
          break;
        }
      }
    }

    if (newHoveredIndex !== this.hoveredIndex) {
      this.hoveredIndex = newHoveredIndex;
      if (this.hoveredIndex !== null) {
        this.onCardMouseEnter(this.hoveredIndex);
      }
    }

    cards.forEach((card: any, index: number) => {
      // 🔒 核心隔離：如果卡片正被 JS 特效引擎拖拽或吸入中心，跳過公式複寫，防抖動！
      if (card.dataset['controlled'] === 'true') return;

      const m = this.trajectories[index]; if (!m) return;
      const baseAngle = index * (360 / cards.length); 
      const totalAngle = baseAngle + totalRotation; 
      const angleRad = totalAngle * (Math.PI / 180);

      const targetX = Math.cos(angleRad) * radius;
      const targetY = Math.sin(angleRad) * radius;
      const targetZ = 0;

      const fromXpx = (parseFloat(m.from.x) / 100) * window.innerWidth;
      const fromYpx = (parseFloat(m.from.y) / 100) * window.innerHeight;
      const fromZpx = -600;

      const currentX = fromXpx + (targetX - fromXpx) * factor;
      const currentY = fromYpx + (targetY - fromYpx) * factor;
      let currentZ = fromZpx + (targetZ - fromZpx) * factor;
      
     
      const currentOpacity = 0 + (1.0 - 0) * factor;
      const depthBlur = ((radius - targetY) / (radius * 2)) * 2.5;
      const entryBlur = 12 * (1 - factor);
      let totalBlur = entryBlur + (depthBlur * factor);

      const isHovered = this.hoveredIndex === index;
      let currentScale = (m.from.s + (1.0 - m.from.s) * factor) * (isHovered ? 1.2 : 1.0);
      if (isHovered) {
        totalBlur = 0;
        currentZ += 15;
      }

      gsap.set(card, {
        x: currentX, y: currentY, z: currentZ,
        scale: currentScale, opacity: currentOpacity,
        force3D: true, overwrite: 'auto'
      });

      const inner = card.querySelector('.card-inner') as HTMLElement | null;
      if (inner) { gsap.set(inner, { rotationZ: totalAngle + 90, rotationX: 14, rotationY: -6, overwrite: 'auto' }); }

      const cardImg = card.querySelector('img') as HTMLElement | null;
      if (cardImg) { gsap.set(cardImg, { filter: `blur(${totalBlur}px)`, overwrite: 'auto' }); }
    });

    if (this.philosophyParallaxEngine) {
      this.philosophyParallaxEngine.update(this.mouse.x, this.mouse.y, factor);
    }

    const centerText = nativeElement.querySelector('.philosophy-center-text') as HTMLElement | null;
    if (centerText) {
      const breathingPulse = 1 + Math.sin(gsap.ticker.frame * 0.04) * 0.02;
      const currentScale = (0.75 + (1.0 - 0.75) * factor) * breathingPulse;
      const currentOpacity = 0 + (1.0 - 0) * factor;
      const currentBlur = 15 * (1 - factor);
      gsap.set(centerText, { scale: currentScale, opacity: currentOpacity, filter: `blur(${currentBlur}px)`, z: 12 });
    }
  }

  private initSmoothScroll() {
    this.zone.runOutsideAngular(() => {
      this.lenis = new Lenis({ duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });

      this.tickerHandler = (time: number) => {
        this.lenis?.raf(time * 1000);
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;
        const dx = this.mouse.targetX - this.mouse.x; const dy = this.mouse.targetY - this.mouse.y;
        this.mouse.speed = Math.sqrt(dx * dx + dy * dy);

        this.updateCardsWheel(); this.updateBackgroundShaderLoop(); this.updateHero3DParallax();

        const slidesList = this.el.nativeElement.querySelectorAll('.hero-slide');
        const secondSlide = slidesList[1] as HTMLElement | undefined;
        const targetVideo = this.heroVideoRef?.nativeElement;

        if (secondSlide && targetVideo) {
          const rect = secondSlide.getBoundingClientRect();
          const isVisible = rect.right > 0 && rect.left < window.innerWidth;
          const isInAutoplayZone = rect.left < window.innerWidth * 0.50 && rect.right > window.innerWidth * 0.10;
          if (isInAutoplayZone) {
            if (!this.isVideoPlaying && !this.userManuallyPaused) {
              this.zone.run(() => { this.isVideoPlaying = true; });
              targetVideo.play().catch(() => { this.zone.run(() => { this.isVideoPlaying = false; }); });
            }
          } else {
            if ((rect.left > window.innerWidth * 0.35 || !isVisible) && this.isVideoPlaying) { targetVideo.pause(); this.isVideoPlaying = false; }
          }
          if (!isVisible) { this.userManuallyPaused = false; }
        }
      };

      gsap.ticker.add(this.tickerHandler);
      gsap.ticker.lagSmoothing(0);

      this.lenis.on('scroll', (e: any) => {
        ScrollTrigger.update(); const scrollTop = window.scrollY || document.documentElement.scrollTop;
        if (e && e.velocity !== undefined) { this.scrollVelocity = e.velocity; }

        const nextFloatingVisible = scrollTop > 100;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const nextScrollPercentage = docHeight > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100))) : 0;

        if (this.isFloatingVisible !== nextFloatingVisible || this.scrollPercentage !== nextScrollPercentage) {
          this.zone.run(() => { this.isFloatingVisible = nextFloatingVisible; this.scrollPercentage = nextScrollPercentage; });
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.slideInterval) clearInterval(this.slideInterval);
    if (this.tickerHandler) { gsap.ticker.remove(this.tickerHandler); }
    if (this.mouseMoveListener) window.removeEventListener('mousemove', this.mouseMoveListener);

    if (this.liquidGlassEngine) { this.liquidGlassEngine.destroy(); }
    if (this.gateInkEngine) { this.gateInkEngine.destroy(); }
    if (this.philosophyParallaxEngine) { this.philosophyParallaxEngine.destroy(); }
// 💡 ✨ 新增：路由頁面銷毀時，同步安全釋放 WebGL 渲染器，杜絕記憶體洩漏
    if (this.philosophyFluidEngine) { this.philosophyFluidEngine.destroy(); }
    this.lenis?.destroy();
    ScrollTrigger.getAll().forEach((trigger: ScrollTrigger) => trigger.kill());
  }
}