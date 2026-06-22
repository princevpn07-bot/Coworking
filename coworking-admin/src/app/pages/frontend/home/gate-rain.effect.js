import * as THREE from 'three';

/**
 * 🌌 COVO 開場大門 - 劇院級 2D 亂數雨窗毛玻璃折射引擎 (Multi-Scale Glass Rain Gate)
 * 100% 獨立隔離，純 GPU 著色器渲染，大中小水滴完全亂序大小不一，自帶高級磨邊與物理折射
 */
export function startGateRain(canvas, container, heroCanvas) {
  let animId;
  let scene, camera, renderer;
  let mesh, geometry, material;
  let clock;

  const params = {
    dpr: 0.65,                 // 解析度抽樣，保障水滴弧度邊緣晶瑩滑順
    rainSpeed: 0.18,           // 雨水流淌下滑的靜謐速度
    staticDensity: 22.0,       // 附著在玻璃上的靜止微觀中水珠密度
    slidingDensity: 12.0,      // 滑落大水滴的格網密集頻度
    mistDensity: 55.0          // 背景細密微觀霧化小水珠密度
  };

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // 剛性關鍵：開啟 alpha: true，平時未受光的雨窗部分會呈現高檔的半透明毛玻璃，開門時優雅向兩側退開
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  const initialDPR = Math.min(2, window.devicePixelRatio) * params.dpr;
  renderer.setPixelRatio(initialDPR);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // 將底層的 Hero Canvas 轉化為 WebGL 動態折射貼圖
  let heroTexture = null;
  if (heroCanvas) {
    heroTexture = new THREE.CanvasTexture(heroCanvas);
    heroTexture.minFilter = THREE.LinearFilter;
    heroTexture.magFilter = THREE.LinearFilter;
  }

  const uniforms = {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(window.innerWidth * initialDPR, window.innerHeight * initialDPR) },
    u_rainSpeed: { value: params.rainSpeed },
    u_staticDensity: { value: params.staticDensity },
    u_slidingDensity: { value: params.slidingDensity },
    u_mistDensity: { value: params.mistDensity },
    uHeroTex: { value: heroTexture ? heroTexture : new THREE.Texture() }
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
    uniform float u_rainSpeed;
    uniform float u_staticDensity;
    uniform float u_slidingDensity;
    uniform float u_mistDensity;
    uniform sampler2D uHeroTex;

    // 高階 2D 偽隨機數生成多項式
    vec2 hash22(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p);
    }

    // 🎯【第一層：重力滑落大水滴層 - 亂數大小不一優化版】
    vec3 getSlidingDrops(vec2 uv, float t) {
      vec2 st = uv * vec2(u_slidingDensity, u_slidingDensity * 0.4);
      vec2 id = floor(st);
      vec2 f = fract(st) - 0.5;
      
      vec2 h = hash22(id);
      
      // 🔒 破除一致性核心一：讓下落速度、出發時間、以及「雨滴本體大小」完全亂數亂序化！
      float speed = u_rainSpeed * (0.5 + h.x * 0.7);
      float yOffset = fract(t * speed + h.y * 50.0); 
      
      // 隨機雨滴物理半徑：讓雨滴有大有小 (0.06 ~ 0.16 之間隨機)
      float randomRadius = 0.06 + h.x * 0.10;
      
      vec2 dropPos = vec2((h.y - 0.5) * 0.5, (yOffset - 0.5) * 2.0);
      dropPos.x += sin(yOffset * 8.0 + h.x * 6.28) * 0.12; // 左右搖擺水流感
      
      // 淚滴形流線形縱向變形
      vec2 aspectScale = vec2(1.0, 1.0 + speed * 0.5);
      float dist = length((f - dropPos) * aspectScale);
      
      vec2 normal = vec2(0.0);
      float mask = 0.0;
      
      if (dist < randomRadius) {
        mask = 1.0;
        normal = ((f - dropPos) * aspectScale) / randomRadius;
      }
      
      // 斷續的流體殘留尾跡
      float trailMask = smoothstep(0.03, 0.0, abs(f.x - dropPos.x));
      trailMask *= step(f.y, dropPos.y) * step(dropPos.y - 0.7, f.y);
      float trailNoise = sin(f.y * 60.0 + h.y * 20.0);
      
      if (trailNoise > 0.45 && trailMask > 0.0 && mask == 0.0) {
        mask = 0.55;
        normal = vec2(f.x - dropPos.x, 0.0) / 0.03;
      }
      
      return vec3(normal, mask);
    }

    // 🎯【第二層：玻璃附著靜止中水珠層 - 亂數尺寸版】
    vec3 getStaticDroplets(vec2 uv, float t) {
      vec2 st = uv * u_staticDensity;
      vec2 id = floor(st);
      vec2 f = fract(st) - 0.5;
      
      vec2 h = hash22(id);
      vec2 dropPos = (h - 0.5) * 0.75; // 隨機偏移網格
      
      float life = sin(t * 0.2 + h.x * 35.0) * 0.5 + 0.5;
      // 🔒 破除一致性核心二：靜止水珠的大小同樣完全隨機 hash 亂數化 (最大半徑隨機)
      float randomRadius = 0.14 * h.y * (0.3 + life * 0.7); 
      
      float dist = distance(f, dropPos);
      vec2 normal = vec2(0.0);
      float mask = 0.0;
      
      if (dist < randomRadius && randomRadius > 0.02) {
        mask = 0.5;
        normal = (f - dropPos) / randomRadius;
      }
      
      return vec3(normal, mask);
    }

    // 🎯【第三層：背景超高密度微觀霧化水珠（Micro-Mist Layer）】
    vec3 getMicroMist(vec2 uv) {
      vec2 st = uv * u_mistDensity;
      vec2 id = floor(st);
      vec2 f = fract(st) - 0.5;
      vec2 h = hash22(id);
      
      float mask = 0.0;
      vec2 normal = vec2(0.0);
      
      if (h.x > 0.65) {
        vec2 dropPos = (h - 0.5) * 0.8;
        float randomRadius = 0.07 * h.y;
        float dist = distance(f, dropPos);
        if (dist < randomRadius) {
          mask = 0.25;
          normal = (f - dropPos) / randomRadius;
        }
      }
      return vec3(normal, mask);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / iResolution.xy;
      vec2 uvAspect = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;

      // 同步調用大、中、微觀三層大小完全亂數的複合水滴矩陣
      vec3 slideLayer = getSlidingDrops(uvAspect, iTime);
      vec3 staticLayer = getStaticDroplets(uvAspect, iTime);
      vec3 mistLayer = getMicroMist(uvAspect);
      
      float finalMask = max(slideLayer.z, max(staticLayer.z, mistLayer.z));
      
      vec2 finalNormal = slideLayer.xy;
      if (staticLayer.z > slideLayer.z) finalNormal = staticLayer.xy;
      if (mistLayer.z > max(slideLayer.z, staticLayer.z)) finalNormal = mistLayer.xy;

      // 🎯【毛玻璃材質基底塗層運算】
      // 基礎大門底色採高級奢華的拋光半透明墨黑（rgba(20,18,16,0.85)）
      vec3 glassBaseColor = vec3(0.08, 0.07, 0.06); 
      
      // 採樣被折射扭曲後的底層 office 畫面
      vec2 refractOffset = finalNormal * 0.045 * finalMask;
      vec3 refractedScene = texture2D(uHeroTex, uv + refractOffset).rgb;
      
      // 將毛玻璃大門底色與後方折射進來的相片進行高奢融合
      vec3 mixedGlass = mix(refractedScene, glassBaseColor, 0.55);

      vec3 finalRGB = mixedGlass;

      if (finalMask > 0.01) {
        vec3 N = normalize(vec3(finalNormal, sqrt(1.0 - clamp(dot(finalNormal, finalNormal), 0.0, 1.0))));
        vec3 L = normalize(vec3(0.3, 0.6, 1.0)); // 環境頂層白金高光
        vec3 V = vec3(0.0, 0.0, 1.0);
        vec3 H = normalize(L + V);

        // 200次高階乘方雕刻出雨珠頂部的晶瑩尖銳耀眼亮點
        float spec = pow(max(dot(N, H), 0.0), 200.0) * 2.5;
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.5) * 0.45;
        float shadow = smoothstep(0.2, -0.6, dot(N, vec3(-0.3, -0.5, 0.0))) * 0.15;

        vec3 crystalWhite = vec3(0.98, 0.97, 0.94);
        vec3 waterGlow = crystalWhite * spec + crystalWhite * fresnel - vec3(shadow);
        
        // 疊加雨珠的水潤高光，使其在毛玻璃大門上清晰凸顯
        finalRGB += waterGlow * 0.5;
      }

      // 開門動畫完全由外部大門門板控制，此處雨窗玻璃保持 100% 固體顯影
      gl_FragColor = vec4(finalRGB * u_exposure, 1.0);
    }
  `;

  material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms
  });

  geometry = new THREE.PlaneGeometry(2, 2);
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  clock = new THREE.Clock();

  const onResize = () => {
    const currentDPR = Math.min(2, window.devicePixelRatio) * params.dpr;
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.iResolution.value.set(window.innerWidth * currentDPR, window.innerHeight * currentDPR);
  };
  window.addEventListener('resize', onResize);

  zone.runOutsideAngular(() => {
    const loop = () => {
      // 開門完成、大門移出螢幕後自動凍結，杜絕任何效能耗損
      if (parseFloat(container.style.transform?.match(/-?\d+/)?.[0] || '0') < -98) {
        animId = requestAnimationFrame(loop);
        return;
      }

      uniforms.iTime.value = clock.getElapsedTime();
      if (heroTexture) heroTexture.needsUpdate = true; // 即時同步更新底層 Canvas 影格

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
      if (heroTexture) heroTexture.dispose();
      window.removeEventListener('resize', onResize);
    }
  };
}