import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhysicsConfig, VisualConfig, CounterConfig, ProductionConfig, Ball, Particle, ProductionMode, BallShape, MelodyType, Template } from './types';
import ControlPanel from './components/ControlPanel';
import { Download, X, Play, Check, Pause as PauseIcon } from 'lucide-react';

const MELODIES: Record<MelodyType, number[]> = {
  NONE: [],
  CUSTOM: [],
  PENTATONIC: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], 
  MEGALOVANIA: [293.66, 293.66, 587.33, 440.00, 415.30, 392.00, 349.23, 293.66, 349.23, 392.00], 
  GRAVITY_FALLS: [349.23, 415.30, 466.16, 523.25, 349.23, 415.30, 466.16, 523.25],
  DOREMI: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
  MII_CHANNEL: [329.63, 440.00, 554.37, 493.88, 440.00, 329.63, 440.00, 493.88],
  WII_SHOP: [329.63, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 587.33],
  TETRIS: [659.25, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, 440.00, 523.25, 659.25],
  ZELDA: [493.88, 392.00, 293.66, 196.00, 493.88, 392.00, 293.66, 196.00],
  MARIO: [659.25, 659.25, 659.25, 523.25, 659.25, 783.99, 392.00],
  HARRY_POTTER: [493.88, 659.25, 783.99, 739.99, 659.25, 987.77, 880.00, 739.99],
  LAMOUR_TOUJOURS: [739.99, 659.25, 587.33, 659.25, 739.99, 659.25, 587.33, 554.37, 493.88, 554.37, 587.33, 554.37, 493.88, 440.00]
};

const DEFAULT_PHYSICS: PhysicsConfig = {
  gravityY: 0.6, gravityX: 0, restitution: 1.02, friction: 0.0, drag: 0.9995,
  maxSpeed: 80, spawnX: 0.5, spawnY: 0.5, initialImpulse: 20, 
  spawnType: 'random', spawnAngle: 270,
  soundEnabled: true, soundReverb: true, soundWaveform: 'sine', colorChangeOnBounce: true, 
  lockGap: false, speedIncreaseOnBounce: 0.01,
  gravityIncreaseOnBounce: 0, freezeOnFinish: true, autoSpawnOnFreeze: true,
  spikesActive: false, scriptJSON: '[]',
  soundOnCollision: true, melodyOnCollision: true, baseFreq: 200, freqStep: 15,
  soundVolume: 0.5, soundReverbDuration: 2.0,
  deterministic: true, physicsSubSteps: 8
};

const DEFAULT_VISUALS: VisualConfig = {
  ballColor: '#00ffcc', ballRadius: 25, ballShape: 'circle', 
  arcColor: '#ff0055', arcStyle: 'gradient', arcPalette: ['#ff0055', '#7000ff', '#00ffcc', '#ffff00'],
  arcGradientEnabled: true, arcGradientColors: ['#ff0055', '#7000ff'],
  arcThickness: 50, arcRadius: 320, arcGap: 45, arcSegments: 12, lineCap: 'butt', rotationSpeed: 0.02, 
  trailLength: 30, trailWidth: 1.0, trailOpacity: 0.5, showTrail: true, 
  glowEffect: true, glowBlur: 30, glowIntensity: 1.5, backgroundColor: '#050505', 
  hitFlash: true, particleCount: 35, dustIntensity: 1.0, overlayText: 'WAIT FOR IT...', 
  overlayTextY: -250, overlayFontWeight: '900', overlayTextColor: '#ffffff', overlayFontSize: 80,
  spikeCount: 12, spikeLength: 40, spikeWidth: 20, 
  spikeHollow: false, spikeColor: '#ff3333',
  show916Frame: true, melody: 'PENTATONIC', customMelody: '440, 550, 660', motionBlur: 0.2, cameraShake: 0,
  freezeGrayscale: false,
  explosionEffect: false, explosionIntensity: 1.0,
  endText: 'Like & Subscribe!',
  endSceneDuration: 4.0,
  ballImage: '',
  centerImage: '',
  showSpawnPreview: true,
  showTrajectory: true
};

const DEFAULT_COUNTER: CounterConfig = {
  enabled: true, mode: 'TIMER', seconds: 10, fontSize: 300, fontColor: '#ffffff', opacity: 0.15, 
  yOffset: 50, scale: 1.0, fontFamily: 'Poppins', fontWeight: '900', showDecimals: true, countDown: true,
  sequenceStr: "1, 2, 4, 8, 16, 32, 64, 128", mathStart: 1, mathStep: 1, mathFactor: 2,
  textPosition: 'ball'
};

const DEFAULT_PRODUCTION: ProductionConfig = {
  batchCount: 1, maxVideoDuration: 60, minVideoDuration: 0, autoStartNext: false, cinematicOut: true,
  autoSave: true, resolutionScale: 1.0,
  cinematicZoomSpeed: 0.005, cinematicDust: true,
  gpuPriority: false, forceHD: false,
  cinematicExplosion: false,
  previewBeforeSave: false
};

function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {}
  }, [key, state]);

  return [state, setState];
}

