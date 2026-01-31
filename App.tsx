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
  sequenceStr: "1, 2, 4, 8, 16, 32, 64, 128", mathStart: 1, mathStep: 1, mathFactor: 2
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
          if (p.freezeOnFinish && b.timerFrames <= 0 && !b.isFrozen && cRef.current.mode === 'TIMER') {
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
          const limit = currentRadius - b.radius;
          
          const isLocked = p.lockGap && b.timerFrames > 0; // Only relevant for timer mode logic
          const sweep = 360 - (isLocked && cRef.current.mode === 'TIMER' ? 0 : v.arcGap);

          if (p.spikesActive && !b.isFrozen && !b.isEscaping && d > currentRadius - v.spikeLength - b.radius) {
            const angle = Math.atan2(dy, dx);
            let relAngle = angle - boundaryAngleRef.current;
            relAngle = relAngle % (2 * Math.PI);
            if (relAngle < 0) relAngle += 2 * Math.PI;
            
            const sweepRad = sweep * (Math.PI / 180);
            const spikeCount = v.spikeCount;
            const spikeInterval = (2 * Math.PI) / spikeCount;
            const spikeIndex = Math.round(relAngle / spikeInterval);
            const nearestSpikeAngle = spikeIndex * spikeInterval;
            let normalizedSpikeAngle = nearestSpikeAngle % (2 * Math.PI);
            if (normalizedSpikeAngle < 0) normalizedSpikeAngle += 2 * Math.PI;
            
            if (normalizedSpikeAngle <= sweepRad + 0.1) { 
                const diff = Math.abs(relAngle - nearestSpikeAngle);
                const angularHalfWidth = (v.spikeWidth / 2) / d;
                if (diff < angularHalfWidth + 0.05) {
                    b.isFrozen = true; b.vx = 0; b.vy = 0;
                    b.color = v.spikeColor; 
                    if (v.explosionEffect) {
                      handleExplosion(b, v.spikeColor);
                    } else {
                      for(let i=0; i<10; i++) {
                        particlesRef.current.push({ x: b.x, y: b.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 1, color: v.spikeColor, size: Math.random()*5 + 2 });
                      }
                    }
                    shouldSpawn = true;
                    playSfx(b, 100); 
                }
            }
          }

          if (d >= limit && !b.isEscaping && !b.isFrozen) {
            const ang = (Math.atan2(dy, dx) * 180 / Math.PI + 720) % 360;
            const rot = (boundaryAngleRef.current * 180 / Math.PI) % 360;
            const rel = (ang - rot + 720) % 360;

            if (rel < sweep) {
              const nx = dx / d; const ny = dy / d;
              const dot = b.vx * nx + b.vy * ny;
              if (dot > 0) {
                b.vx = (b.vx - 2 * dot * nx) * p.restitution;
                b.vy = (b.vy - 2 * dot * ny) * p.restitution;
                b.vx *= (1 + p.speedIncreaseOnBounce); b.vy *= (1 + p.speedIncreaseOnBounce);
                b.x = center.x + nx * (limit - 1); b.y = center.y + ny * (limit - 1); 
                b.bounces++;
                if (p.colorChangeOnBounce && !p.deterministic) b.color = getRandomColor();
                
                // --- Counter Update Logic ---
                if (cRef.current.mode === 'SEQUENCE') {
                   const parts = cRef.current.sequenceStr.split(',').map(s => s.trim());
                   if (parts.length > 0) {
                       b.currentValue = parts[b.bounces % parts.length];
                   }
                } else if (cRef.current.mode === 'LINEAR') {
                   if (typeof b.currentValue === 'number') b.currentValue += cRef.current.mathStep;
                   else b.currentValue = cRef.current.mathStart;
                } else if (cRef.current.mode === 'EXPONENTIAL') {
                   if (typeof b.currentValue === 'number') b.currentValue *= cRef.current.mathFactor;
                   else b.currentValue = cRef.current.mathStart;
                }
                // ----------------------------

                playSfx(b);
                if (v.hitFlash) flashRef.current = 1;
                for(let i=0; i<v.particleCount; i++) {
                  particlesRef.current.push({ x: b.x, y: b.y, vx: (Math.random()-0.5)*12 - nx*5, vy: (Math.random()-0.5)*12 - ny*5, life: 1, color: b.color, size: Math.random()*4 + 1 });
                }
              }
            } else if (d > currentRadius + b.radius + 30) {
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

    ballsRef.current.forEach(b => {
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
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    
    // CRITICAL FIX: Reset transform before clearing to ensure the entire buffer is cleared
    // This prevents "duplicated screen" glitches where previous frames persist
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const width = canvas.width;
    const height = canvas.height;
    const center = { x: width / 2, y: height / 2 };
    
    const p = pRef.current; 
    const v = vRef.current;
    const c = cRef.current;

    let sx = 0, sy = 0;
    if (cameraShakeRef.current > 0) {
        sx = (Math.random() - 0.5) * cameraShakeRef.current;
        sy = (Math.random() - 0.5) * cameraShakeRef.current;
    }

    ctx.fillStyle = v.backgroundColor;
    if (v.motionBlur > 0 && isRunningRef.current) {
        ctx.globalAlpha = 1 - v.motionBlur;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1.0;
    } else {
        ctx.clearRect(0, 0, width, height);
        ctx.fillRect(0, 0, width, height);
    }

    ctx.save();
    ctx.translate(center.x + sx, center.y + sy);
    
    if (isEndingRef.current && prodRef.current.cinematicOut) {
        ctx.scale(zoomRef.current, zoomRef.current);
    }
    
    const currentRadius = getEffectiveRadius(width, height);

    if (!arcExplodedRef.current) {
        ctx.save();
        ctx.rotate(boundaryAngleRef.current);
        
        ctx.lineWidth = v.arcThickness;
        ctx.lineCap = v.lineCap || 'butt'; 

        const gapRad = (p.lockGap ? 0 : v.arcGap) * Math.PI / 180;
        const totalAngle = 2 * Math.PI - gapRad;
        const startAngle = gapRad / 2;
        const endAngle = 2 * Math.PI - gapRad / 2;

        if (v.glowEffect) { ctx.shadowBlur = v.glowBlur; ctx.shadowColor = v.arcColor; }

        if (v.arcStyle === 'gradient' || v.arcStyle === 'solid') {
            ctx.beginPath();
            ctx.arc(0, 0, currentRadius, startAngle, endAngle);
            if (v.arcStyle === 'gradient') {
                const grad = ctx.createLinearGradient(-currentRadius, -currentRadius, currentRadius, currentRadius);
                grad.addColorStop(0, v.arcGradientColors[0]);
                grad.addColorStop(1, v.arcGradientColors[1]);
                ctx.strokeStyle = grad;
                if (v.glowEffect) ctx.shadowColor = v.arcGradientColors[0];
            } else {
                ctx.strokeStyle = v.arcColor;
            }
            ctx.stroke();
        } else if (v.arcStyle === 'rainbow') {
            const segments = 60;
            const segAngle = totalAngle / segments;
            for(let i=0; i<segments; i++) {
                ctx.beginPath();
                const a1 = startAngle + i * segAngle;
                const a2 = startAngle + (i+1.1) * segAngle; 
                ctx.arc(0, 0, currentRadius, a1, a2);
                ctx.strokeStyle = `hsl(${i * 360 / segments}, 100%, 50%)`;
                ctx.stroke();
            }
        } else if (v.arcStyle === 'multicolor') {
            const segCount = v.arcSegments || 4;
            const segAngle = totalAngle / segCount;
            const colors = v.arcPalette.length > 0 ? v.arcPalette : ['#ff0055', '#7000ff'];
            
            for(let i=0; i<segCount; i++) {
                ctx.beginPath();
                const a1 = startAngle + i * segAngle;
                const a2 = startAngle + (i+1) * segAngle + 0.01; 
                ctx.arc(0, 0, currentRadius, a1, a2);
                ctx.strokeStyle = colors[i % colors.length];
                ctx.stroke();
            }
        }
        
        if (p.spikesActive) {
            for(let i=0; i<v.spikeCount; i++) {
                const ang = i * (2 * Math.PI / v.spikeCount);
                let localAng = ang;
                if (localAng > Math.PI) localAng -= 2 * Math.PI;
                if (Math.abs(localAng) > gapRad/2) {
                    ctx.save();
                    ctx.rotate(ang);
                    ctx.translate(currentRadius - v.arcThickness/2, 0);
                    ctx.beginPath();
                    if (v.spikeHollow) {
                         ctx.moveTo(0, -v.spikeWidth/2);
                         ctx.lineTo(-v.spikeLength, 0);
                         ctx.lineTo(0, v.spikeWidth/2);
                         ctx.strokeStyle = v.spikeColor;
                         ctx.lineWidth = 2;
                         ctx.stroke();
                    } else {
                         ctx.moveTo(0, -v.spikeWidth/2);
                         ctx.lineTo(-v.spikeLength, 0);
                         ctx.lineTo(0, v.spikeWidth/2);
                         ctx.fillStyle = v.spikeColor;
                         ctx.fill();
                    }
                    ctx.restore();
                }
            }
        }
        ctx.restore();
    }

    if (!isRunningRef.current && !isEndingRef.current && v.showSpawnPreview) {
        ctx.save();
        const spawnData = getSpawnData();
        const bx = spawnData.x - width/2;
        const by = spawnData.y - height/2;
        
        ctx.translate(bx, by);
        ctx.beginPath();
        drawShape(ctx, 0, 0, v.ballRadius, v.ballShape);
        ctx.strokeStyle = 'white';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.setLineDash([]);
        
        if (v.showTrajectory) {
            ctx.restore(); 
            ctx.save();
            
            ctx.beginPath();
            ctx.moveTo(spawnData.x - (center.x + sx), spawnData.y - (center.y + sy)); 
            
            let simX = spawnData.x;
            let simY = spawnData.y;
            let simVx = spawnData.vx;
            let simVy = spawnData.vy;
            const simDt = 0.016; 
            const simSubSteps = 4;
            
            // Trajectory Prediction Loop
            for(let i=0; i<120; i++) {
                for(let s=0; s<simSubSteps; s++) {
                    simVx += p.gravityX * (simDt/simSubSteps) * 60;
                    simVy += p.gravityY * (simDt/simSubSteps) * 60;
                    simX += simVx * (simDt/simSubSteps) * 60;
                    simY += simVy * (simDt/simSubSteps) * 60;
                }
                const dist = Math.sqrt(Math.pow(simX - center.x, 2) + Math.pow(simY - center.y, 2));
                if (dist > currentRadius - v.ballRadius) break;
                
                ctx.lineTo(simX - (center.x + sx), simY - (center.y + sy));
            }
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([2, 4]);
            ctx.stroke();
        } else {
            ctx.restore();
        }
    }

    if (centerImgRef.current && !arcExplodedRef.current) {
        const s = currentRadius * 0.8;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, s/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(centerImgRef.current, -s/2, -s/2, s, s);
        ctx.restore();
    }

    if (c.enabled && !isEndingRef.current) {
        ctx.save();
        ctx.translate(0, c.yOffset);
        ctx.scale(c.scale, c.scale);
        ctx.globalAlpha = c.opacity;
        ctx.fillStyle = c.fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${c.fontWeight || '900'} ${c.fontSize}px "${c.fontFamily}", sans-serif`;
        
        let val: string | number = 0;
        if (ballsRef.current.length > 0) {
            const b = ballsRef.current[0];
            if (c.mode === 'TIMER') {
                const tf = b.timerFrames;
                val = c.showDecimals ? tf.toFixed(2) : Math.ceil(tf).toString();
            } else {
                val = b.currentValue;
                if (typeof val === 'number') val = c.showDecimals ? val.toFixed(0) : Math.floor(val).toString();
            }
        }
        ctx.fillText(val.toString(), 0, 0);
        ctx.restore();
    }

    if (v.overlayText && !isEndingRef.current) {
        ctx.save();
        ctx.translate(0, v.overlayTextY);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = v.overlayTextColor;
        ctx.font = `${v.overlayFontWeight} ${v.overlayFontSize}px Poppins, sans-serif`;
        ctx.fillText(v.overlayText, 0, 0);
        ctx.restore();
    }

    ballsRef.current.forEach(b => {
        if (b.opacity <= 0) return;
        
        if (v.showTrail && b.history.length > 2) {
             const trailLen = b.history.length;
             // Draw from oldest to newest
             for(let i=0; i<trailLen - 1; i++) {
                 const pt1 = b.history[i];
                 const pt2 = b.history[i+1];
                 
                 const x1 = pt1.x - (center.x + sx);
                 const y1 = pt1.y - (center.y + sy);
                 const x2 = pt2.x - (center.x + sx);
                 const y2 = pt2.y - (center.y + sy);
                 
                 const progress = i / (trailLen - 1); 
                 
                 const alpha = progress * v.trailOpacity * b.opacity; 
                 const width = Math.max(1, progress * b.radius * v.trailWidth); 
                 
                 ctx.beginPath();
                 ctx.moveTo(x1, y1);
                 ctx.lineTo(x2, y2);
                 
                 ctx.lineWidth = width;
                 ctx.strokeStyle = b.color;
                 ctx.globalAlpha = alpha;
                 ctx.lineCap = 'round';
                 if (v.glowEffect) {
                     ctx.shadowBlur = v.glowBlur * progress; 
                     ctx.shadowColor = b.color;
                 } else {
                     ctx.shadowBlur = 0;
                 }
                 ctx.stroke();
             }
             
             // Connect last history point to current ball
             const lastPt = b.history[trailLen - 1];
             const curX = b.x - (center.x + sx);
             const curY = b.y - (center.y + sy);
             const lx = lastPt.x - (center.x + sx);
             const ly = lastPt.y - (center.y + sy);
             
             ctx.beginPath();
             ctx.moveTo(lx, ly);
             ctx.lineTo(curX, curY);
             ctx.lineWidth = b.radius * v.trailWidth;
             ctx.strokeStyle = b.color;
             ctx.globalAlpha = v.trailOpacity * b.opacity;
             ctx.lineCap = 'round';
             if (v.glowEffect) {
                 ctx.shadowBlur = v.glowBlur;
                 ctx.shadowColor = b.color;
             }
             ctx.stroke();
        }

        ctx.save();
        const bx = b.x - (center.x + sx);
        const by = b.y - (center.y + sy);
        ctx.translate(bx, by);
        ctx.fillStyle = b.color;
        if (v.glowEffect) { ctx.shadowBlur = v.glowBlur; ctx.shadowColor = b.color; }
        
        ctx.beginPath(); // FIX: Clears previous path to prevent ghosting/filling
        const isImage = drawShape(ctx, 0, 0, b.radius * b.sizeMultiplier, b.shape);
        if (!isImage) ctx.fill(); // FIX: Only fill if it wasn't a self-drawing shape like an image
        
        ctx.restore();
    });

    particlesRef.current.forEach(pt => {
        const ptx = pt.x - (center.x + sx);
        const pty = pt.y - (center.y + sy);
        ctx.save();
        ctx.translate(ptx, pty);
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(0, 0, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    if (isEndingRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, 1 - opacityRef.current + 0.2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 80px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 20;
        ctx.fillText(v.endText, 0, 0);
        ctx.restore();
    }

    ctx.restore(); 

    if (flashRef.current > 0.05) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, flashRef.current * 0.3)})`;
        ctx.fillRect(0, 0, width, height);
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    const renderLoop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden font-sans select-none text-white">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block touch-none"
          onPointerDown={(e) => {
            isDraggingRef.current = true;
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width/2;
                const y = e.clientY - rect.top - rect.height/2;
                lastDragAngleRef.current = Math.atan2(y, x) - boundaryAngleRef.current;
            }
          }}
          onPointerMove={(e) => {
             if (isDraggingRef.current && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width/2;
                const y = e.clientY - rect.top - rect.height/2;
                boundaryAngleRef.current = Math.atan2(y, x) - lastDragAngleRef.current;
             }
          }}
          onPointerUp={() => isDraggingRef.current = false}
          onPointerLeave={() => isDraggingRef.current = false}
        />

        {reviewUrl && (
          <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-[100] p-6">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-2xl w-full shadow-2xl">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Check className="text-green-500" /> Recording Complete</h3>
              <video src={reviewUrl} controls className="w-full rounded-xl bg-black aspect-video mb-6 border border-zinc-800" />
              <div className="flex gap-3">
                <button onClick={() => {
                  const a = document.createElement('a'); a.href = reviewUrl; a.download = `zen_bounce_${Date.now()}.webm`; a.click(); setReviewUrl(null);
                }} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Save Video
                </button>
                <button onClick={() => setReviewUrl(null)} className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <ControlPanel
          physics={physics} setPhysics={setPhysics}
          visuals={visuals} setVisuals={setVisuals}
          counter={counter} setCounter={setCounter}
          production={production} setProduction={setProduction}
          mode={mode} setMode={setMode}
          isRunning={isRunning} setIsRunning={setIsRunning}
          onReset={resetSimulation}
          onRestoreDefaults={() => {
            if (window.confirm('Reset all settings to factory defaults?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          onStartBatch={startRecording}
          isRecording={isRecording}
          onAddBall={() => spawn()}
          currentTake={1} 
          templates={templates}
          saveTemplate={(name) => {
             if (!name) return;
             setTemplates(prev => [...prev.filter(t => t.name !== name), { name, physics, visuals, counter }]);
          }}
          loadTemplate={(name) => {
             const t = templates.find(temp => temp.name === name);
             if (t) { setPhysics(t.physics); setVisuals(t.visuals); setCounter(t.counter); resetSimulation(); }
          }}
          deleteTemplate={(name) => setTemplates(prev => prev.filter(t => t.name !== name))}
          onSetDefaults={() => setCustomDefaults({p: physics, v: visuals, c: counter})}
          lastBlobUrl={lastBlobUrl}
          onManualDownload={() => {
            if (lastBlobUrl) {
               const a = document.createElement('a'); a.href = lastBlobUrl; a.download = `zen_bounce_${Date.now()}.webm`; a.click();
            }
          }}
          onExplodeAll={triggerCinematicEnd}
          onFindMagicSpawn={findMagicSpawn}
        />
    </div>
  );
};

export default App;