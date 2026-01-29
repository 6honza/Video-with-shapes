import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhysicsConfig, VisualConfig, CounterConfig, ProductionConfig, Ball, Particle, ProductionMode, BallShape, MelodyType, Template } from './types';
import ControlPanel from './components/ControlPanel';
import { Download, X, Play, Check } from 'lucide-react';

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
  soundVolume: 0.5, soundReverbDuration: 2.0
};

const DEFAULT_VISUALS: VisualConfig = {
  ballColor: '#00ffcc', ballRadius: 25, ballShape: 'circle', 
  arcColor: '#73d955', arcGradientEnabled: true, arcGradientColors: ['#3a6cbd', '#5ce09e'],
  arcThickness: 50, arcRadius: 320, arcGap: 45, arcSegments: 1, rotationSpeed: 0.02, 
  trailLength: 30, trailWidth: 1.0, trailOpacity: 0.5, showTrail: true, 
  glowEffect: true, glowBlur: 30, glowIntensity: 1.5, backgroundColor: '#050505', 
  hitFlash: true, particleCount: 35, dustIntensity: 1.0, overlayText: 'WAIT FOR IT...', 
  overlayTextY: -250, overlayFontWeight: '900', overlayTextColor: '#ffffff', overlayFontSize: 80,
  spikeCount: 12, spikeLength: 40, spikeWidth: 20, 
  spikeHollow: false, spikeColor: '#73d955',
  show916Frame: true, melody: 'PENTATONIC', customMelody: '440, 550, 660', motionBlur: 0.2, cameraShake: 0,
  freezeGrayscale: false,
  explosionEffect: false, explosionIntensity: 1.0,
  endText: 'Like & Subscribe!',
  endSceneDuration: 4.0,
  ballImage: '',
  centerImage: ''
};

const DEFAULT_COUNTER: CounterConfig = {
  enabled: true, seconds: 10, fontSize: 300, fontColor: '#ffffff', opacity: 0.15, 
  yOffset: 50, scale: 1.0, fontFamily: 'Poppins', showDecimals: true, countDown: true
};