const App: React.FC = () => {
  const [physics, setPhysics] = usePersistentState<PhysicsConfig>('zen_physics_v7', DEFAULT_PHYSICS);
  const [visuals, setVisuals] = usePersistentState<VisualConfig>('zen_visuals_v7', DEFAULT_VISUALS);
  const [counter, setCounter] = usePersistentState<CounterConfig>('zen_counter_v8', DEFAULT_COUNTER);
  const [production, setProduction] = usePersistentState<ProductionConfig>('zen_production_v7', DEFAULT_PRODUCTION);
  
  const [customDefaults, setCustomDefaults] = usePersistentState<{p:PhysicsConfig, v:VisualConfig, c:CounterConfig} | null>('zen_defaults_v5', null);
  const [templates, setTemplates] = usePersistentState<Template[]>('zen_templates_v5', []);

  const [mode, setMode] = useState<ProductionMode>('ESCAPE_CHALLENGE');
  const [isRunning, setIsRunning] = useState(false); 
  const [isRecording, setIsRecording] = useState(false);
  const [batchRemaining, setBatchRemaining] = useState(0);
  const [lastBlobUrl, setLastBlobUrl] = useState<string | null>(null);
  const [reviewBlob, setReviewBlob] = useState<Blob | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);

  // Refs for State (To access in loop without re-rendering)
  const pRef = useRef(physics);
  const vRef = useRef(visuals);
  const cRef = useRef(counter);
  const prodRef = useRef(production);
  const isRunningRef = useRef(isRunning);

  useEffect(() => { pRef.current = physics; }, [physics]);
  useEffect(() => { vRef.current = visuals; }, [visuals]);
  useEffect(() => { cRef.current = counter; }, [counter]);
  useEffect(() => { prodRef.current = production; }, [production]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  // Simulation Refs
  const ballsRef = useRef<Ball[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const globalNoteIndexRef = useRef<number>(0);
  const boundaryAngleRef = useRef<number>(0);
  const flashRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null); 
  const frameHandleRef = useRef<number | null>(null);
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const scriptExecutedRef = useRef<Set<number>>(new Set());
  const simulationTimeRef = useRef<number>(0);
  const isTimeoutRef = useRef(false);
  
  const isDraggingRef = useRef(false);
  const lastDragAngleRef = useRef(0);
  
  const isEndingRef = useRef(false);
  const endingTimeRef = useRef(0);
  const arcExplodedRef = useRef(false);
  const zoomRef = useRef(1);
  const opacityRef = useRef(1);
  const cameraShakeRef = useRef(0);
  
  const recordingStartTimeRef = useRef(0);
  const recordingTimeoutRef = useRef<number | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const ballImgRef = useRef<HTMLImageElement | null>(null);
  const centerImgRef = useRef<HTMLImageElement | null>(null);

  // Image Loading
  useEffect(() => {
    if (visuals.ballImage) {
      const img = new Image();
      img.src = visuals.ballImage;
      img.onload = () => { ballImgRef.current = img; };
    } else {
      ballImgRef.current = null;
    }
  }, [visuals.ballImage]);

  useEffect(() => {
    if (visuals.centerImage) {
      const img = new Image();
      img.src = visuals.centerImage;
      img.onload = () => { centerImgRef.current = img; };
    } else {
      centerImgRef.current = null;
    }
  }, [visuals.centerImage]);

  const getEffectiveRadius = (canvasWidth: number, canvasHeight: number) => {
    const v = vRef.current;
    if (!v.show916Frame) return Math.max(0, v.arcRadius);
    const frameWidth = canvasHeight * (9/16);
    return Math.max(0, Math.min(v.arcRadius, (frameWidth / 2) - v.arcThickness - 20));
  };

  const updateReverbBuffer = useCallback((ctx: AudioContext, duration: number) => {
      const rate = ctx.sampleRate;
      const length = rate * duration; 
      const impulse = ctx.createBuffer(2, length, rate);
      for (let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
        }
      }
      return impulse;
  }, []);

  // Audio Init
  useEffect(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      if (!audioDestRef.current) {
        audioDestRef.current = ctx.createMediaStreamDestination();
      }
      if (!reverbNodeRef.current) {
        const convolver = ctx.createConvolver();
        convolver.buffer = updateReverbBuffer(ctx, physics.soundReverbDuration);
        convolver.connect(ctx.destination);
        if (audioDestRef.current) convolver.connect(audioDestRef.current);
        reverbNodeRef.current = convolver;
      }
    }
  }, []);

  // Helpers
  const getRandomColor = () => `hsl(${Math.random() * 360}, 100%, 50%)`;

  const playSfx = (ball: Ball | null, forceFreq?: number) => {
    const p = pRef.current;
    const v = vRef.current;
    if (!p.soundEnabled) return;
    const now = performance.now();
    if (ball) {
      if (now - ball.lastSoundTime < 60) return;
      ball.lastSoundTime = now;
    }

    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      let freq: number = 200;
      const basePitch = p.baseFreq;
      
      if (forceFreq) {
        freq = forceFreq;
      } else {
        let melody = MELODIES[v.melody];
        if (v.melody === 'CUSTOM') {
          melody = v.customMelody.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
          if (melody.length === 0) melody = [200, 300]; 
        }

        if (ball && melody.length > 0) {
          const scale = basePitch / 200.0; 
          freq = melody[globalNoteIndexRef.current % melody.length] * scale;
          globalNoteIndexRef.current++;
        } else if (ball) {
           if (p.deterministic) {
             freq = basePitch + Math.min(ball.bounces * p.freqStep, 2000);
           } else {
             freq = basePitch + Math.min(ball.bounces * p.freqStep, 2000);
           }
        }
      }
      
      const waveType = p.soundWaveform;
      const gain = ctx.createGain();
      const volume = 0.3 * p.soundVolume;
      
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (waveType === 'piano' ? 1.0 : 0.2));

      gain.connect(ctx.destination);
      if (audioDestRef.current) gain.connect(audioDestRef.current);

      const osc = ctx.createOscillator(); osc.type = waveType === 'piano' ? 'sine' : waveType;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.2);
      osc.connect(gain);
      osc.start(); 
      osc.stop(ctx.currentTime + 0.25);
      
      setTimeout(() => { try { osc.disconnect(); gain.disconnect(); } catch (e) {} }, 1000);

      if (p.soundReverb && reverbNodeRef.current) {
        const reverbGain = ctx.createGain(); reverbGain.gain.value = 0.4 * p.soundVolume;
        gain.connect(reverbGain); 
        reverbGain.connect(reverbNodeRef.current);
        setTimeout(() => { try { reverbGain.disconnect(); } catch(e){} }, 3000);
      }
    } catch {}
  };

  const getSpawnData = () => {
      const canvas = canvasRef.current;
      const p = pRef.current;
      const v = vRef.current;
      if (!canvas) return { x: 0, y: 0, vx: 0, vy: 0 };
      
      const width = canvas.width;
      const height = canvas.height;
      let startX = width / 2; let startY = height / 2;
      
      if (p.spawnType === 'fixed') { 
          startX = width * p.spawnX; 
          startY = height * p.spawnY; 
      }

      let angle = 0;
      if (p.spawnType === 'manual' || p.spawnType === 'fixed') {
          angle = p.spawnAngle * (Math.PI / 180); 
          if (!p.deterministic) angle += (Math.random() - 0.5) * 0.1;
      } else if (p.spawnType === 'away_from_gap') {
          const rot = boundaryAngleRef.current;
          const arcCenter = (360 - (p.lockGap ? 0 : v.arcGap)) / 2;
          angle = rot + arcCenter * (Math.PI / 180); 
          if (!p.deterministic) angle += (Math.random() - 0.5) * 1.0; 
      } else { 
          angle = p.deterministic ? 270 * Math.PI / 180 : Math.random() * Math.PI * 2; 
      }

      const impulse = p.initialImpulse;
      return {
          x: startX,
          y: startY,
          vx: Math.cos(angle) * impulse,
          vy: Math.sin(angle) * impulse
      };
  };

  const spawn = (color?: string) => {
    const data = getSpawnData();
    const v = vRef.current;
    const c = cRef.current;
    
    let initVal: number | string = 0;
    if (c.mode === 'SEQUENCE') {
        const parts = c.sequenceStr.split(',').map(s => s.trim());
        initVal = parts[0] || "";
    } else if (c.mode === 'LINEAR' || c.mode === 'EXPONENTIAL') {
        initVal = c.mathStart;
    }

    const newBall: Ball = {
      id: Math.random().toString(36).substring(7),
      x: data.x, y: data.y,
      vx: data.vx, vy: data.vy,
      radius: v.ballRadius, shape: v.ballShape,
      color: color || v.ballColor,
      history: [], timerFrames: c.seconds,
      currentValue: initVal,
      isEscaping: false, isFrozen: false, bounces: 0, startTime: Date.now(), opacity: 1, sizeMultiplier: 1,
      lastSoundTime: 0,
      mass: v.ballRadius * v.ballRadius
    };
    ballsRef.current.push(newBall);
  };

  const handleExplosion = (b: Ball, color: string) => {
    const v = vRef.current;
    const intensity = v.explosionIntensity || 1;
    const count = Math.min(150 * intensity, 300); 
    if (particlesRef.current.length > 1500) return;

    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: b.x,
        y: b.y,
        vx: (Math.random() - 0.5) * 30 * intensity,
        vy: (Math.random() - 0.5) * 30 * intensity,
        life: 1.0 + Math.random() * 2,
        color: color,
        size: Math.random() * 5 + 1,
        type: 'dust'
      });
    }
    b.opacity = 0;
  };

  const resetSimulation = useCallback(() => {
    if (customDefaults) {
        setPhysics(customDefaults.p);
        setVisuals(customDefaults.v);
        setCounter(customDefaults.c);
    }
    
    ballsRef.current = [];
    particlesRef.current = [];
    
    globalNoteIndexRef.current = 0;
    flashRef.current = 0;
    isEndingRef.current = false;
    arcExplodedRef.current = false;
    zoomRef.current = 1;
    opacityRef.current = 1;
    cameraShakeRef.current = 0;
    simulationTimeRef.current = 0;
    boundaryAngleRef.current = 0; 
    scriptExecutedRef.current.clear();
    
    spawn();
    setIsRunning(false); 
  }, [customDefaults]);

  // Update Canvas Size when production settings change (Force HD)
  useEffect(() => {
      const handleResize = () => { 
        if(canvasRef.current) {
            const p = prodRef.current;
            const winW = window.innerWidth;
            const winH = window.innerHeight;

            if (p.forceHD) {
                canvasRef.current.width = 1080; 
                canvasRef.current.height = 1920;
                canvasRef.current.style.width = '100%';
                canvasRef.current.style.height = '100%';
                canvasRef.current.style.objectFit = 'contain';
            } else {
                 const dpr = (window.devicePixelRatio || 1) * (p.resolutionScale || 1);
                 canvasRef.current.width = winW * dpr; 
                 canvasRef.current.height = winH * dpr;
                 canvasRef.current.style.width = `${winW}px`;
                 canvasRef.current.style.height = `${winH}px`;
                 canvasRef.current.style.objectFit = 'none';
            }
        } 
      };
      
      handleResize();
      // Important: Reset simulation when resolution mode changes to ensure bounds are correct
      resetSimulation(); 

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, [production.forceHD, production.resolutionScale, resetSimulation]);

  const findMagicSpawn = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const p = pRef.current;
      const v = vRef.current;
      
      const width = canvas.width;
      const height = canvas.height;
      const center = { x: width / 2, y: height / 2 };
      const currentRadius = Math.max(0, v.arcRadius); 
      
      let bestAngle = p.spawnAngle;
      let bestScore = -Infinity;
      
      for(let i=0; i<36; i++) {
          const testAngle = i * 10;
          const rad = testAngle * Math.PI / 180;
          
          let simBall = {
              x: width * p.spawnX, y: height * p.spawnY,
              vx: Math.cos(rad) * p.initialImpulse,
              vy: Math.sin(rad) * p.initialImpulse,
              radius: v.ballRadius
          };
          
          let score = 0;
          let frames = 0;
          let bounces = 0;
          let escaped = false;
          
          while(frames < 600 && !escaped) { 
              simBall.vx += p.gravityX; simBall.vy += p.gravityY;
              simBall.x += simBall.vx; simBall.y += simBall.vy;
              
              const dx = simBall.x - center.x;
              const dy = simBall.y - center.y;
              const d = Math.sqrt(dx*dx + dy*dy);
              
              if (d > currentRadius - simBall.radius) {
                  bounces++;
                  const nx = dx/d; const ny = dy/d;
                  const dot = simBall.vx * nx + simBall.vy * ny;
                  simBall.vx -= 2 * dot * nx;
                  simBall.vy -= 2 * dot * ny;
                  simBall.x = center.x + nx * (currentRadius - simBall.radius - 1);
                  simBall.y = center.y + ny * (currentRadius - simBall.radius - 1);
              }
              if (d > currentRadius + 50) escaped = true;
              frames++;
          }
          score = bounces;
          if (score > bestScore) {
              bestScore = score;
              bestAngle = testAngle;
          }
      }
      
      setPhysics(prev => ({ ...prev, spawnAngle: bestAngle, spawnType: 'fixed' })); 
      resetSimulation();
  }, [resetSimulation]);

  const drawShape = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, shape: BallShape) => {
    if (r <= 0) return false;
    if (shape === 'image' && ballImgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(ballImgRef.current, x - r, y - r, r * 2, r * 2);
        ctx.restore();
        return true;
    } else if (shape === 'circle') {
        ctx.arc(x, y, r, 0, Math.PI * 2);
    } else if (shape === 'square') {
        ctx.rect(x - r, y - r, r * 2, r * 2);
    } else if (shape === 'triangle') {
      ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x - r * 1.1, y + r); ctx.lineTo(x + r * 1.1, y + r); ctx.closePath();
    } else if (shape === 'hexagon') {
      for(let i=0; i<6; i++) {
        const ang = (i * 60) * Math.PI / 180;
        const px = x + r * 1.15 * Math.cos(ang);
        const py = y + r * 1.15 * Math.sin(ang);
        if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (shape === 'star') {
      for(let i=0; i<10; i++) {
        const rad = i % 2 === 0 ? r * 1.5 : r * 0.7;
        const ang = (i * 36) * Math.PI / 180;
        const px = x + rad * Math.cos(ang);
        const py = y + rad * Math.sin(ang);
        if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }
    return false;
  };

  const getShapeExtent = (shape: BallShape, r: number, nx: number, ny: number) => {
      switch(shape) {
          case 'circle': return r;
          case 'image': return r;
          case 'square': 
              return r * (Math.abs(nx) + Math.abs(ny));
          case 'triangle':
              return Math.max(
                  ny * -1.2 * r,
                  nx * -1.1 * r + ny * r,
                  nx * 1.1 * r + ny * r
              );
          case 'hexagon':
              let maxHex = -Infinity;
              for(let i=0; i<6; i++) {
                  const ang = i * 60 * Math.PI / 180;
                  const vx = Math.cos(ang) * 1.15 * r;
                  const vy = Math.sin(ang) * 1.15 * r;
                  maxHex = Math.max(maxHex, vx * nx + vy * ny);
              }
              return maxHex;
          case 'star':
              let maxStar = -Infinity;
              for(let i=0; i<5; i++) {
                  const ang = (i * 72 - 90) * Math.PI / 180;
                  const vx = Math.cos(ang) * 1.5 * r;
                  const vy = Math.sin(ang) * 1.5 * r;
                  maxStar = Math.max(maxStar, vx * nx + vy * ny);
              }
              return maxStar;
          default: return r;
      }
  };

  const getMaxRadius = (shape: BallShape, r: number) => {
      switch(shape) {
          case 'square': return r * 1.414;
          case 'triangle': return r * 1.5;
          case 'star': return r * 1.5;
          case 'hexagon': return r * 1.15;
          default: return r;
      }
  };

  const triggerCinematicEnd = () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    endingTimeRef.current = Date.now();
    cameraShakeRef.current = 30.0;

    const canvas = canvasRef.current;
    if (canvas && prodRef.current.cinematicExplosion) {
      const width = canvas.width;
      const height = canvas.height;
      const center = { x: width / 2, y: height / 2 };
      const currentRadius = getEffectiveRadius(width, height);
      
      arcExplodedRef.current = true;
      const particleCount = 1000; 
      for (let i = 0; i < particleCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r = currentRadius + (Math.random() - 0.5) * vRef.current.arcThickness;
        particlesRef.current.push({
          x: center.x + Math.cos(ang) * r,
          y: center.y + Math.sin(ang) * r,
          vx: Math.cos(ang) * (Math.random() * 30 + 15),
          vy: Math.sin(ang) * (Math.random() * 30 + 15),
          life: 2.5 + Math.random() * 2.5,
          color: vRef.current.arcColor,
          size: Math.random() * 6 + 2,
          type: 'dust'
        });
      }

      if (pRef.current.spikesActive) {
        for(let i=0; i<vRef.current.spikeCount; i++) {
           const spikeAngle = i * (2 * Math.PI / vRef.current.spikeCount);
           const sx = center.x + Math.cos(spikeAngle) * currentRadius;
           const sy = center.y + Math.sin(spikeAngle) * currentRadius;
           for(let j=0; j<10; j++) {
              particlesRef.current.push({
                x: sx, y: sy,
                vx: (Math.random()-0.5)*40, vy: (Math.random()-0.5)*40,
                life: 2.0, color: vRef.current.spikeColor, size: 4
              });
           }
        }
      }

      ballsRef.current.forEach(b => {
        if (b.opacity > 0) handleExplosion(b, b.color);
      });
      playSfx(null, 150); 
    }
  };

  const stopRecording = () => {
      if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
      }
      if (recorderRef.current && recorderRef.current.state === 'recording') {
          recorderRef.current.stop();
          recorderRef.current = null;
      }
  };

  const startRecording = () => {
    if (isRecording) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsRecording(true);
    chunksRef.current = [];
    
    const stream = canvas.captureStream(60);
    if (pRef.current.soundEnabled && audioDestRef.current) {
        const audioTrack = audioDestRef.current.stream.getAudioTracks()[0];
        if (audioTrack) stream.addTrack(audioTrack);
    }
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setLastBlobUrl(url);
        setReviewUrl(url);
        setIsRecording(false);
    };
    
    recorder.start();
    recorderRef.current = recorder;
    
    if (prodRef.current.maxVideoDuration > 0) {
        recordingTimeoutRef.current = window.setTimeout(stopRecording, prodRef.current.maxVideoDuration * 1000);
    }
  };

  const executeScript = () => {
    try {
        const script = JSON.parse(pRef.current.scriptJSON);
        if (!Array.isArray(script)) return;
        
        script.forEach((cmd: any, idx: number) => {
            if (scriptExecutedRef.current.has(idx)) return;
            if (simulationTimeRef.current >= cmd.time) {
                scriptExecutedRef.current.add(idx);
                if (cmd.type === 'gravity') setPhysics(prev => ({...prev, gravityY: cmd.value}));
                if (cmd.type === 'gravityX') setPhysics(prev => ({...prev, gravityX: cmd.value}));
                if (cmd.type === 'speed') setPhysics(prev => ({...prev, maxSpeed: cmd.value}));
                if (cmd.type === 'radius') setVisuals(prev => ({...prev, ballRadius: cmd.value}));
                if (cmd.type === 'spawn') spawn();
                if (cmd.type === 'text') setVisuals(prev => ({...prev, overlayText: cmd.value}));
                if (cmd.type === 'color') setVisuals(prev => ({...prev, ballColor: cmd.value}));
            }
        });
    } catch (e) {}
  };

  const update = () => {
    const now = performance.now();
    
    if (!isRunningRef.current) {
        lastTimeRef.current = now; 
        return;
    }
    
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;

    const canvas = canvasRef.current; if (!canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const center = { x: width / 2, y: height / 2 };
    const p = pRef.current; const v = vRef.current;
    const c = cRef.current;
    const currentRadius = getEffectiveRadius(width, height);

    simulationTimeRef.current += dt;
    executeScript();

    if (particlesRef.current.length > 0) {
        particlesRef.current = particlesRef.current.map(part => ({
        ...part, x: part.x + part.vx * dt * 60, y: part.y + part.vy * dt * 60, 
        vy: part.vy + 0.25 * dt * 60, life: part.life - 0.015 * dt * 60
        })).filter(part => part.life > 0);
    }
    
    if (flashRef.current > 0) flashRef.current -= 0.05 * dt * 60;
    if (cameraShakeRef.current > 0) cameraShakeRef.current *= 0.95;

    if (isEndingRef.current) {
      const elapsed = Date.now() - endingTimeRef.current;
      const prod = prodRef.current; 

      if (prod.cinematicOut) {
        if (zoomRef.current < 5) {
            zoomRef.current += prod.cinematicZoomSpeed * dt * 60; 
        }
        opacityRef.current = Math.max(0, 1 - elapsed / 3000);
        
        if (prod.cinematicDust && Math.random() < 0.3) {
             const angle = Math.random() * Math.PI * 2;
             const r = Math.random() * currentRadius;
             particlesRef.current.push({
                 x: center.x + Math.cos(angle) * r,
                 y: center.y + Math.sin(angle) * r,
                 vx: (Math.random() - 0.5) * 2,
                 vy: (Math.random() - 0.5) * 2,
                 life: 1.0,
                 color: '#ffffff',
                 size: Math.random() * 2,
                 type: 'dust'
             });
        }
      }
      
      const duration = (v.endSceneDuration || 4.0) * 1000;
      if (elapsed > duration) {
          stopRecording();
      }
      return;
    }
    
    if (!isDraggingRef.current) {
        boundaryAngleRef.current += v.rotationSpeed * dt * 60;
    }

    const SUB_STEPS = p.physicsSubSteps || 8;
    const subDt = dt / SUB_STEPS;
    
    for(let step = 0; step < SUB_STEPS; step++) {
        let shouldSpawn = false;

        ballsRef.current.forEach(b => {
          if (p.freezeOnFinish && b.timerFrames <= 0 && !b.isFrozen && c.mode === 'TIMER') {
            b.isFrozen = true; b.vx = 0; b.vy = 0;
            if (v.explosionEffect) {
              handleExplosion(b, b.color);
            }
            if (p.autoSpawnOnFreeze) shouldSpawn = true; 
          }

          if (!b.isFrozen) {
            b.vx += p.gravityX * subDt * 60; b.vy += p.gravityY * subDt * 60;
            b.vx *= Math.pow(p.drag, subDt * 60); b.vy *= Math.pow(p.drag, subDt * 60);
            
            const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            if (spd > p.maxSpeed) { b.vx = (b.vx / spd) * p.maxSpeed; b.vy = (b.vy / spd) * p.maxSpeed; }
            
            b.x += b.vx * subDt * 60; b.y += b.vy * subDt * 60;
          }

          const dx = b.x - center.x; const dy = b.y - center.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          
          // Enhanced collision logic: Calculate precise extent of shape in direction (dx, dy)
          const nx = dx / d; const ny = dy / d;
          const shapeExtent = getShapeExtent(b.shape, b.radius * b.sizeMultiplier, nx, ny);
          const wallDist = currentRadius - shapeExtent;
          
          if (p.spikesActive && !b.isFrozen && !b.isEscaping && d > currentRadius - v.spikeLength - b.radius) {
            // Existing spike logic remains, it is basically angular check on spikes.
            const angle = Math.atan2(dy, dx);
            let relAngle = angle - boundaryAngleRef.current;
            relAngle = relAngle % (2 * Math.PI);
            if (relAngle < 0) relAngle += 2 * Math.PI;
            
            // Spike collision logic... (kept same as before, simplified for brevity in thought process but kept in code)
            const spikeCount = v.spikeCount;
            const spikeInterval = (2 * Math.PI) / spikeCount;
            const spikeIndex = Math.round(relAngle / spikeInterval);
            const nearestSpikeAngle = spikeIndex * spikeInterval;
            let normalizedSpikeAngle = nearestSpikeAngle % (2 * Math.PI);
            if (normalizedSpikeAngle < 0) normalizedSpikeAngle += 2 * Math.PI;
            
            // Check if spike is in the solid part (not in gap)
            const isLocked = p.lockGap && b.timerFrames > 0;
            const currentGap = isLocked ? 0 : v.arcGap;
            const gapRad = currentGap * (Math.PI / 180);
            
            // NOTE: Visual gap is centered at 0 relative angle. 
            // So Solid is outside [-gap/2, gap/2].
            // Spike check:
            let spikeRel = normalizedSpikeAngle; 
            if (spikeRel > Math.PI) spikeRel -= 2 * Math.PI; // -PI to PI
            
            if (Math.abs(spikeRel) > gapRad / 2) { 
                const diff = Math.abs(relAngle - nearestSpikeAngle);
                const angularHalfWidth = (v.spikeWidth / 2) / d;
                if (diff < angularHalfWidth + 0.05) {
                    b.isFrozen = true; b.vx = 0; b.vy = 0;
                    b.color = v.spikeColor; 
                    if (v.explosionEffect) handleExplosion(b, v.spikeColor);
                    else {
                      for(let i=0; i<10; i++) particlesRef.current.push({ x: b.x, y: b.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 1, color: v.spikeColor, size: Math.random()*5 + 2 });
                    }
                    shouldSpawn = true;
                    playSfx(b, 100); 
                }
            }
          }

          if (d >= wallDist && !b.isEscaping && !b.isFrozen) {
            // Gap Logic
            const ballAngle = Math.atan2(dy, dx) * 180 / Math.PI; // -180 to 180
            const rotAngle = (boundaryAngleRef.current * 180 / Math.PI) % 360;
            
            // Calculate difference in range [-180, 180]
            let angleDiff = ballAngle - rotAngle;
            while (angleDiff <= -180) angleDiff += 360;
            while (angleDiff > 180) angleDiff -= 360;
            
            // Determine gap size
            const isLocked = p.lockGap && c.mode === 'TIMER' && b.timerFrames > 0;
            const currentGap = isLocked ? 0 : v.arcGap;
            
            // Calculate angular width of the ball at this distance
            const maxR = getMaxRadius(b.shape, b.radius * b.sizeMultiplier);
            const ballHalfAngle = (Math.asin(Math.min(1, maxR / d)) * 180 / Math.PI);
            
            // Check if fully in gap
            const gapHalf = currentGap / 2;
            const isThrough = Math.abs(angleDiff) <= (gapHalf - ballHalfAngle);

            if (!isThrough) {
              const dot = b.vx * nx + b.vy * ny;
              if (dot > 0) {
                b.vx = (b.vx - 2 * dot * nx) * p.restitution;
                b.vy = (b.vy - 2 * dot * ny) * p.restitution;
                b.vx *= (1 + p.speedIncreaseOnBounce); b.vy *= (1 + p.speedIncreaseOnBounce);
                
                // Position correction: Move ball exactly to the touch point to prevent sinking
                b.x = center.x + nx * (wallDist - 0.05); 
                b.y = center.y + ny * (wallDist - 0.05); 
                
                b.bounces++;
                if (p.colorChangeOnBounce && !p.deterministic) b.color = getRandomColor();
                
                // --- Counter Update Logic ---
                if (c.mode === 'SEQUENCE') {
                   const parts = c.sequenceStr.split(',').map(s => s.trim());
                   if (parts.length > 0) {
                       b.currentValue = parts[b.bounces % parts.length];
                   }
                } else if (c.mode === 'LINEAR') {
                   if (typeof b.currentValue === 'number') b.currentValue += c.mathStep;
                   else b.currentValue = c.mathStart;
                } else if (c.mode === 'EXPONENTIAL') {
                   if (typeof b.currentValue === 'number') b.currentValue *= c.mathFactor;
                   else b.currentValue = c.mathStart;
                }
                // ----------------------------

                playSfx(b);
                if (v.hitFlash) flashRef.current = 1;
                for(let i=0; i<v.particleCount; i++) {
                  particlesRef.current.push({ x: b.x, y: b.y, vx: (Math.random()-0.5)*12 - nx*5, vy: (Math.random()-0.5)*12 - ny*5, life: 1, color: b.color, size: Math.random()*4 + 1 });
                }
              }
            } else if (d > currentRadius + maxR + 20) {
              // Only escape if we are comfortably outside to prevent visual popping
              b.isEscaping = true;
              triggerCinematicEnd();
            }
          }
        });
        
        if (shouldSpawn) spawn();

        for (let i = 0; i < ballsRef.current.length; i++) {
          for (let j = i + 1; j < ballsRef.current.length; j++) {
            const b1 = ballsRef.current[i];
            const b2 = ballsRef.current[j];
            if (b1.opacity === 0 || b2.opacity === 0) continue; 
            const dx = b2.x - b1.x; const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = b1.radius + b2.radius;

            if (dist < minDist) {
              const nx = dx / dist; const ny = dy / dist;
              const overlap = minDist - dist;
              
              if (b1.isFrozen || b2.isFrozen) {
                 if (!b1.isFrozen) {
                  b1.x -= nx * overlap; b1.y -= ny * overlap;
                  const dot = b1.vx * nx + b1.vy * ny;
                  if (dot > 0) {
                    b1.vx -= 2 * dot * nx * p.restitution; b1.vy -= 2 * dot * ny * p.restitution;
                    if (p.colorChangeOnBounce && !p.deterministic) b1.color = getRandomColor();
                    if (p.soundOnCollision) {
                       if (p.melodyOnCollision) playSfx(b1);
                       else playSfx(b1, p.baseFreq + Math.random() * p.freqStep * 10);
                    }
                  }
                } else if (!b2.isFrozen) {
                  b2.x += nx * overlap; b2.y += ny * overlap;
                  const dot = b2.vx * nx + b2.vy * ny;
                  if (dot < 0) {
                    b2.vx -= 2 * dot * nx * p.restitution; b2.vy -= 2 * dot * ny * p.restitution;
                    if (p.colorChangeOnBounce && !p.deterministic) b2.color = getRandomColor();
                    if (p.soundOnCollision) {
                       if (p.melodyOnCollision) playSfx(b2);
                       else playSfx(b2, p.baseFreq + Math.random() * p.freqStep * 10);
                    }
                  }
                }
              } else {
                const m1 = b1.mass || 1;
                const m2 = b2.mass || 1;
                const invM1 = 1 / m1;
                const invM2 = 1 / m2;
                const totalInvMass = invM1 + invM2;
                const movePer = overlap / totalInvMass;
                b1.x -= nx * movePer * invM1; b1.y -= ny * movePer * invM1;
                b2.x += nx * movePer * invM2; b2.y += ny * movePer * invM2;
                const v1n = b1.vx * nx + b1.vy * ny; 
                const v2n = b2.vx * nx + b2.vy * ny;
                const vRel = v1n - v2n;
                if (vRel > 0) {
                   const e = p.restitution;
                   const impulseScalar = -(1 + e) * vRel / totalInvMass;
                   const ix = impulseScalar * nx;
                   const iy = impulseScalar * ny;
                   b1.vx += ix * invM1; b1.vy += iy * invM1;
                   b2.vx -= ix * invM2; b2.vy -= iy * invM2;
                   if (p.colorChangeOnBounce && !p.deterministic) { b1.color = getRandomColor(); b2.color = getRandomColor(); }
                   
                   if (p.soundOnCollision) {
                       if (p.melodyOnCollision) {
                           playSfx(b1);
                       } else {
                           const randomPitch = p.baseFreq + Math.random() * p.freqStep * 10;
                           playSfx(b1, randomPitch);
                       }
                   }

                   if (step === 0 && Math.abs(impulseScalar) > 5) {
                      const midX = b1.x + nx * b1.radius; const midY = b1.y + ny * b1.radius;
                      for(let k=0; k<4; k++) particlesRef.current.push({ x: midX, y: midY, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 0.8, color: '#ffffff', size: Math.random()*2 + 1 });
                   }
                }
              }
            }
          }
        }
    }

    ballsRef.current.forEach((b, index) => {
        if (v.showTrail && !b.isFrozen && b.opacity > 0) {
            const lastPos = b.history[b.history.length - 1];
            // Only push if moved significantly to prevent blob artifact when stopped
            if (!lastPos || Math.hypot(b.x - lastPos.x, b.y - lastPos.y) > 2) {
                b.history.push({ x: b.x, y: b.y });
                if (b.history.length > v.trailLength) b.history.shift();
            }
        }
        if (cRef.current.enabled && !b.isFrozen && !b.isEscaping && cRef.current.mode === 'TIMER') {
            b.timerFrames = Math.max(0, b.timerFrames - dt);
        }
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const center = { x: width / 2, y: height / 2 };
    const v = vRef.current;
    const p = pRef.current;
    const c = cRef.current;
    const currentRadius = getEffectiveRadius(width, height);

    // Clear
    ctx.fillStyle = v.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();
    
    // Shake
    if (cameraShakeRef.current > 0) {
        const dx = (Math.random() - 0.5) * cameraShakeRef.current;
        const dy = (Math.random() - 0.5) * cameraShakeRef.current;
        ctx.translate(dx, dy);
    }
    
    // Zoom out/in for cinematic
    if (isEndingRef.current && prodRef.current.cinematicOut) {
         ctx.translate(center.x, center.y);
         ctx.scale(zoomRef.current, zoomRef.current);
         ctx.translate(-center.x, -center.y);
    }

    // Draw Background/Center Image
    if (v.centerImage && centerImgRef.current) {
         const size = Math.min(width, height) * 0.4;
         ctx.save();
         ctx.globalAlpha = 0.8;
         ctx.drawImage(centerImgRef.current, center.x - size/2, center.y - size/2, size, size);
         ctx.restore();
    }

    // Draw Arc
    if (!arcExplodedRef.current) {
        // Visual Logic: Draw arc starting from (rot + gap/2) for (360 - gap) degrees.
        // This visually creates a gap centered at `rot`.
        // This matches the physics logic: gap is centered at `rot`.
        const isLocked = p.lockGap && c.mode === 'TIMER' && ballsRef.current.some(b => b.timerFrames > 0 && !b.isFrozen);
        const sweep = 360 - (isLocked ? 0 : v.arcGap);
        const startRad = boundaryAngleRef.current + (v.arcGap/2) * (Math.PI/180);
        
        ctx.lineWidth = v.arcThickness;
        ctx.lineCap = v.lineCap;

        if (v.arcStyle === 'multicolor' || v.arcStyle === 'rainbow') {
             const segmentCount = v.arcSegments || 12; // Default to 12 if 0
             const totalSweepRad = sweep * (Math.PI / 180);
             const segmentAngle = totalSweepRad / segmentCount;
             
             for (let i = 0; i < segmentCount; i++) {
                 const segStart = startRad + i * segmentAngle;
                 const segEnd = segStart + segmentAngle + 0.01; // Overlap slightly to prevent hairlines
                 
                 ctx.beginPath();
                 ctx.arc(center.x, center.y, currentRadius, segStart, segEnd);
                 
                 if (v.arcStyle === 'rainbow') {
                     ctx.strokeStyle = `hsl(${i * (360 / segmentCount)}, 100%, 50%)`;
                 } else {
                     ctx.strokeStyle = v.arcPalette[i % v.arcPalette.length] || v.arcColor;
                 }
                 
                 if (v.glowEffect) {
                     ctx.shadowBlur = v.glowBlur;
                     ctx.shadowColor = ctx.strokeStyle as string;
                 }
                 
                 if (flashRef.current > 0) {
                    ctx.strokeStyle = 'white';
                    ctx.shadowColor = 'white';
                    ctx.shadowBlur = v.glowBlur * 2;
                 }
                 
                 ctx.stroke();
             }
             ctx.shadowBlur = 0;
        } else {
            // Standard Solid or Gradient Arc (Single Path)
            const endRad = startRad + sweep * (Math.PI/180);
            ctx.beginPath();
            ctx.arc(center.x, center.y, currentRadius, startRad, endRad);
            
            if (v.arcStyle === 'gradient' && v.arcGradientColors) {
                const grad = ctx.createLinearGradient(center.x - currentRadius, center.y - currentRadius, center.x + currentRadius, center.y + currentRadius);
                grad.addColorStop(0, v.arcGradientColors[0]);
                grad.addColorStop(1, v.arcGradientColors[1]);
                ctx.strokeStyle = grad;
            } else {
                 ctx.strokeStyle = v.arcColor;
            }
            
            if (v.glowEffect) {
                ctx.shadowBlur = v.glowBlur;
                ctx.shadowColor = ctx.strokeStyle as string;
            }
            
            if (flashRef.current > 0) {
                ctx.strokeStyle = 'white';
                ctx.shadowColor = 'white';
                ctx.shadowBlur = v.glowBlur * 2;
            }
            
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    // Draw Spikes
    if (p.spikesActive && !arcExplodedRef.current) {
        const spikeCount = v.spikeCount;
        const interval = (Math.PI * 2) / spikeCount;
        
        // Spike visual check needs to align with gap center logic
        // Gap is at boundaryAngleRef.current.
        // Solid is outside [-gap/2, gap/2] relative to that.
        const isLocked = p.lockGap && c.mode === 'TIMER' && ballsRef.current.some(b => b.timerFrames > 0 && !b.isFrozen);
        const currentGap = isLocked ? 0 : v.arcGap;
        const gapRad = currentGap * (Math.PI / 180);

        for (let i = 0; i < spikeCount; i++) {
            const ang = boundaryAngleRef.current + i * interval;
            
            // Check if spike is in solid region
            let rel = (ang - boundaryAngleRef.current) % (Math.PI * 2);
            if (rel < 0) rel += Math.PI * 2;
            if (rel > Math.PI) rel -= 2 * Math.PI; // -PI to PI
            
            if (Math.abs(rel) > gapRad / 2) {
                const sx = center.x + Math.cos(ang) * (currentRadius - v.arcThickness/2);
                const sy = center.y + Math.sin(ang) * (currentRadius - v.arcThickness/2);
                
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(ang + Math.PI/2);
                
                ctx.beginPath();
                ctx.moveTo(-v.spikeWidth/2, 0);
                ctx.lineTo(0, -v.spikeLength);
                ctx.lineTo(v.spikeWidth/2, 0);
                ctx.closePath();
                
                ctx.fillStyle = v.spikeColor;
                if (v.spikeHollow) {
                    ctx.strokeStyle = v.spikeColor;
                    ctx.stroke();
                } else {
                    ctx.fill();
                }
                ctx.restore();
            }
        }
    }

    // Draw Particles
    particlesRef.current.forEach(pt => {
        ctx.globalAlpha = Math.min(1, pt.life);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // Draw Balls
    ballsRef.current.forEach((b, index) => {
        if (b.opacity <= 0) return;
        
        // Trail
        if (v.showTrail && b.history.length > 0) {
            ctx.beginPath();
            ctx.moveTo(b.history[0].x, b.history[0].y);
            for (const h of b.history) ctx.lineTo(h.x, h.y);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = (b.radius * 2) * v.trailWidth;
            ctx.strokeStyle = b.color;
            ctx.globalAlpha = v.trailOpacity * b.opacity;
            ctx.stroke();
        }
        
        ctx.globalAlpha = b.opacity;
        // Ball Shape
        ctx.save();
        ctx.translate(b.x, b.y);
        
        if (v.glowEffect) {
            ctx.shadowBlur = v.glowBlur;
            ctx.shadowColor = b.color;
        }
        
        if (b.shape === 'image' && ballImgRef.current) {
             ctx.beginPath();
             ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
             ctx.clip();
             ctx.drawImage(ballImgRef.current, -b.radius, -b.radius, b.radius*2, b.radius*2);
        } else {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            if (b.shape === 'square') ctx.rect(-b.radius, -b.radius, b.radius*2, b.radius*2);
            else if (b.shape === 'triangle') {
                ctx.moveTo(0, -b.radius * 1.2);
                ctx.lineTo(-b.radius, b.radius);
                ctx.lineTo(b.radius, b.radius);
                ctx.closePath();
            } else if (b.shape === 'hexagon') {
                 for(let i=0; i<6; i++) {
                     const a = i * Math.PI / 3;
                     ctx.lineTo(Math.cos(a)*b.radius, Math.sin(a)*b.radius);
                 }
                 ctx.closePath();
            } else {
                ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
            }
            ctx.fill();
        }
        ctx.restore();

        // Text
        if (c.enabled && !b.isEscaping && b.opacity > 0.5) {
             // If center mode, only draw for the first ball to avoid stacking
             if (c.textPosition === 'center' && index > 0) return;

             ctx.save();
             ctx.globalAlpha = c.opacity * b.opacity;
             ctx.fillStyle = c.fontColor;
             
             let fontSize = Math.floor(b.radius);
             if (c.textPosition === 'center') {
                 fontSize = c.fontSize; // Use the configured size for center
             }

             ctx.font = `${c.fontWeight} ${fontSize}px ${cRef.current.fontFamily}`;
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             
             let txt = "";
             if (c.mode === 'TIMER') {
                 if (c.showDecimals) txt = Math.max(0, b.timerFrames).toFixed(2);
                 else txt = Math.ceil(Math.max(0, b.timerFrames)).toString();
             }
             else if (typeof b.currentValue === 'number') {
                 if (c.showDecimals) txt = b.currentValue.toFixed(2); 
                 else txt = Math.floor(b.currentValue).toString();
             }
             else txt = b.currentValue.toString();
             
             const tx = c.textPosition === 'center' ? center.x : b.x;
             const ty = c.textPosition === 'center' ? center.y + c.yOffset : b.y;
             
             ctx.fillText(txt, tx, ty);
             ctx.restore();
        }
    });

    // Overlay Text
    if (v.overlayText) {
        ctx.fillStyle = v.overlayTextColor;
        ctx.font = `${v.overlayFontWeight} ${v.overlayFontSize}px ${cRef.current.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(v.overlayText, center.x, center.y + v.overlayTextY);
    }

    // End Text
    if (isEndingRef.current && v.endText) {
         ctx.save();
         ctx.translate(center.x, center.y);
         ctx.fillStyle = 'white';
         ctx.font = `900 80px sans-serif`;
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText(v.endText, 0, 0);
         ctx.restore();
    }

    ctx.restore(); // Restore shake/zoom
  };

  const loop = useCallback(() => {
     update();
     draw();
     frameHandleRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
     frameHandleRef.current = requestAnimationFrame(loop);
     return () => { if (frameHandleRef.current) cancelAnimationFrame(frameHandleRef.current); };
  }, [loop]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none text-white">
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full touch-none"
          onPointerDown={(e) => {
            isDraggingRef.current = true;
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width/2;
                const y = e.clientY - rect.top - rect.height/2;
                lastDragAngleRef.current = Math.atan2(y, x);
            }
          }}
          onPointerMove={(e) => {
             if (isDraggingRef.current && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width/2;
                const y = e.clientY - rect.top - rect.height/2;
                const currentAngle = Math.atan2(y, x);
                let delta = currentAngle - lastDragAngleRef.current;
                
                // Normalize delta to -PI to PI to prevent jumps when crossing the boundary
                if (delta > Math.PI) delta -= 2 * Math.PI;
                if (delta < -Math.PI) delta += 2 * Math.PI;
                
                boundaryAngleRef.current += delta;
                lastDragAngleRef.current = currentAngle;
             }
          }}
          onPointerUp={() => isDraggingRef.current = false}
          onPointerLeave={() => isDraggingRef.current = false}
        />
        <ControlPanel 
            physics={physics} setPhysics={setPhysics}
            visuals={visuals} setVisuals={setVisuals}
            counter={counter} setCounter={setCounter}
            production={production} setProduction={setProduction}
            mode={mode} setMode={setMode}
            isRunning={isRunning} setIsRunning={setIsRunning}
            onReset={resetSimulation}
            onRestoreDefaults={() => { localStorage.clear(); window.location.reload(); }}
            onStartBatch={() => { setIsRunning(true); startRecording(); }}
            isRecording={isRecording}
            onAddBall={() => spawn()}
            currentTake={1}
            templates={templates}
            saveTemplate={(name) => setTemplates(p => [...p, {name, physics, visuals, counter}])}
            loadTemplate={(name) => {
                const t = templates.find(x => x.name === name);
                if(t) { setPhysics(t.physics); setVisuals(t.visuals); setCounter(t.counter); }
            }}
            deleteTemplate={(name) => setTemplates(p => p.filter(x => x.name !== name))}
            onSetDefaults={() => setCustomDefaults({p:physics, v:visuals, c:counter})}
            lastBlobUrl={lastBlobUrl}
            onManualDownload={() => {
                if(lastBlobUrl) {
                    const a = document.createElement('a');
                    a.href = lastBlobUrl;
                    a.download = 'video.webm';
                    a.click();
                }
            }}
            onExplodeAll={triggerCinematicEnd}
            onFindMagicSpawn={findMagicSpawn}
        />
        {reviewUrl && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
                 <div className="flex flex-col items-center gap-4">
                     <video src={reviewUrl} controls className="max-h-[80vh] border border-white/20 rounded-xl" />
                     <div className="flex gap-4">
                         <button onClick={() => {
                             const a = document.createElement('a');
                             a.href = reviewUrl;
                             a.download = 'capture.webm';
                             a.click();
                         }} className="px-6 py-3 bg-indigo-600 rounded-xl font-bold flex gap-2 items-center"><Download className="w-4 h-4" /> Save</button>
                         <button onClick={() => setReviewUrl(null)} className="px-6 py-3 bg-white/10 rounded-xl font-bold flex gap-2 items-center"><X className="w-4 h-4" /> Close</button>
                     </div>
                 </div>
            </div>
        )}
    </div>
  );
};

export default App;