import * as THREE from 'three';

export function startLiquidGlass(canvas, container, zone, visibilityCheckRef) {
  
  let animId;
  let quadMesh;

  // 1. 初始化 3D 空間正交相機
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // 2. 初始化輕量化 WebGL 渲染器
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // 自動動態捕捉植物畫布 (prefaceCanvas)
  const prefaceCanvas = container.querySelector('canvas:not(.liquid-glass-layer)');
  let pTexture = null;
  if (prefaceCanvas) {
    pTexture = new THREE.CanvasTexture(prefaceCanvas);
    pTexture.minFilter = THREE.LinearFilter;
    pTexture.magFilter = THREE.LinearFilter;
  }

  // 3. 【動態 2D 品牌字體牆】：純透明通道底圖
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  const bgTexture = new THREE.CanvasTexture(bgCanvas);
  bgTexture.minFilter = THREE.LinearFilter;
  bgTexture.magFilter = THREE.LinearFilter;

  function drawBackground() {
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    bgCanvas.width = w;
    bgCanvas.height = h;

    bgCtx.clearRect(0, 0, w, h);
    bgCtx.fillStyle = "#1d1b1a";
    bgCtx.textAlign = "center";
    bgCtx.textBaseline = "middle";

    const titleSize = Math.round(w * 0.14);
    bgCtx.font = `700 ${titleSize}px 'Cinzel', 'Space Grotesk', sans-serif`;
    bgCtx.fillText("COVO", w * 0.5, h * 0.45);

    const subSize = Math.round(w * 0.018);
    bgCtx.font = `500 ${subSize}px 'Space Grotesk', sans-serif`;
    bgCtx.globalAlpha = 0.45;
    bgCtx.fillText("AESTHETIC WORKSPACES", w * 0.5, h * 0.45 + titleSize * 0.6);
    bgCtx.globalAlpha = 1.0;

    bgTexture.needsUpdate = true;
  }

  drawBackground();

  // 4. 🚀【晶瑩高透光流體著色器 - 純淨洗鍊陽光流體版】
  const vertSrc = `void main(){ gl_Position = vec4(position, 1.0); }`;
  const fragSrc = `
    precision highp float;
    uniform vec2 uRes;
    uniform sampler2D uBg;
    uniform sampler2D uPreface; 
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uMouseSpeed;

    // 經典寫實固定水波場
    float fluidField(vec2 p) {
      float wave1 = sin(p.x * 2.4 + uTime * 0.38) * cos(p.y * 2.2 + uTime * 0.28);
      float wave2 = sin(p.y * 4.2 - uTime * 0.44) * cos(p.x * 3.6 + uTime * 0.34);
      
      float baseWave = (wave1 * 0.55 + wave2 * 0.45) * 0.34; 
      
      // 滑鼠交互擴散漣漪
      float dist = distance(p, uMouse);
      float mask = smoothstep(0.80, 0.0, dist);
      float mouseRipple = sin(dist * 15.0 - uTime * 2.6) * 0.13 * mask * (0.3 + uMouseSpeed * 6.5);
      
      return baseWave + mouseRipple;
    }

    vec2 getCorrectedCoverUV(vec2 rawUV, vec2 offset) {
      vec2 clampedUV = clamp(rawUV + offset, 0.001, 0.999);
      float screenAspect = uRes.x / uRes.y;
      float imageAspect = 1920.0 / 1080.0;
      
      vec2 coverUV = clampedUV;
      if (screenAspect > imageAspect) {
        float scale = imageAspect / screenAspect;
        coverUV.y = (clampedUV.y - 0.5) * scale + 0.5;
      } else {
        float scale = screenAspect / imageAspect;
        coverUV.x = (clampedUV.x - 0.5) * scale + 0.5;
      }
      return coverUV;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      float asp = uRes.x / uRes.y;
      vec2 p = (uv - 0.5) * vec2(asp, 1.0);

      float f = fluidField(p * 1.2);

      // 有限差分法導出 3D 法線高度
      float eps = 0.009; 
      float f_x = fluidField((p + vec2(eps, 0.0)) * 1.2);
      float f_y = fluidField((p + vec2(0.0, eps)) * 1.2);
      vec2 grad = vec2(f_x - f, f_y - f) / eps;

      // 3D 立體起伏法線強度
      vec3 N = normalize(vec3(-grad * 0.42, 1.0));
      vec3 V = vec3(0.0, 0.0, 1.0);
      vec3 L = normalize(vec3(0.4, 0.6, 1.0)); 
      vec3 H = normalize(L + V);

      // 溫和高光
      float spec = pow(max(dot(N, H), 0.0), 125.0) * 0.85;
      float fresnel = 0.06 + 0.94 * pow(1.0 - max(dot(N, V), 0.0), 4.0);

      // 水體折射位移量
      vec2 refractOffset = grad * 0.056;
      vec2 refractedUV = clamp(uv + refractOffset, 0.001, 0.999);

      float plantCaStr = 0.0015 + uMouseSpeed * 0.025;
      float textCaStr = 0.0035 + uMouseSpeed * 0.055;

      // 1. 採樣動態植物底圖
      vec3 plantCA;
      plantCA.r = texture2D(uPreface, getCorrectedCoverUV(uv, refractOffset + vec2(plantCaStr, 0.0))).r;
      plantCA.g = texture2D(uPreface, getCorrectedCoverUV(uv, refractOffset)).g;
      plantCA.b = texture2D(uPreface, getCorrectedCoverUV(uv, refractOffset - vec2(plantCaStr, 0.0))).b;

      // 2. 採樣 COVO 文字圖層
      vec4 textR = texture2D(uBg, refractedUV + vec2(textCaStr, 0.0));
      vec4 textG = texture2D(uBg, refractedUV);
      vec4 textB = texture2D(uBg, refractedUV - vec2(textCaStr, 0.0));
      
      vec3 textRGB = vec3(textR.r, textG.g, textB.b);
      float textCombinedAlpha = max(textR.a, max(textG.a, textB.a));

      // 3. 圖層高級疊加
      vec3 mixedScene = mix(plantCA, textRGB, textCombinedAlpha * 0.95);

      // 高奢香檳晨光色調 (0.97, 0.91, 0.82)
      vec3 cinematicSunlight = vec3(0.97, 0.91, 0.82); 
      vec3 colorizedScene = mix(mixedScene, cinematicSunlight, 0.11);
      
      // 💡【完美清洗】：移除所有氣泡貼圖合成，回歸 100% 乾淨俐落、通透、不擋字的精品水膜
      vec3 glassFinal = colorizedScene 
                      + vec3(1.0, 0.96, 0.88) * spec * 0.68  
                      + vec3(0.98, 0.93, 0.85) * fresnel * 0.14; 

      gl_FragColor = vec4(glassFinal, 1.0);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    vertexShader: vertSrc,
    fragmentShader: fragSrc,
    uniforms: {
      uRes: { value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height) },
      uBg: { value: bgTexture },
      uPreface: { value: pTexture ? pTexture : new THREE.Texture() }, 
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(999, 999) },
      uMouseSpeed: { value: 0 }
    }
  });

  quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(quadMesh);

  let aspect = window.innerWidth / window.innerHeight;
  const mouse = { x: 999, y: 999, targetX: 0, targetY: 0, speed: 0, prevTargetX: 0, prevTargetY: 0 };

  const onPointerMove = (e) => {
    const rect = container.getBoundingClientRect();
    mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * aspect;
    mouse.targetY = 0.5 - (e.clientY - rect.top) / rect.height;

    const dx = mouse.targetX - mouse.prevTargetX;
    const dy = mouse.targetY - mouse.prevTargetY;
    mouse.speed = Math.sqrt(dx * dx + dy * dy);

    mouse.prevTargetX = mouse.targetX;
    mouse.prevTargetY = mouse.targetY;
  };
  container.addEventListener("pointermove", onPointerMove);

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    aspect = window.innerWidth / window.innerHeight;
    mat.uniforms.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
    drawBackground();
  };
  window.addEventListener("resize", onResize);

  zone.runOutsideAngular(() => {
    const loop = () => {
      if (!visibilityCheckRef.isShaderVisible) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      mat.uniforms.uTime.value = now * 0.001;

      if (pTexture) {
        pTexture.needsUpdate = true;
      }

      mouse.speed *= 0.95;
      mat.uniforms.uMouseSpeed.value = mouse.speed;

      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;
      mat.uniforms.uMouse.value.set(mouse.x, mouse.y);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
  });

  return {
    destroy: () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      mat.dispose();
      bgTexture.dispose();
      if (pTexture) pTexture.dispose();
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointermove", onPointerMove);
    }
  };
}