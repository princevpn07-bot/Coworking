import * as THREE from 'three';

/**
 * 🌌 COVO 策展理念 - 頂級高奢 3D 自發光全息海流體引擎 (光學光暈暨完全解凍永恆流動版)
 * 100% 獨立隔離，海水完全通透。100% 解除 GSAP 動畫死區死鎖，確保卡片圓環完全出現時海面依然無限流暢翻湧，持續與滑鼠微動交互！
 */
export function startPhilosophyFluid(canvas, container, zone, visibilityCheckRef) {
  let animId;
  let scene, camera, renderer;
  let mesh, geometry, material;
  let clock;
  
  // ── 💡 物理級 Q 彈阻尼諧振子狀態矩陣 ──
  let hoverFactor = 0.0;
  let fluidRunningTime = 0.0; // ✨【核心解凍核心】：宣告獨立的 WebGL 硬體時間軸累加器，徹底切斷與 GSAP 的連帶死鎖！
  const pointerState = { isDown: false, clickWorldX: 0.0, clickWorldZ: 0.0 };
  const elastic = { pullX: 0.0, pullZ: 0.0, velX: 0.0, velZ: 0.0 };

  const params = {
    dpr: 0.6,                  // 解析度抽樣係數，確保全息線與發光極致細膩
    speed: 0.58,               // 3D 海流自然湧動的流暢速度
    waveHeight: 0.35,          // 3D 海浪起伏的立體高度
    exposure: 1.72              // 物理級微調曝光度，完全釋放琥珀金光與強烈光暈的外擴散射感（Bloom）
  };

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  const initialDPR = Math.min(2, window.devicePixelRatio) * params.dpr;
  renderer.setPixelRatio(initialDPR);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const uniforms = {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(window.innerWidth * initialDPR, window.innerHeight * initialDPR) },
    u_mouse: { value: new THREE.Vector2(0.0, 0.0) },
    u_hoverFactor: { value: 0.0 },
    u_clickPos: { value: new THREE.Vector2(0.0, 0.0) },
    u_pullOffset: { value: new THREE.Vector2(0.0, 0.0) },
    u_waveHeight: { value: params.waveHeight },
    u_speed: { value: params.speed },
    u_exposure: { value: params.exposure }
  };

  const vertexShader = `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec2 u_mouse;
    uniform float u_hoverFactor;
    uniform vec2 u_clickPos;
    uniform vec2 u_pullOffset;
    uniform float u_waveHeight;
    uniform float u_speed;
    uniform float u_exposure;

    #define MAX_RAY_STEPS 95
    #define DISTANCE_THRESHOLD 0.001
    #define MAX_DISTANCE 22.0

    float getOceanHeight(vec3 p) {
      float t = iTime * u_speed * 1.5; 
      float w1 = sin(p.x * 0.75 + t) * cos(p.z * 0.55 + t * 0.8); 
      float w2 = sin(p.z * 1.65 - t * 1.1) * cos(p.x * 1.35 + t * 0.6); 
      float w3 = sin((p.x + p.z) * 3.4 + t * 1.5) * 0.16; 
      return (w1 * 0.52 + w2 * 0.36 + w3 * 0.12) * u_waveHeight; 
    }

    float mapOcean(vec3 p) {
      float d = distance(p.xz, u_clickPos);
      float influence = exp(-d * d * 0.5);
      
      p.x -= u_pullOffset.x * influence * 1.2;
      p.z -= u_pullOffset.y * influence * 1.2;
      
      float pullLen = length(u_pullOffset);
      p.y += sin(d * 10.0 - iTime * 9.0) * pullLen * influence * 0.22;

      return p.y - getOceanHeight(p);
    }

    vec3 getOceanNormal(vec3 p) {
      vec2 e = vec2(0.005, 0.0);
      return normalize(vec3(
        mapOcean(p + e.xyy) - mapOcean(p - e.xyy),
        mapOcean(p + e.yxy) - mapOcean(p - e.yxy),
        mapOcean(p + e.yyx) - mapOcean(p - e.yyx)
      ));
    }

    vec3 custom_tanh(vec3 x) {
      vec3 e = exp(2.0 * x);
      return (e - 1.0) / (e + 1.0);
    }

    void main() {
      if (u_hoverFactor < 0.01) {
        discard;
      }

      vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
      float edgeFade = smoothstep(1.3, 0.35, length(uv * vec2(0.6, 1.0)));

      vec3 rayOrigin = vec3(0.0, 1.25, iTime * 0.15);
      vec3 rayDir = normalize(vec3(uv.x, uv.y - 0.35, 1.1));

      float traveledDistance = 0.0;
      bool hitOcean = false;
      vec3 currentPos = vec3(0.0);

      for (int i = 0; i < MAX_RAY_STEPS; i++) {
        currentPos = rayOrigin + rayDir * traveledDistance;
        float dist = mapOcean(currentPos);
        if (dist < DISTANCE_THRESHOLD) {
          hitOcean = true;
          break;
        }
        traveledDistance += dist * 0.58;
        if (traveledDistance > MAX_DISTANCE) break;
      }

      vec4 finalOutputColor = vec4(0.0);

      if (hitOcean) {
        vec3 N = getOceanNormal(currentPos);
        vec3 V = normalize(rayOrigin - currentPos);
        vec3 R = reflect(rayDir, N);
        
        vec3 sunDir = normalize(vec3(0.45 + u_mouse.x * 0.4, 0.85 + u_mouse.y * 0.15, -0.6));

        // 光學級三層發光光暈矩陣（白金核心高光、中景金曜暈光、環境薄霧金氣場）
        float sunSpec = pow(max(dot(R, sunDir), 0.0), 180.0) * 4.5;
        float midBloom = pow(max(dot(R, sunDir), 0.0), 45.0) * 2.2;
        float wideGlow = pow(max(dot(R, sunDir), 0.0), 10.0) * 1.3;
        
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.5);

        float waveH = getOceanHeight(currentPos);
        float crestGlow = smoothstep(-0.15, 0.25, waveH) * 0.18;

        float scanline = sin(currentPos.z * 25.0 - iTime * 4.0) * 0.5 + 0.5;
        float waveGrid = sin(currentPos.x * 12.0) * cos(currentPos.z * 12.0);
        float laserGridGlow = smoothstep(0.04, 0.0, abs(waveGrid)) * 0.38;

        vec3 whiteGoldCrest = vec3(0.99, 0.98, 0.95);
        vec3 luxuryGold = vec3(1.0, 0.84, 0.46);
        vec3 neonGlowColor = vec3(1.0, 0.91, 0.62);

        vec3 emissiveGlow = whiteGoldCrest * sunSpec 
                           + neonGlowColor * midBloom
                           + luxuryGold * (wideGlow + crestGlow)
                           + luxuryGold * (scanline * 0.14 + laserGridGlow * 1.25) * fresnel;
        
        vec3 finalRGB = emissiveGlow * u_exposure;

        float alphaChannel = (sunSpec * 0.88) + (midBloom * 0.55) + (wideGlow * 0.32) + (crestGlow * 0.45) + (scanline * 0.12) + (fresnel * 0.45);
        alphaChannel *= u_hoverFactor * edgeFade;

        float distanceFade = smoothstep(MAX_DISTANCE * 0.85, MAX_DISTANCE * 0.35, traveledDistance);
        alphaChannel *= distanceFade;

        finalOutputColor = vec4(finalRGB, clamp(alphaChannel, 0.0, 0.88));
      }

      gl_FragColor = finalOutputColor;
    }
  `;

  material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    transparent: true
  });

  geometry = new THREE.PlaneGeometry(2, 2);
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  clock = new THREE.Clock();

  const onPointerDown = (e) => {
    if (e.target.closest('.card-inner') || e.target.closest('.hover-description-box') || e.target.closest('a') || e.target.closest('button')) {
      return;
    }

    pointerState.isDown = true;

    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
    const my = 1.0 - ((e.clientY - rect.top) / rect.height) * 2.0;
    const aspect = window.innerWidth / window.innerHeight;

    const rayDir = new THREE.Vector3(mx * aspect, my - 0.35, 1.1).normalize();
    if (Math.abs(rayDir.y) > 0.001) {
      const t = -1.25 / rayDir.y;
      pointerState.clickWorldX = t * rayDir.x;
      pointerState.clickWorldZ = (fluidRunningTime * 0.15) + t * rayDir.z; // ✨ 使用解凍時間
    }

    elastic.pullX = 0; elastic.pullZ = 0;
    elastic.velX = 0;  elastic.velZ = 0;
  };

  const onPointerUp = () => { pointerState.isDown = false; };

  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  const onResize = () => {
    const currentDPR = Math.min(2, window.devicePixelRatio) * params.dpr;
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.iResolution.value.set(window.innerWidth * currentDPR, window.innerHeight * currentDPR);
  };
  window.addEventListener('resize', onResize);

  zone.runOutsideAngular(() => {
    const loop = () => {
      if (!visibilityCheckRef.isPhilosophyVisible) {
        animId = requestAnimationFrame(loop);
        return;
      }
      
      // 🎯【剛性解凍核心核心】：改用 clock.getDelta() 抓取硬體真實微秒差
      // 這樣無論外部 GSAP 滾動動畫停在什麼位置（不論卡在空白死區還是靜止不動），海浪的每一影格時間都會源源不絕地獨立累加！
      const delta = clock.getDelta();
      fluidRunningTime += delta; 
      uniforms.iTime.value = fluidRunningTime; // 🔒 將純淨解凍時間灌入 GPU

      const mx = (visibilityCheckRef.lastGlobalMouseX / window.innerWidth) * 2.0 - 1.0;
      const my = 1.0 - (visibilityCheckRef.lastGlobalMouseY / window.innerHeight) * 2.0;
      const aspect = window.innerWidth / window.innerHeight;

      if (pointerState.isDown) {
        const rayDir = new THREE.Vector3(mx * aspect, my - 0.35, 1.1).normalize();
        let currentWorldX = 0, currentWorldZ = 0;
        if (Math.abs(rayDir.y) > 0.001) {
          const t = -1.25 / rayDir.y;
          currentWorldX = t * rayDir.x;
          currentWorldZ = (fluidRunningTime * 0.15) + t * rayDir.z; // ✨ 使用解凍時間
        }

        let targetX = currentWorldX - pointerState.clickWorldX;
        let targetZ = currentWorldZ - pointerState.clickWorldZ;

        let dragLen = Math.sqrt(targetX * targetX + targetZ * targetZ);
        if (dragLen > 2.8) {
          targetX = (targetX / dragLen) * 2.8;
          targetZ = (targetZ / dragLen) * 2.8;
        }

        elastic.pullX += (targetX - elastic.pullX) * 0.22;
        elastic.pullZ += (targetZ - elastic.pullZ) * 0.22;
        elastic.velX = 0; elastic.velZ = 0;
      } else {
        let ax = -elastic.pullX * 0.32;
        let az = -elastic.pullZ * 0.32;
        
        elastic.velX += ax;
        elastic.velZ += az;
        elastic.velX *= 0.81;
        elastic.velZ *= 0.81;
        
        elastic.pullX += elastic.velX;
        elastic.pullZ += elastic.velZ;
      }

      uniforms.u_clickPos.value.set(pointerState.clickWorldX, pointerState.clickWorldZ);
      uniforms.u_pullOffset.value.set(elastic.pullX, elastic.pullZ);

      let targetHover = visibilityCheckRef.isMouseOverSection ? 1.0 : 0.0;
      hoverFactor += (targetHover - hoverFactor) * 0.052;
      uniforms.u_hoverFactor.value = hoverFactor;

      // 🔒 100% 響應滑鼠交互：就算滾動停止，u_mouse 依然每格刷新，保障滑鼠跟隨與燈光照耀！
      uniforms.u_mouse.value.set(mx, my);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
  });

  return {
    destroy: () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      material.dispose();
      geometry.dispose();
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    }
  };
}