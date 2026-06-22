import * as THREE from 'three';

/**
 * 🌌 COVO 開場大門 - 劇院級 2D 亂數雨窗毛玻璃折射引擎 (全域去重影絲滑緞面版)
 * 100% 獨立隔離，純 GPU 著色器渲染。雨水參數完全原封不動，利用像素級交織抖動演算法徹底消滅生硬殘影與重影。
 */
export function startGateRain(canvas, container, heroCanvas, zone) { 
  let animId;
  let scene, camera, renderer;
  let mesh, geometry, material;
  let clock;

  // 🔒 鐵律：你調整好的雨水核心參數矩陣 100% 完好保留，一字未動！
  const params = {
    dpr: 0.65,                 // 解析度抽樣，保障水滴與磨砂晶體極致滑順
    rainSpeed: 0.22,           // 順應重力向下滑落的自然流暢速度
    staticDensity: 24.0,       // 附著在玻璃上的靜止微觀中水珠密度
    slidingDensity: 14.0,      // 滑落大水滴的格網密集頻度
    mistDensity: 60.0,          // 背景細密微觀霧化小水珠密度
    exposure: 1.25             // 電影級色彩映射曝光度
  };

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  const initialDPR = Math.min(2, window.devicePixelRatio) * params.dpr;
  renderer.setPixelRatio(initialDPR);
  renderer.setSize(window.innerWidth, window.innerHeight);

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
    u_exposure: { value: params.exposure },
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
    uniform float u_exposure;
    uniform sampler2D uHeroTex;

    vec2 hash22(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p);
    }

    // 🔒 鐵律：你滿意的重力滑落大水滴公式 100% 完整保留
    vec3 getSlidingDrops(vec2 uv, float t) {
      vec2 shiftedUV = uv + vec2(uv.y * 0.05, 0.0);
      vec2 st = shiftedUV * vec2(u_slidingDensity, u_slidingDensity * 0.4);
      vec2 id = floor(st);
      vec2 f = fract(st) - 0.5;
      vec2 h = hash22(id);
      
      float columnDensity = sin(id.x * 0.45) * cos(id.x * 0.15) * 0.35 + 0.65;
      if (h.x > columnDensity * 0.72) return vec3(0.0);
      
      float speed = u_rainSpeed * (0.55 + h.y * 0.65);
      float yOffset = fract(h.x * 88.31 - t * speed); 
      
      float randomRadius = 0.04 + h.y * 0.13;
      
      vec2 dropPos = vec2((h.y - 0.5) * 0.6, (yOffset - 0.5) * 2.0);
      dropPos.x += sin(yOffset * 8.5 + h.x * 6.28) * 0.1; 
      
      vec2 aspectScale = vec2(1.0, 1.0 + speed * 1.2);
      float dist = length((f - dropPos) * aspectScale);
      
      vec2 normal = vec2(0.0);
      float mask = 0.0;
      
      if (dist < randomRadius) {
        mask = 1.0;
        normal = ((f - dropPos) * aspectScale) / randomRadius;
      }
      
      float trailMask = smoothstep(0.025, 0.0, abs(f.x - dropPos.x));
      trailMask *= step(f.y, dropPos.y) * step(dropPos.y - 0.8, f.y);
      float trailNoise = sin(f.y * 65.0 + h.y * 45.0);
      
      if (trailNoise > 0.48 && trailMask > 0.0 && mask == 0.0) {
        mask = 0.55;
        normal = vec2(f.x - dropPos.x, 0.0) / 0.025;
      }
      
      return vec3(normal, mask);
    }

    // 🔒 鐵律：你滿意的靜止中水珠凝聚公式 100% 完整保留
    vec3 getStaticDroplets(vec2 uv, float t) {
      vec2 st = uv * u_staticDensity;
      vec2 id = floor(st);
      vec2 f = fract(st) - 0.5;
      vec2 h = hash22(id);
      
      float staticCluster = sin(id.x * 0.35) * cos(id.y * 0.35) * 0.25 + 0.5;
      if (h.y > staticCluster * 0.82) return vec3(0.0);

      vec2 dropPos = (h - 0.5) * 0.8;
      float life = sin(t * 0.16 + h.x * 50.0) * 0.5 + 0.5;
      float randomRadius = 0.14 * h.x * (0.25 + life * 0.75); 
      
      float dist = distance(f, dropPos);
      vec2 normal = vec2(0.0);
      float mask = 0.0;
      
      if (dist < randomRadius && randomRadius > 0.015) {
        mask = 0.5;
        normal = (f - dropPos) / randomRadius;
      }
      
      return vec3(normal, mask);
    }

    // 🔒 鐵律：你滿意的背景微觀霧滴公式 100% 完整保留
    vec3 getMicroMist(vec2 uv) {
      vec2 st = uv * u_mistDensity;
      vec2 id = floor(st);
      vec2 f = fract(st) - 0.5;
      vec2 h = hash22(id);
      
      float mask = 0.0;
      vec2 normal = vec2(0.0);
      
      float mistCluster = cos(id.x * 0.12) * sin(id.y * 0.12) * 0.3 + 0.5;
      if (h.x > (0.45 + mistCluster * 0.45)) {
        vec2 dropPos = (h - 0.5) * 0.85;
        float randomRadius = 0.08 * h.y;
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

      vec3 slideLayer = getSlidingDrops(uvAspect, iTime);
      vec3 staticLayer = getStaticDroplets(uvAspect, iTime);
      vec3 mistLayer = getMicroMist(uvAspect);
      
      float finalMask = max(slideLayer.z, max(staticLayer.z, mistLayer.z));
      
      vec2 finalNormal = slideLayer.xy;
      if (staticLayer.z > slideLayer.z) finalNormal = staticLayer.xy;
      if (mistLayer.z > max(slideLayer.z, staticLayer.z)) finalNormal = mistLayer.xy;

      vec3 glassBaseColor = vec3(0.04, 0.04, 0.05); 
      vec2 refractOffset = finalNormal * 0.048 * finalMask;

      // ── 💡 🎯【動態硬體級去殘影重構矩陣】 ──
      // 1. 安全抓取真實物理像素尺寸通道，取代原本危險的大跨度橫向 UV 浮點數
      vec2 texelSize = 1.0 / iResolution.xy;
      
      // 2. 約束動態採樣步進在極其緊密的 4.5 個實體像素範圍內（與解析度 100% 剛性掛鉤）
      float radius = (1.0 - smoothstep(0.02, 0.45, finalMask)) * 4.5;
      vec2 blurStep = texelSize * radius;
      
      // 3. 注入硬體交織雜湊微抖動（Dither Jittering），將原本多個分離的複製人殘影在每一影格徹底揉碎羽化！
      vec2 jitter = (hash22(gl_FragCoord.xy + iTime) - 0.5) * 0.45 * blurStep;

      // 對齊 image_8e336 精品緞面毛玻璃的高清絲滑卷積採樣
      vec3 blurredScene = vec3(0.0);
      blurredScene += texture2D(uHeroTex, uv + refractOffset + vec2(-1.0, -1.0) * blurStep + jitter).rgb * 0.09;
      blurredScene += texture2D(uHeroTex, uv + refractOffset + vec2( 0.0, -1.0) * blurStep + jitter).rgb * 0.12;
      blurredScene += texture2D(uHeroTex, uv + refractOffset + vec2( 1.0, -1.0) * blurStep + jitter).rgb * 0.09;
      blurredScene += texture2D(uHeroTex, uv + refractOffset + vec2(-1.0,  0.0) * blurStep + jitter).rgb * 0.12;
      blurredScene += texture2D(uHeroTex, uv + refractOffset + vec2( 0.0,  0.0) * blurStep + jitter).rgb * 0.16; // 核心錨點
      blurredScene += texture2D(uHeroTex, uv + refractOffset + vec2( 1.0,  0.0) * blurStep + jitter).rgb * 0.12;
      blurredScene += texture2D(uHeroTex, uv + refractOffset + vec2(-1.0,  1.0) * blurStep + jitter).rgb * 0.09;
      blurredScene += texture2D(uHeroTex, uv + refractOffset + vec2( 0.0,  1.0) * blurStep + jitter).rgb * 0.12;
      blurredScene += texture2D(uHeroTex, uv + refractOffset + vec2( 1.0,  1.0) * blurStep + jitter).rgb * 0.09;

      // 融合高級洗鍊的 Obsidian 曜石深岩黑底色
      vec3 mixedGlass = mix(blurredScene, glassBaseColor, 0.72);
      vec3 finalRGB = mixedGlass;

      // 優雅的斜向環境光澤絲綢反射
      float satinSheen = dot(normalize(vec3(uvAspect, 1.0)), normalize(vec3(0.35, 0.55, 1.0)));
      satinSheen = pow(max(satinSheen, 0.0), 4.5) * 0.09 * (1.0 - finalMask);
      finalRGB += vec3(0.96, 0.93, 0.88) * satinSheen;

      // 渲染水滴凸透鏡亮點
      if (finalMask > 0.01) {
        vec3 N = normalize(vec3(finalNormal, sqrt(1.0 - clamp(dot(finalNormal, finalNormal), 0.0, 1.0))));
        vec3 L = normalize(vec3(0.3, 0.6, 1.0));  
        vec3 V = vec3(0.0, 0.0, 1.0);
        vec3 H = normalize(L + V);

        float spec = pow(max(dot(N, H), 0.0), 200.0) * 2.5;
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.5) * 0.45;
        float shadow = smoothstep(0.2, -0.6, dot(N, vec3(-0.3, -0.5, 0.0))) * 0.15;

        vec3 crystalWhite = vec3(0.98, 0.97, 0.94);
        vec3 waterGlow = crystalWhite * spec + crystalWhite * fresnel - vec3(shadow);
        
        finalRGB += waterGlow * 0.45;
      }

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
      if (parseFloat(container.style.transform?.match(/-?\d+/)?.[0] || '0') < -98) {
        animId = requestAnimationFrame(loop);
        return;
      }

      uniforms.iTime.value = clock.getElapsedTime();
      if (heroTexture) heroTexture.needsUpdate = true;  

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