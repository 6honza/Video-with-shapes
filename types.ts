
export type ProductionMode = 'ESCAPE_CHALLENGE' | 'INFINITE_BOUNCE' | 'CHAOS_BATCH' | 'FREEZE_STACK' | 'SPIKE_SURVIVAL' | 'SPEED_UP_OR_DIE';
export type BallShape = 'circle' | 'square' | 'triangle' | 'hexagon' | 'star' | 'image';
export type MelodyType = 'NONE' | 'PENTATONIC' | 'MEGALOVANIA' | 'GRAVITY_FALLS' | 'DOREMI' | 'MII_CHANNEL' | 'WII_SHOP' | 'TETRIS' | 'ZELDA' | 'MARIO' | 'HARRY_POTTER' | 'LAMOUR_TOUJOURS' | 'CUSTOM';
export type SoundWaveform = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'piano';
export type SpawnType = 'random' | 'manual' | 'away_from_gap' | 'fixed';
export type ArcStyle = 'solid' | 'gradient' | 'multicolor' | 'rainbow';
export type LineCapStyle = 'round' | 'butt' | 'square';
export type CounterMode = 'TIMER' | 'SEQUENCE' | 'LINEAR' | 'EXPONENTIAL';

export interface PhysicsConfig {
  gravityY: number;
  gravityX: number;
  restitution: number;
  friction: number;
  drag: number;
  maxSpeed: number;
  spawnX: number;
  spawnY: number;
  initialImpulse: number;
  spawnType: SpawnType;
  spawnAngle: number;
  soundEnabled: boolean;
  soundReverb: boolean;
  soundWaveform: SoundWaveform;
  colorChangeOnBounce: boolean;
  lockGap: boolean;
  speedIncreaseOnBounce: number;
  gravityIncreaseOnBounce: number;
  freezeOnFinish: boolean;
  autoSpawnOnFreeze: boolean;
  spikesActive: boolean;
  scriptJSON: string; 
  soundOnCollision: boolean; 
  melodyOnCollision: boolean; 
  baseFreq: number; 
  freqStep: number;
  soundVolume: number; 
  soundReverbDuration: number;
  deterministic: boolean; // No randomness
  physicsSubSteps: number;
  soundAttack: number;
  soundDecay: number;
  soundPitchRandom: number;
}

export interface VisualConfig {
  ballColor: string;
  ballRadius: number;
  ballShape: BallShape;
  arcColor: string;
  arcStyle: ArcStyle;
  arcPalette: string[];
  arcGradientEnabled: boolean; // Deprecated in UI, kept for legacy logic or mapped to arcStyle
  arcGradientColors: [string, string];
  arcThickness: number;
  arcRadius: number;
  arcGap: number;
  arcSegments: number; // For multicolor
  lineCap: LineCapStyle;
  rotationSpeed: number;
  trailLength: number;
  trailWidth: number;
  trailOpacity: number;
  showTrail: boolean;
  glowEffect: boolean;
  glowBlur: number;
  glowIntensity: number;
  backgroundColor: string;
  hitFlash: boolean;
  particleCount: number;
  dustIntensity: number;
  overlayText: string;
  overlayTextY: number;
  overlayFontWeight: string;
  overlayTextColor: string;
  overlayFontSize: number;
  spikeCount: number;
  spikeLength: number;
  spikeWidth: number;
  spikeHollow: boolean;
  spikeColor: string;
  show916Frame: boolean;
  melody: MelodyType;
  customMelody: string; 
  motionBlur: number;
  cameraShake: number;
  freezeGrayscale: boolean; 
  explosionEffect: boolean; 
  explosionIntensity: number; 
  endText: string; 
  endSceneDuration: number;
  ballImage: string; 
  centerImage: string; 
  showSpawnPreview: boolean;
  showTrajectory: boolean;
}

export interface CounterConfig {
  enabled: boolean;
  mode: CounterMode;
  seconds: number; // Used for TIMER
  sequenceStr: string; // Used for SEQUENCE
  mathStart: number; // Used for LINEAR/EXP
  mathStep: number; // Used for LINEAR
  mathFactor: number; // Used for EXP
  fontSize: number;
  fontColor: string;
  opacity: number;
  yOffset: number;
  scale: number;
  fontFamily: string;
  fontWeight: string;
  showDecimals: boolean;
  countDown: boolean;
  textPosition: 'ball' | 'center';
}

export interface ProductionConfig {
  batchCount: number;
  maxVideoDuration: number; // Replaced "videoDuration" concept with explicit Max Limit
  minVideoDuration: number;
  autoStartNext: boolean;
  cinematicOut: boolean;
  autoSave: boolean; 
  resolutionScale: number; 
  cinematicZoomSpeed: number;
  cinematicDust: boolean;
  gpuPriority: boolean; 
  forceHD: boolean; 
  cinematicExplosion: boolean; 
  previewBeforeSave: boolean; 
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  shape: BallShape;
  color: string;
  history: { x: number; y: number }[];
  timerFrames: number;
  currentValue: number | string; // For Sequence/Math modes
  isEscaping: boolean;
  isFrozen: boolean;
  bounces: number;
  startTime: number;
  opacity: number;
  sizeMultiplier: number;
  lastSoundTime: number;
  mass: number; 
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  type?: 'dust' | 'spark';
}

export interface Template {
  name: string;
  physics: PhysicsConfig;
  visuals: VisualConfig;
  counter: CounterConfig;
}