const DEFAULT_PRODUCTION: ProductionConfig = {
  batchCount: 1, videoDuration: 30, minVideoDuration: 0, autoStartNext: false, cinematicOut: true,
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
  const [physics, setPhysics] = usePersistentState<PhysicsConfig>('zen_physics_v5', DEFAULT_PHYSICS);
  const [visuals, setVisuals] = usePersistentState<VisualConfig>('zen_visuals_v5', DEFAULT_VISUALS);
  const [counter, setCounter] = usePersistentState<CounterConfig>('zen_counter_v5', DEFAULT_COUNTER);
  const [production, setProduction] = usePersistentState<ProductionConfig>('zen_production_v5', DEFAULT_PRODUCTION);
  
  const [customDefaults, setCustomDefaults] = usePersistentState<{p:PhysicsConfig, v:VisualConfig, c:CounterConfig} | null>('zen_defaults_v5', null);
  const [templates, setTemplates] = usePersistentState<Template[]>('zen_templates_v5', []);

  const [mode, setMode] = useState<ProductionMode>('ESCAPE_CHALLENGE');
  const [isRunning, setIsRunning] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [batchRemaining, setBatchRemaining] = useState(0);
  const [lastBlobUrl, setLastBlobUrl] = useState<string | null>(null);
  
  // Review Modal State
  const [reviewBlob, setReviewBlob] = useState<Blob | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);

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

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const ballImgRef = useRef<HTMLImageElement | null>(null);
  const centerImgRef = useRef<HTMLImageElement | null>(null);

  const pRef = useRef(physics);
  const vRef = useRef(visuals);
  const cRef = useRef(counter);
  const prodRef = useRef(production);

  useEffect(() => { pRef.current = physics; }, [physics]);
  useEffect(() => { vRef.current = visuals; }, [visuals]);
  useEffect(() => { cRef.current = counter; }, [counter]);
  useEffect(() => { prodRef.current = production; }, [production]);

  // Load Ball Image
  useEffect(() => {
    if (visuals.ballImage) {
      const img = new Image();
      img.src = visuals.ballImage;
      img.onload = () => { ballImgRef.current = img; };
    } else {
      ballImgRef.current = null;
    }
  }, [visuals.ballImage]);

  // Load Center Image
  useEffect(() => {
    if (visuals.centerImage) {
      const img = new Image();
      img.src = visuals.centerImage;
      img.onload = () => { centerImgRef.current = img; };
    } else {
      centerImgRef.current = null;
    }
  }, [visuals.centerImage]);

  const getEffectiveRadius = useCallback((canvasWidth: number, canvasHeight: number) => {
    const v = vRef.current;
    if (!v.show916Frame) return Math.max(0, v.arcRadius);
    const frameWidth = canvasHeight * (9/16);
    return Math.max(0, Math.min(v.arcRadius, (frameWidth / 2) - v.arcThickness - 20));
  }, []);

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

  useEffect(() => {
      if (audioCtxRef.current && reverbNodeRef.current) {
          reverbNodeRef.current.buffer = updateReverbBuffer(audioCtxRef.current, physics.soundReverbDuration);
      }
  }, [physics.soundReverbDuration, updateReverbBuffer]);

  const getRandomColor = () => `hsl(${Math.random() * 360}, 100%, 50%)`;

  const playSfx = useCallback((ball: Ball | null, forceFreq?: number) => {
    if (!pRef.current.soundEnabled) return;
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
      const basePitch = pRef.current.baseFreq;
      
      if (forceFreq) {
        freq = forceFreq;
      } else {
        let melody = MELODIES[vRef.current.melody];
        if (vRef.current.melody === 'CUSTOM') {
          melody = vRef.current.customMelody.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
          if (melody.length === 0) melody = [200, 300]; 
        }

        if (ball && melody.length > 0) {
          const scale = basePitch / 200.0; 
          freq = melody[globalNoteIndexRef.current % melody.length] * scale;
          globalNoteIndexRef.current++;
        } else if (ball) {
          freq = basePitch + Math.min(ball.bounces * pRef.current.freqStep, 2000);
        }
      }
      
      const waveType = pRef.current.soundWaveform;
      const gain = ctx.createGain();
      const volume = 0.3 * pRef.current.soundVolume;
      
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (waveType === 'piano' ? 1.0 : 0.2));

      gain.connect(ctx.destination);
      if (audioDestRef.current) gain.connect(audioDestRef.current);

      if (waveType === 'piano') {
        const osc1 = ctx.createOscillator(); osc1.type = 'triangle'; osc1.frequency.setValueAtTime(freq, ctx.currentTime);
        const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.setValueAtTime(freq, ctx.currentTime);
        osc1.connect(gain); osc2.connect(gain);
        osc1.start(); osc1.stop(ctx.currentTime + 1.0);
        osc2.start(); osc2.stop(ctx.currentTime + 1.0);
      } else {
        const osc = ctx.createOscillator(); osc.type = waveType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.2);
        osc.connect(gain);
        osc.start(); osc.stop(ctx.currentTime + 0.25);
      }

      if (pRef.current.soundReverb && reverbNodeRef.current) {
        const reverbGain = ctx.createGain(); reverbGain.gain.value = 0.4 * pRef.current.soundVolume;
        gain.connect(reverbGain); 
        reverbGain.connect(reverbNodeRef.current);
      }
    } catch {}
  }, []);

  const drawShape = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, shape: BallShape) => {
    if (r <= 0) return;
    if (shape === 'image' && ballImgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(ballImgRef.current, x - r, y - r, r * 2, r * 2);
        ctx.restore();
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
  };

  const spawn = useCallback((color?: string) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const p = pRef.current;
    const v = vRef.current;
    
    const width = canvas.width;
    const height = canvas.height;

    let startX = width / 2; let startY = height / 2;
    if (p.spawnType === 'fixed') { startX = width * p.spawnX; startY = height * p.spawnY; }

    let angle = 0;
    if (p.spawnType === 'manual' || p.spawnType === 'fixed') {
      angle = p.spawnAngle * (Math.PI / 180); angle += (Math.random() - 0.5) * 0.1;
    } else if (p.spawnType === 'away_from_gap') {
      const rot = boundaryAngleRef.current;
      const arcCenter = (360 - (p.lockGap ? 0 : v.arcGap)) / 2;
      angle = rot + arcCenter * (Math.PI / 180); angle += (Math.random() - 0.5) * 1.0; 
    } else { angle = Math.random() * Math.PI * 2; }

    const impulse = p.initialImpulse;
    const radius = vRef.current.ballRadius;
    const newBall: Ball = {
      id: Math.random().toString(36).substring(7),
      x: startX, y: startY,
      vx: Math.cos(angle) * impulse, vy: Math.sin(angle) * impulse,
      radius: radius, shape: vRef.current.ballShape,
      color: color || vRef.current.ballColor,
      history: [], timerFrames: cRef.current.seconds,
      isEscaping: false, isFrozen: false, bounces: 0, startTime: Date.now(), opacity: 1, sizeMultiplier: 1,
      lastSoundTime: 0,
      mass: radius * radius
    };
    ballsRef.current.push(newBall);
  }, []);

  const handleExplosion = (b: Ball, color: string) => {
    const intensity = vRef.current.explosionIntensity || 1;
    const count = 150 * intensity;
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

  const triggerCinematicEnd = useCallback(() => {
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
      const particleCount = 2500;
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
           for(let j=0; j<15; j++) {
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
  }, [getEffectiveRadius, playSfx]);

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
    scriptExecutedRef.current.clear();
    
    setTimeout(() => spawn(), 50);
  }, [spawn, customDefaults]);

  const stopRecording = useCallback(() => {
      // Clear the safety timeout since we are stopping intentionally
      if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
      }

      if (recorderRef.current && recorderRef.current.state === 'recording') {
          recorderRef.current.stop();
          recorderRef.current = null;
      }
  }, []);

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

  const getPointerAngle = (clientX: number, clientY: number) => {
      if (!canvasRef.current) return 0;
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return Math.atan2(clientY - centerY, clientX - centerX);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      isDraggingRef.current = true;
      lastDragAngleRef.current = getPointerAngle(e.clientX, e.clientY);
      e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDraggingRef.current) return;
      const newAngle = getPointerAngle(e.clientX, e.clientY);
      let delta = newAngle - lastDragAngleRef.current;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      boundaryAngleRef.current += delta;
      lastDragAngleRef.current = newAngle;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      isDraggingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const update = () => {
    const now = performance.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;

    if (!isRunning) return;
    const canvas = canvasRef.current; if (!canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const center = { x: width / 2, y: height / 2 };
    const p = pRef.current; const v = vRef.current;
    const currentRadius = getEffectiveRadius(width, height);

    simulationTimeRef.current += dt;
    executeScript();

    particlesRef.current = particlesRef.current.map(part => ({
      ...part, x: part.x + part.vx * dt * 60, y: part.y + part.vy * dt * 60, 
      vy: part.vy + 0.25 * dt * 60, life: part.life - 0.015 * dt * 60
    })).filter(part => part.life > 0);
    
    if (flashRef.current > 0) flashRef.current -= 0.05 * dt * 60;
    if (cameraShakeRef.current > 0) cameraShakeRef.current *= 0.95;

    if (isEndingRef.current) {
      const elapsed = Date.now() - endingTimeRef.current;
      const prod = prodRef.current; 

      if (prod.cinematicOut) {
        zoomRef.current += prod.cinematicZoomSpeed * dt * 60; 
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
          // Reset simulation only if we are NOT previewing, 
          // because if previewing, we pause and wait for user.
          if (!prod.previewBeforeSave) {
              resetSimulation();
          }
      }
      return;
    }
    
    if (!isDraggingRef.current) {
        boundaryAngleRef.current += v.rotationSpeed * dt * 60;
    }

    const SUB_STEPS = 8;
    const subDt = dt / SUB_STEPS;
    
    for(let step = 0; step < SUB_STEPS; step++) {
        let shouldSpawn = false;

        ballsRef.current.forEach(b => {
          if (p.freezeOnFinish && b.timerFrames <= 0 && !b.isFrozen) {
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
          
          const isLocked = p.lockGap && b.timerFrames > 0;
          const sweep = 360 - (isLocked ? 0 : v.arcGap);

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
                if (p.colorChangeOnBounce) b.color = getRandomColor();
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
                    if (p.colorChangeOnBounce) b1.color = getRandomColor();
                    if (p.soundOnCollision) {
                       if (p.melodyOnCollision) playSfx(b1);
                       else {
                           const randomPitch = p.baseFreq + Math.random() * p.freqStep * 10;
                           playSfx(b1, randomPitch);
                       }
                    }
                  }
                } else if (!b2.isFrozen) {
                  b2.x += nx * overlap; b2.y += ny * overlap;
                  const dot = b2.vx * nx + b2.vy * ny;
                  if (dot < 0) {
                    b2.vx -= 2 * dot * nx * p.restitution; b2.vy -= 2 * dot * ny * p.restitution;
                    if (p.colorChangeOnBounce) b2.color = getRandomColor();
                    if (p.soundOnCollision) {
                       if (p.melodyOnCollision) playSfx(b2);
                       else {
                           const randomPitch = p.baseFreq + Math.random() * p.freqStep * 10;
                           playSfx(b2, randomPitch);
                       }
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
                   if (p.colorChangeOnBounce) { b1.color = getRandomColor(); b2.color = getRandomColor(); }
                   
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
            b.history.push({ x: b.x, y: b.y });
            if (b.history.length > v.trailLength) b.history.shift();
        }
        if (cRef.current.enabled && !b.isFrozen && !b.isEscaping) {
            b.timerFrames = Math.max(0, b.timerFrames - dt);
        }
    });
  };

  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const center = { x: width / 2, y: height / 2 };
    const v = vRef.current; const c = cRef.current;
    const currentRadius = getEffectiveRadius(width, height);

    ctx.fillStyle = v.backgroundColor; ctx.fillRect(0, 0, width, height);

    ctx.save();
    if (cameraShakeRef.current > 0) {
      ctx.translate((Math.random() - 0.5) * cameraShakeRef.current, (Math.random() - 0.5) * cameraShakeRef.current);
    }
    ctx.translate(center.x, center.y);
    ctx.scale(zoomRef.current, zoomRef.current);
    ctx.translate(-center.x, -center.y);
    ctx.globalAlpha = opacityRef.current;

    ctx.save(); ctx.translate(center.x, center.y); 
    
    // Draw Center Image if exists
    if (centerImgRef.current && !arcExplodedRef.current) {
        ctx.save();
        // Assuming image should fit within the radius with some padding
        const imgSize = currentRadius * 1.0; 
        ctx.drawImage(centerImgRef.current, -imgSize/2, -imgSize/2, imgSize, imgSize);
        ctx.restore();
    }

    ctx.rotate(boundaryAngleRef.current);
    const activeBall = ballsRef.current.find(b => !b.isFrozen) || ballsRef.current[0];
    const isLocked = pRef.current.lockGap && (activeBall?.timerFrames ?? 0) > 0;
    const sweep = 360 - (isLocked ? 0 : v.arcGap);

    if (!arcExplodedRef.current) {
      if (v.arcGradientEnabled) {
        const grad = ctx.createConicGradient(0, 0, 0);
        grad.addColorStop(0, v.arcGradientColors[0]); grad.addColorStop(0.5, v.arcGradientColors[1]); grad.addColorStop(1, v.arcGradientColors[0]);
        ctx.strokeStyle = grad;
      } else { ctx.strokeStyle = v.arcColor; }
      
      ctx.lineWidth = v.arcThickness; ctx.lineCap = 'round';
      if (v.glowEffect) { ctx.shadowBlur = v.glowBlur; ctx.shadowColor = v.arcColor; }
      ctx.beginPath(); ctx.arc(0, 0, currentRadius, 0, sweep * Math.PI / 180); ctx.stroke(); 
      
      if (pRef.current.spikesActive) {
        ctx.fillStyle = v.spikeColor; 
        ctx.strokeStyle = v.spikeColor;
        ctx.lineWidth = 2;
        for(let i=0; i<v.spikeCount; i++) {
           const spikeAngle = i * (2 * Math.PI / v.spikeCount);
           if (spikeAngle > sweep * Math.PI / 180) continue;
           ctx.save(); ctx.rotate(spikeAngle); ctx.translate(currentRadius, 0); ctx.rotate(Math.PI/2);
           ctx.beginPath(); ctx.moveTo(-v.spikeWidth/2, 0); ctx.lineTo(0, v.spikeLength); ctx.lineTo(v.spikeWidth/2, 0); ctx.closePath(); 
           if (v.spikeHollow) ctx.stroke(); else ctx.fill();
           ctx.restore();
        }
      }
    }
    ctx.restore();

    if (v.overlayText) {
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `${v.overlayFontWeight} ${v.overlayFontSize}px Poppins`; 
      ctx.fillStyle = v.overlayTextColor; 
      const lines = v.overlayText.split('\n');
      const lineHeight = v.overlayFontSize * 1.2;
      const totalHeight = lines.length * lineHeight;
      const startY = center.y + v.overlayTextY - (totalHeight / 2) + (lineHeight/2);
      lines.forEach((line, i) => ctx.fillText(line, center.x, startY + (i * lineHeight)));
      ctx.restore();
    }

    if (c.enabled && activeBall && !activeBall.isEscaping) {
      const txt = c.showDecimals ? activeBall.timerFrames.toFixed(1) : Math.ceil(activeBall.timerFrames).toString();
      ctx.save(); ctx.globalAlpha = c.opacity * opacityRef.current; ctx.textAlign = 'center'; 
      ctx.font = `900 ${c.fontSize}px Poppins`;
      ctx.fillStyle = activeBall.timerFrames <= 0 ? '#00ffa3' : c.fontColor;
      ctx.fillText(txt, center.x, center.y + c.yOffset); ctx.restore();
    }

    ballsRef.current.forEach(b => {
      if (b.opacity <= 0) return;
      ctx.save();
      ctx.globalAlpha = b.opacity * opacityRef.current;
      if (v.showTrail) {
        b.history.forEach((h, i) => {
          const ratio = i / b.history.length;
          ctx.beginPath(); drawShape(ctx, h.x, h.y, b.radius * ratio * v.trailWidth, b.shape);
          ctx.fillStyle = (b.isFrozen && v.freezeGrayscale) ? '#888888' : b.color;
          ctx.globalAlpha = ratio * v.trailOpacity * b.opacity * opacityRef.current; ctx.fill();
        });
      }
      ctx.beginPath(); drawShape(ctx, b.x, b.y, b.radius, b.shape);
      ctx.fillStyle = (b.isFrozen && v.freezeGrayscale) ? '#888888' : b.color;
      if (v.glowEffect && (!b.isFrozen || !v.freezeGrayscale)) { ctx.shadowBlur = v.glowBlur * 0.8; ctx.shadowColor = b.color; }
      ctx.fill(); ctx.restore();
    });

    particlesRef.current.forEach(p => {
      ctx.save(); ctx.globalAlpha = p.life * opacityRef.current; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });

    ctx.restore();

    // Render End Text over everything
    if (isEndingRef.current && v.endText) {
        const elapsed = Date.now() - endingTimeRef.current;
        const duration = (v.endSceneDuration || 4.0) * 1000;
        
        // Dynamic fade: start at 20%, take 30% of duration
        const fadeStart = duration * 0.2;
        const fadeLen = duration * 0.3;
        
        const textAlpha = Math.min(1, Math.max(0, (elapsed - fadeStart) / fadeLen));
        
        ctx.save();
        ctx.globalAlpha = textAlpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${v.overlayFontSize * 1.5}px Poppins`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = v.arcColor;
        ctx.shadowBlur = 20;
        ctx.fillText(v.endText, center.x, center.y);
        ctx.restore();
    }

    if (v.show916Frame) {
      const frameHeight = height; const frameWidth = frameHeight * (9/16);
      ctx.save(); 
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, center.x - frameWidth/2, height); ctx.fillRect(center.x + frameWidth/2, 0, width - (center.x + frameWidth/2), height);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.strokeRect(center.x - frameWidth/2, 0, frameWidth, height); 
      ctx.restore();
    }
  };

  useEffect(() => {
    const handleResize = () => { 
        if(canvasRef.current) {
            if (prodRef.current.forceHD) {
                canvasRef.current.width = 1080; canvasRef.current.height = 1920;
                canvasRef.current.style.width = '100%'; canvasRef.current.style.height = '100%'; canvasRef.current.style.objectFit = 'contain'; 
            } else {
                 const dpr = (window.devicePixelRatio || 1) * (prodRef.current.resolutionScale || 1);
                 canvasRef.current.width = window.innerWidth * dpr; canvasRef.current.height = window.innerHeight * dpr; 
                 canvasRef.current.style.width = `${window.innerWidth}px`; canvasRef.current.style.height = `${window.innerHeight}px`;
                 canvasRef.current.style.objectFit = 'cover';
            }
            if (prodRef.current.gpuPriority) {
                canvasRef.current.style.willChange = 'transform'; canvasRef.current.style.transform = 'translateZ(0)';
            } else {
                canvasRef.current.style.willChange = 'auto'; canvasRef.current.style.transform = 'none';
            }
        } 
    };
    window.addEventListener('resize', handleResize); handleResize(); resetSimulation();
    const loop = () => { update(); draw(); frameHandleRef.current = requestAnimationFrame(loop); };
    frameHandleRef.current = requestAnimationFrame(loop);
    return () => { window.removeEventListener('resize', handleResize); if(frameHandleRef.current) cancelAnimationFrame(frameHandleRef.current); };
  }, [getEffectiveRadius, production.resolutionScale, production.forceHD, production.gpuPriority]);

  const startExport = useCallback(() => {
    if (!canvasRef.current) return;
    chunksRef.current = [];
    recordingStartTimeRef.current = Date.now();
    setLastBlobUrl(null);
    const canvasStream = canvasRef.current.captureStream(120);
    const tracks = [...canvasStream.getVideoTracks()];
    if (audioDestRef.current && audioDestRef.current.stream) {
        const audioTracks = audioDestRef.current.stream.getAudioTracks();
        if (audioTracks.length > 0) tracks.push(audioTracks[0]);
    }
    const combinedStream = new MediaStream(tracks);
    const rec = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 25000000 });
    
    rec.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
        }
    };
    
    rec.onstop = () => {
      const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      // If duration check passes OR user has preview enabled (so they can decide)
      if (duration >= prodRef.current.minVideoDuration || prodRef.current.previewBeforeSave) {
          if (prodRef.current.previewBeforeSave) {
              setReviewBlob(blob);
              setReviewUrl(url);
              // Pause here. Don't auto save, don't decrement batch yet.
              setIsRecording(false);
              return;
          } else {
              if (prodRef.current.autoSave) {
                  const a = document.createElement('a'); a.href = url; a.download = `ZenBounce_${Date.now()}.webm`; a.click();
              }
              setLastBlobUrl(url);
          }
      }
      
      // Proceed to next if not previewing
      setIsRecording(false);
      if (batchRemaining > 1) {
          setBatchRemaining(batchRemaining - 1);
          setTimeout(() => resetSimulation(), 1000);
      } else { setBatchRemaining(0); }
    };
    
    rec.start(); 
    recorderRef.current = rec; 
    setIsRecording(true);
    
    // Safety timeout - stops recording if it goes too long, acting as a Max Duration
    recordingTimeoutRef.current = setTimeout(() => { 
        if(recorderRef.current && recorderRef.current.state === 'recording') {
            recorderRef.current.stop();
        }
    }, prodRef.current.videoDuration * 1000);

  }, [batchRemaining, resetSimulation]); 

  useEffect(() => {
      if (batchRemaining > 0 && !isRecording && !reviewBlob) {
          const t = setTimeout(() => startExport(), 500);
          return () => clearTimeout(t);
      }
  }, [batchRemaining, isRecording, startExport, reviewBlob]);

  const handleStartBatch = () => { resetSimulation(); setBatchRemaining(prodRef.current.batchCount); };
  const saveTemplate = (name: string) => { if (!name) return; const newT: Template = { name, physics, visuals, counter }; setTemplates(prev => [...prev.filter(t => t.name !== name), newT]); };
  const loadTemplate = (name: string) => { const t = templates.find(t => t.name === name); if (t) { setPhysics(t.physics); setVisuals(t.visuals); setCounter(t.counter); resetSimulation(); } };
  const deleteTemplate = (name: string) => setTemplates(prev => prev.filter(t => t.name !== name));
  const handleSetDefaults = () => { setCustomDefaults({ p: physics, v: visuals, c: counter }); alert("Saved as Default!"); };
  const handleManualDownload = () => { if (!lastBlobUrl) return; const a = document.createElement('a'); a.href = lastBlobUrl; a.download = `ZenBounce_${Date.now()}.webm`; a.click(); };

  // New: Handle Preview Decisions
  const handleReviewSave = () => {
      if (reviewUrl) {
          const a = document.createElement('a'); a.href = reviewUrl; a.download = `ZenBounce_${Date.now()}.webm`; a.click();
          setLastBlobUrl(reviewUrl);
      }
      setReviewBlob(null);
      setReviewUrl(null);
      resetSimulation(); 
      if (batchRemaining > 1) {
          setBatchRemaining(batchRemaining - 1);
      } else {
          setBatchRemaining(0);
      }
  };

  const handleReviewDiscard = () => {
      setReviewBlob(null);
      setReviewUrl(null);
      resetSimulation();
      if (batchRemaining > 1) {
          setBatchRemaining(batchRemaining - 1);
      } else {
          setBatchRemaining(0);
      }
  };

  return (
    <div className="relative w-full h-screen bg-black select-none overflow-hidden font-sans">
      <canvas ref={canvasRef} className="block cursor-crosshair touch-none" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} />
      
      {/* Review Modal Overlay */}
      {reviewUrl && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-[60] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                      <h3 className="font-black text-sm uppercase tracking-widest text-white flex items-center gap-2">
                          <Play className="w-4 h-4 text-indigo-500" /> Review Recording
                      </h3>
                      <div className="text-[10px] text-zinc-500 font-mono">
                          {((reviewBlob?.size || 0) / 1024 / 1024).toFixed(2)} MB
                      </div>
                  </div>
                  <div className="aspect-video bg-black flex items-center justify-center relative group">
                      <video src={reviewUrl} controls autoPlay loop className="max-h-[60vh] w-full object-contain" />
                  </div>
                  <div className="p-6 flex gap-4 bg-zinc-900">
                      <button onClick={handleReviewDiscard} className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2">
                          <X className="w-4 h-4" /> Discard
                      </button>
                      <button onClick={handleReviewSave} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" /> Save {batchRemaining > 1 ? '& Continue Batch' : 'Video'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <ControlPanel 
        physics={physics} setPhysics={setPhysics} visuals={visuals} setVisuals={setVisuals} counter={counter} setCounter={setCounter}
        production={production} setProduction={setProduction} mode={mode} setMode={setMode} isRunning={isRunning} setIsRunning={setIsRunning}
        onReset={resetSimulation} onRestoreDefaults={() => { setPhysics(DEFAULT_PHYSICS); setVisuals(DEFAULT_VISUALS); setCounter(DEFAULT_COUNTER); setCustomDefaults(null); }}
        onStartBatch={handleStartBatch} isRecording={isRecording} onAddBall={() => spawn()} currentTake={0} templates={templates} saveTemplate={saveTemplate} 
        loadTemplate={loadTemplate} deleteTemplate={deleteTemplate} onSetDefaults={handleSetDefaults} lastBlobUrl={lastBlobUrl} onManualDownload={handleManualDownload}
        onExplodeAll={() => ballsRef.current.forEach(b => handleExplosion(b, b.color))}
      />
      {isRecording && (
        <div className="absolute top-8 right-8 flex items-center gap-3 bg-red-600 px-6 py-3 rounded-2xl animate-pulse z-50">
          <div className="w-3 h-3 bg-white rounded-full" />
          <span className="text-xs font-black uppercase tracking-widest text-white">{batchRemaining > 1 ? `Batch: ${batchRemaining} left` : 'Recording...'}</span>
        </div>
      )}
    </div>
  );
};

export default App;
