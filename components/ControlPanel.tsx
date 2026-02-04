import React, { useState } from 'react';
import { PhysicsConfig, VisualConfig, CounterConfig, ProductionConfig, ProductionMode, MelodyType, BallShape, SoundWaveform, SpawnType, Template, ArcStyle, LineCapStyle, CounterMode } from '../types';
import { Palette, Zap, Type, Play, Pause, RefreshCw, Video, Target, Plus, Clapperboard, Waves, Music, RotateCcw, Shapes, Sparkles, Ghost, Gauge, Snowflake, Volume2, Wand2, Dna, Rocket, Skull, Save, Download, Trash, FileJson, Code, HardDrive, Monitor, Layers, Bomb, Upload, Image as ImageIcon, Eye, Grid, X, Calculator, List } from 'lucide-react';

const Section = ({ icon: Icon, label, children }: any) => (
  <div className="space-y-4 mb-6">
    <div className="flex items-center gap-2 text-zinc-400 border-b border-white/5 pb-2 mb-4">
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    {children}
  </div>
);

const Control = ({ label, v, min, max, step = 1, onChange }: any) => (
  <div className="space-y-1 mb-3">
    <div className="flex justify-between">
      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">{label}</span>
      <span className="text-[10px] font-mono text-zinc-300">{typeof v === 'number' ? v.toFixed(step < 1 ? 2 : 0) : v}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={v} onChange={e => onChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500" />
  </div>
);

const Toggle = ({ label, active, onClick }: any) => (
  <div className="flex items-center justify-between py-2 mb-1 cursor-pointer group" onClick={onClick}>
    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider group-hover:text-zinc-300 transition-colors">{label}</span>
    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${active ? 'bg-indigo-600' : 'bg-white/10'}`}>
      <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  </div>
);

const Color = ({ label, v, onChange }: any) => (
  <div className="space-y-1 mb-3">
    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">{label}</span>
    <div className="flex gap-2">
      <input type="color" value={v} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded bg-transparent border-none cursor-pointer" />
      <input type="text" value={v} onChange={e => onChange(e.target.value)} className="flex-1 bg-white/5 border border-white/5 rounded px-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-indigo-500" />
    </div>
  </div>
);

interface Props {
  physics: PhysicsConfig; setPhysics: any;
  visuals: VisualConfig; setVisuals: any;
  counter: CounterConfig; setCounter: any;
  production: ProductionConfig; setProduction: any;
  mode: ProductionMode; setMode: any;
  isRunning: boolean; setIsRunning: any;
  onReset: () => void;
  onRestoreDefaults: () => void;
  onStartBatch: () => void;
  isRecording: boolean;
  onAddBall: () => void;
  currentTake: number;
  templates: Template[];
  saveTemplate: (name: string) => void;
  loadTemplate: (name: string) => void;
  deleteTemplate: (name: string) => void;
  onSetDefaults: () => void;
  lastBlobUrl?: string | null;
  onManualDownload?: () => void;
  onExplodeAll?: () => void;
  onFindMagicSpawn?: () => void;
}

const ControlPanel: React.FC<Props> = ({
  physics, setPhysics, visuals, setVisuals, counter, setCounter,
  production, setProduction, mode, setMode, isRunning, setIsRunning, 
  onReset, onRestoreDefaults, onStartBatch, isRecording, onAddBall,
  templates, saveTemplate, loadTemplate, deleteTemplate, onSetDefaults,
  lastBlobUrl, onManualDownload, onExplodeAll, onFindMagicSpawn, currentTake
}) => {
  const [tab, setTab] = useState<'vis' | 'phy' | 'txt' | 'prd' | 'ai' | 'tpl'>('vis');
  const [aiPrompt, setAiPrompt] = useState('');
  const [tplName, setTplName] = useState('');

  const update = (obj: any, setter: any, k: string, v: any) => setter({ ...obj, [k]: v });

  const handleAiGenerate = () => {
    let hash = 0;
    for (let i = 0; i < aiPrompt.length; i++) hash = aiPrompt.charCodeAt(i) + ((hash << 5) - hash);
    const rand = () => { const x = Math.sin(hash++) * 10000; return x - Math.floor(x); };

    const newPhysics = { ...physics };
    const newVisuals = { ...visuals };

    if (aiPrompt.toLowerCase().includes('fast')) { newPhysics.gravityY = 1.2; newPhysics.maxSpeed = 100; }
    if (aiPrompt.toLowerCase().includes('slow')) { newPhysics.gravityY = 0.2; newPhysics.maxSpeed = 30; }
    if (aiPrompt.toLowerCase().includes('bounce')) { newPhysics.restitution = 1.2; newPhysics.speedIncreaseOnBounce = 0.05; }
    if (aiPrompt.toLowerCase().includes('heavy')) { newPhysics.gravityY = 1.5; newVisuals.ballRadius = 50; }
    if (aiPrompt.toLowerCase().includes('tiny')) { newVisuals.ballRadius = 10; newPhysics.gravityY = 0.4; }
    if (aiPrompt.toLowerCase().includes('chaos')) { newPhysics.speedIncreaseOnBounce = 0.1; newPhysics.restitution = 1.3; }
    
    if (!aiPrompt.includes('red') && !aiPrompt.includes('blue')) {
       newVisuals.ballColor = `hsl(${rand() * 360}, 100%, 50%)`;
       newVisuals.arcColor = `hsl(${rand() * 360}, 100%, 50%)`;
    }

    setPhysics(newPhysics);
    setVisuals(newVisuals);
    onReset();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'ballImage' | 'centerImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        update(visuals, setVisuals, field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPaletteColor = () => {
      const newColors = [...visuals.arcPalette, '#ffffff'];
      update(visuals, setVisuals, 'arcPalette', newColors);
  };

  const updatePaletteColor = (index: number, color: string) => {
      const newColors = [...visuals.arcPalette];
      newColors[index] = color;
      update(visuals, setVisuals, 'arcPalette', newColors);
  };
  
  const removePaletteColor = (index: number) => {
      const newColors = visuals.arcPalette.filter((_, i) => i !== index);
      update(visuals, setVisuals, 'arcPalette', newColors);
  };

  const handlePointerDownStop = (e: React.PointerEvent) => {
      e.stopPropagation();
  };

  return (
    <div className="absolute left-6 top-6 bottom-6 w-[23rem] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden text-zinc-100 z-50" onPointerDown={handlePointerDownStop}>
      <div className="p-8 flex items-center justify-between bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase tracking-widest">ZenBounce FX</h2>
            <p className="text-[9px] text-zinc-500 font-mono uppercase">Framework v2.5</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onAddBall} className="p-2.5 bg-indigo-600 rounded-xl hover:bg-indigo-500 shadow-md transition-all"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex p-2 bg-black/40 gap-1 mx-6 mt-6 rounded-2xl border border-white/5">
        {[
          { id: 'vis', icon: Palette, label: 'Vis' },
          { id: 'phy', icon: Zap, label: 'Phy' },
          { id: 'tpl', icon: Save, label: 'Sets' },
          { id: 'prd', icon: Clapperboard, label: 'Exp' }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all ${tab === t.id ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <t.icon className="w-3.5 h-3.5" />
            <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
        <button onClick={() => setTab('ai')} className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all ${tab === 'ai' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Wand2 className="w-3.5 h-3.5" />
            <span className="text-[8px] font-black uppercase tracking-widest">AI</span>
        </button>
        <button onClick={() => setTab('txt')} className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all ${tab === 'txt' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Type className="w-3.5 h-3.5" />
            <span className="text-[8px] font-black uppercase tracking-widest">Txt</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        {tab === 'vis' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <Section icon={Eye} label="Preparation">
                <Toggle label="Show Ghost Spawn" active={visuals.showSpawnPreview} onClick={() => update(visuals, setVisuals, 'showSpawnPreview', !visuals.showSpawnPreview)} />
                <Toggle label="Show Trajectory" active={visuals.showTrajectory} onClick={() => update(visuals, setVisuals, 'showTrajectory', !visuals.showTrajectory)} />
                <Control label="Reset Alignment Angle" v={visuals.arcInitialAngle || 0} min={0} max={360} onChange={v => update(visuals, setVisuals, 'arcInitialAngle', v)} />
                <p className="text-[9px] text-zinc-500 mt-1">Sets exact ring rotation on reset.</p>
            </Section>

            <Section icon={Shapes} label="Shape & Ball">
              <div className="grid grid-cols-6 gap-2 mb-4">
                {(['circle', 'square', 'triangle', 'hexagon', 'star', 'image'] as BallShape[]).map(s => (
                  <button key={s} onClick={() => update(visuals, setVisuals, 'ballShape', s)} className={`aspect-square flex items-center justify-center rounded-xl border transition-all ${visuals.ballShape === s ? 'bg-indigo-600 border-indigo-400' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                    {s === 'image' ? <ImageIcon className="w-3 h-3" /> : <div className={`w-3 h-3 bg-current ${s === 'circle' ? 'rounded-full' : ''}`} />}
                  </button>
                ))}
              </div>
              {visuals.ballShape === 'image' && (
                  <div className="mb-4">
                      <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors">
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'ballImage')} />
                          <div className="flex flex-col items-center gap-2 text-zinc-500">
                              <Upload className="w-4 h-4" />
                              <span className="text-[9px] font-bold uppercase">Upload Ball Texture</span>
                          </div>
                      </label>
                  </div>
              )}
              <Control label="Ball Radius" v={visuals.ballRadius} min={5} max={80} onChange={v => update(visuals, setVisuals, 'ballRadius', v)} />
              <Color label="Ball Color" v={visuals.ballColor} onChange={v => update(visuals, setVisuals, 'ballColor', v)} />
            </Section>

            <Section icon={Ghost} label="The Arc">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(['solid', 'gradient', 'multicolor', 'rainbow'] as ArcStyle[]).map(s => (
                    <button key={s} onClick={() => update(visuals, setVisuals, 'arcStyle', s)} className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${visuals.arcStyle === s ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                        {s}
                    </button>
                ))}
              </div>
              
              {visuals.arcStyle === 'solid' && (
                 <Color label="Arc Color" v={visuals.arcColor} onChange={(v: string) => update(visuals, setVisuals, 'arcColor', v)} />
              )}

              {visuals.arcStyle === 'gradient' && (
                  <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-3">Gradient Colors</span>
                      <Color label="Start" v={visuals.arcGradientColors[0]} onChange={(v: string) => {
                          const newColors = [...visuals.arcGradientColors];
                          newColors[0] = v;
                          update(visuals, setVisuals, 'arcGradientColors', newColors);
                      }} />
                      <Color label="End" v={visuals.arcGradientColors[1]} onChange={(v: string) => {
                          const newColors = [...visuals.arcGradientColors];
                          newColors[1] = v;
                          update(visuals, setVisuals, 'arcGradientColors', newColors);
                      }} />
                  </div>
              )}
              
              {visuals.arcStyle === 'multicolor' && (
                  <div className="mb-4 space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-bold uppercase text-zinc-400">Palette Colors</span>
                          <button onClick={addPaletteColor} className="p-1 bg-white/10 rounded hover:bg-white/20"><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                          {visuals.arcPalette.map((c, i) => (
                              <div key={i} className="relative group">
                                  <input type="color" value={c} onChange={e => updatePaletteColor(i, e.target.value)} className="w-full h-8 bg-transparent border-none rounded cursor-pointer" />
                                  <button onClick={() => removePaletteColor(i)} className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-2 h-2 text-white" /></button>
                              </div>
                          ))}
                      </div>
                      <Control label="Segments" v={visuals.arcSegments} min={2} max={60} step={1} onChange={v => update(visuals, setVisuals, 'arcSegments', v)} />
                  </div>
              )}

              <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['round', 'butt', 'square'] as LineCapStyle[]).map(c => (
                      <button key={c} onClick={() => update(visuals, setVisuals, 'lineCap', c)} className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${visuals.lineCap === c ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                          {c} cap
                      </button>
                  ))}
              </div>

              <Control label="Circle Radius" v={visuals.arcRadius} min={100} max={600} onChange={v => update(visuals, setVisuals, 'arcRadius', v)} />
              <Control label="Thickness" v={visuals.arcThickness} min={1} max={100} onChange={v => update(visuals, setVisuals, 'arcThickness', v)} />
              <Control label="Line Gap" v={visuals.arcGap} min={0} max={359} onChange={v => update(visuals, setVisuals, 'arcGap', v)} />
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                 <Toggle label="Spin Arc" active={visuals.arcRotationEnabled} onClick={() => update(visuals, setVisuals, 'arcRotationEnabled', !visuals.arcRotationEnabled)} />
                 <Control label="Speed" v={visuals.rotationSpeed} min={-0.1} max={0.1} step={0.001} onChange={v => update(visuals, setVisuals, 'rotationSpeed', v)} />
              </div>

              <Toggle label="9:16 Frame" active={visuals.show916Frame} onClick={() => update(visuals, setVisuals, 'show916Frame', !visuals.show916Frame)} />
              
              <div className="mt-4 pt-4 border-t border-white/5">
                  <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'centerImage')} />
                      <div className="flex flex-col items-center gap-2 text-zinc-500">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-[9px] font-bold uppercase">{visuals.centerImage ? 'Change Center Image' : 'Set Center Image'}</span>
                      </div>
                  </label>
                  {visuals.centerImage && <button onClick={() => update(visuals, setVisuals, 'centerImage', '')} className="text-[9px] text-red-400 mt-2 w-full text-center">Remove Image</button>}
              </div>
            </Section>

            <Section icon={Sparkles} label="Cinematics">
              <Toggle label="Glow FX" active={visuals.glowEffect} onClick={() => update(visuals, setVisuals, 'glowEffect', !visuals.glowEffect)} />
              {visuals.glowEffect && (
                  <Toggle label="Keep Glow When Frozen" active={visuals.glowOnFrozen} onClick={() => update(visuals, setVisuals, 'glowOnFrozen', !visuals.glowOnFrozen)} />
              )}
              <Toggle label="Gray on Freeze" active={visuals.freezeGrayscale} onClick={() => update(visuals, setVisuals, 'freezeGrayscale', !visuals.freezeGrayscale)} />
              <Toggle label="Show Trails" active={visuals.showTrail} onClick={() => update(visuals, setVisuals, 'showTrail', !visuals.showTrail)} />
              <Control label="Trail Length" v={visuals.trailLength} min={0} max={100} onChange={v => update(visuals, setVisuals, 'trailLength', v)} />
              <Toggle label="Hit Flash" active={visuals.hitFlash} onClick={() => update(visuals, setVisuals, 'hitFlash', !visuals.hitFlash)} />
            </Section>

            <Section icon={Bomb} label="Destruction FX">
              <Toggle label="Explode on Finish" active={visuals.explosionEffect} onClick={() => update(visuals, setVisuals, 'explosionEffect', !visuals.explosionEffect)} />
              <Control label="Explosion Intensity" v={visuals.explosionIntensity} min={0.5} max={5} step={0.1} onChange={v => update(visuals, setVisuals, 'explosionIntensity', v)} />
              <button onClick={onExplodeAll} className="w-full py-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600/30 transition-all">
                Manual Explode All
              </button>
            </Section>
          </div>
        )}

        {tab === 'phy' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <Section icon={Rocket} label="Launch Config">
               <div className="grid grid-cols-2 gap-2 mb-4">
                {(['random', 'manual', 'away_from_gap', 'fixed'] as SpawnType[]).map(t => (
                  <button key={t} onClick={() => update(physics, setPhysics, 'spawnType', t)} className={`py-2 px-1 text-[8px] font-black uppercase rounded-xl border transition-all ${physics.spawnType === t ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                    {t.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              {physics.spawnType === 'fixed' && (
                <>
                  <Control label="Spawn X" v={physics.spawnX} min={0} max={1} step={0.01} onChange={v => update(physics, setPhysics, 'spawnX', v)} />
                  <Control label="Spawn Y" v={physics.spawnY} min={0} max={1} step={0.01} onChange={v => update(physics, setPhysics, 'spawnY', v)} />
                </>
              )}
              {physics.spawnType !== 'away_from_gap' && (
                <Control label="Launch Angle" v={physics.spawnAngle} min={0} max={360} onChange={v => update(physics, setPhysics, 'spawnAngle', v)} />
              )}
              <Control label="Launch Speed" v={physics.initialImpulse} min={0} max={150} onChange={v => update(physics, setPhysics, 'initialImpulse', v)} />
              
              <div className="mt-4 pt-4 border-t border-white/5">
                  <Toggle label="Deterministic (No Random)" active={physics.deterministic} onClick={() => update(physics, setPhysics, 'deterministic', !physics.deterministic)} />
                  <p className="text-[9px] text-zinc-500 mt-1">If enabled, every reset will follow the exact same path.</p>
              </div>
              
              {onFindMagicSpawn && (
                  <button onClick={onFindMagicSpawn} className="w-full py-3 mt-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2">
                      <Sparkles className="w-3 h-3" /> Find Close Call Spawn
                  </button>
              )}
            </Section>

            <Section icon={Gauge} label="Motion Modifiers">
              <Control label="Gravity" v={physics.gravityY} min={0} max={2} step={0.01} onChange={v => update(physics, setPhysics, 'gravityY', v)} />
              <Control label="Bounciness" v={physics.restitution} min={0.5} max={1.5} step={0.01} onChange={v => update(physics, setPhysics, 'restitution', v)} />
              <Control label="Bounce Speed Up" v={physics.speedIncreaseOnBounce} min={0} max={0.1} step={0.001} onChange={v => update(physics, setPhysics, 'speedIncreaseOnBounce', v)} />
              <Control label="Friction / Air Drag" v={1 - physics.drag} min={0} max={0.1} step={0.0001} onChange={v => update(physics, setPhysics, 'drag', 1 - v)} />
              
              <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[9px] text-zinc-500 mb-2 font-bold uppercase">Chaos & Realism</p>
                  <Control label="Bounce Randomness" v={physics.collisionScatter} min={0} max={1.0} step={0.01} onChange={v => update(physics, setPhysics, 'collisionScatter', v)} />
                  <Toggle label="Random Color on Hit" active={physics.colorChangeOnBounce} onClick={() => update(physics, setPhysics, 'colorChangeOnBounce', !physics.colorChangeOnBounce)} />
              </div>
            </Section>

            <Section icon={Snowflake} label="Logic & Freeze">
              <Toggle label="Lock Gap (While Timer)" active={physics.lockGap} onClick={() => update(physics, setPhysics, 'lockGap', !physics.lockGap)} />
              <Toggle label="Freeze on Finish" active={physics.freezeOnFinish} onClick={() => update(physics, setPhysics, 'freezeOnFinish', !physics.freezeOnFinish)} />
              <Toggle label="Auto Spawn on Freeze" active={physics.autoSpawnOnFreeze} onClick={() => update(physics, setPhysics, 'autoSpawnOnFreeze', !physics.autoSpawnOnFreeze)} />
            </Section>

            <Section icon={Skull} label="Hazards">
              <Toggle label="Enable Spikes" active={physics.spikesActive} onClick={() => update(physics, setPhysics, 'spikesActive', !physics.spikesActive)} />
              {physics.spikesActive && (
                <>
                  <Toggle label="Precise Hitbox" active={physics.preciseSpikeCollision} onClick={() => update(physics, setPhysics, 'preciseSpikeCollision', !physics.preciseSpikeCollision)} />
                  <div className="mt-2 mb-2 p-3 bg-white/5 rounded-xl">
                      <Toggle label="Independent Spin" active={visuals.independentSpikes} onClick={() => update(visuals, setVisuals, 'independentSpikes', !visuals.independentSpikes)} />
                      {visuals.independentSpikes && (
                          <Control label="Spike Speed" v={visuals.spikeRotationSpeed} min={-0.2} max={0.2} step={0.001} onChange={v => update(visuals, setVisuals, 'spikeRotationSpeed', v)} />
                      )}
                  </div>
                  <Control label="Spike Count" v={visuals.spikeCount} min={1} max={50} step={1} onChange={v => update(visuals, setVisuals, 'spikeCount', v)} />
                  <Control label="Spike Length" v={visuals.spikeLength} min={10} max={100} onChange={v => update(visuals, setVisuals, 'spikeLength', v)} />
                  <Control label="Spike Width" v={visuals.spikeWidth} min={5} max={150} onChange={v => update(visuals, setVisuals, 'spikeWidth', v)} />
                  <Toggle label="Hollow Spikes" active={visuals.spikeHollow} onClick={() => update(visuals, setVisuals, 'spikeHollow', !visuals.spikeHollow)} />
                  <Color label="Spike Color" v={visuals.spikeColor} onChange={v => update(visuals, setVisuals, 'spikeColor', v)} />
                </>
              )}
            </Section>
            
            <Section icon={Music} label="Audio Engine">
              <Toggle label="Enable Sound" active={physics.soundEnabled} onClick={() => update(physics, setPhysics, 'soundEnabled', !physics.soundEnabled)} />
              <Toggle label="Reverb / Echo" active={physics.soundReverb} onClick={() => update(physics, setPhysics, 'soundReverb', !physics.soundReverb)} />
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                  <Toggle label="Sound on Hit (Ball)" active={physics.soundOnCollision} onClick={() => update(physics, setPhysics, 'soundOnCollision', !physics.soundOnCollision)} />
                  <Toggle label="Melody on Hit" active={physics.melodyOnCollision} onClick={() => update(physics, setPhysics, 'melodyOnCollision', !physics.melodyOnCollision)} />
              </div>
              
              <Control label="Master Volume" v={physics.soundVolume} min={0} max={1} step={0.1} onChange={v => update(physics, setPhysics, 'soundVolume', v)} />
              {physics.soundReverb && (
                 <Control label="Echo Duration (s)" v={physics.soundReverbDuration} min={0.1} max={5.0} step={0.1} onChange={v => update(physics, setPhysics, 'soundReverbDuration', v)} />
              )}
              
              <Control label="Base Pitch (Hz)" v={physics.baseFreq} min={50} max={1000} onChange={v => update(physics, setPhysics, 'baseFreq', v)} />
              <Control label="Pitch Step (Hz)" v={physics.freqStep} min={0} max={100} onChange={v => update(physics, setPhysics, 'freqStep', v)} />
              <Control label="Pitch Chaos" v={physics.soundPitchRandom} min={0} max={1000} step={10} onChange={v => update(physics, setPhysics, 'soundPitchRandom', v)} />
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                 <Control label="Attack (s)" v={physics.soundAttack} min={0.001} max={0.5} step={0.001} onChange={v => update(physics, setPhysics, 'soundAttack', v)} />
                 <Control label="Decay (s)" v={physics.soundDecay} min={0.01} max={1.0} step={0.01} onChange={v => update(physics, setPhysics, 'soundDecay', v)} />
              </div>

              <div className="grid grid-cols-5 gap-2 mt-4 mb-4">
                {(['sine', 'square', 'sawtooth', 'triangle', 'piano'] as SoundWaveform[]).map(w => (
                   <button key={w} onClick={() => update(physics, setPhysics, 'soundWaveform', w)} className={`py-2 text-[8px] font-black uppercase rounded-xl border transition-all ${physics.soundWaveform === w ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                    {w.slice(0,4)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {['NONE', 'CUSTOM', 'PENTATONIC', 'MEGALOVANIA', 'DOREMI', 'MII_CHANNEL', 'WII_SHOP', 'TETRIS', 'ZELDA', 'MARIO', 'HARRY_POTTER', 'LAMOUR_TOUJOURS'].map(m => (
                  <button key={m} onClick={() => update(visuals, setVisuals, 'melody', m)} className={`py-3 px-1 text-[8px] font-black uppercase rounded-xl border transition-all truncate ${visuals.melody === m ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
              {visuals.melody === 'CUSTOM' && (
                  <div className="mt-2">
                      <p className="text-[9px] text-zinc-500 mb-1">Frequencies (comma separated)</p>
                      <input type="text" value={visuals.customMelody} onChange={e => update(visuals, setVisuals, 'customMelody', e.target.value)} className="w-full p-2 bg-white/5 rounded-lg text-xs font-mono" />
                  </div>
              )}
            </Section>
            
            <Section icon={Code} label="Scripting (Adv)">
              <p className="text-[9px] text-zinc-500 mb-2">JSON Events: [{"time":5, "type":"gravity", "value":1.5}]</p>
              <textarea 
                value={physics.scriptJSON} 
                onChange={e => update(physics, setPhysics, 'scriptJSON', e.target.value)} 
                className="w-full h-24 p-2 bg-white/5 rounded-xl text-[10px] font-mono text-zinc-300 border border-white/5 outline-none" 
              />
            </Section>
          </div>
        )}

        {tab === 'tpl' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
             <Section icon={FileJson} label="Saved Templates">
                <div className="flex gap-2 mb-4">
                    <input type="text" value={tplName} onChange={e => setTplName(e.target.value)} placeholder="Template Name" className="flex-1 p-3 bg-white/5 rounded-xl text-xs outline-none" />
                    <button onClick={() => { saveTemplate(tplName); setTplName(''); }} className="p-3 bg-indigo-600 rounded-xl"><Save className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                    {templates.map(t => (
                        <div key={t.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-xs font-bold">{t.name}</span>
                            <div className="flex gap-2">
                                <button onClick={() => loadTemplate(t.name)} className="p-2 hover:bg-white/10 rounded-lg"><Download className="w-3 h-3" /></button>
                                <button onClick={() => deleteTemplate(t.name)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && <p className="text-center text-zinc-600 text-xs py-4">No templates saved.</p>}
                </div>
             </Section>
             <Section icon={RotateCcw} label="Defaults">
                <button onClick={onSetDefaults} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 hover:bg-white/10 transition-all">
                    Set Current as New Default
                </button>
                <p className="text-[9px] text-zinc-600 mt-2 text-center">Pressing Reset will revert to these settings.</p>
                <button onClick={onRestoreDefaults} className="w-full py-2 mt-4 text-[9px] text-red-400 hover:text-red-300">
                    Factory Reset All Data
                </button>
             </Section>
          </div>
        )}

        {tab === 'txt' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
             <Section icon={Type} label="End Screen">
                <p className="text-[10px] text-zinc-500 mb-2">Displayed after simulation ends.</p>
                <textarea 
                  value={visuals.endText} 
                  onChange={e => update(visuals, setVisuals, 'endText', e.target.value)} 
                  placeholder="Like & Subscribe!" 
                  className="w-full h-16 p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors" 
                />
                <Control label="Duration (s)" v={visuals.endSceneDuration || 4.0} min={1} max={10} step={0.1} onChange={v => update(visuals, setVisuals, 'endSceneDuration', v)} />
             </Section>
             
             <Section icon={Type} label="Overlays">
              <textarea 
                value={visuals.overlayText} 
                onChange={e => update(visuals, setVisuals, 'overlayText', e.target.value)} 
                placeholder="TITLE TEXT" 
                className="w-full h-24 p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors" 
              />
              <Control label="Position Y" v={visuals.overlayTextY} min={-600} max={600} onChange={v => update(visuals, setVisuals, 'overlayTextY', v)} />
              <Control label="Text Size" v={visuals.overlayFontSize} min={20} max={200} onChange={v => update(visuals, setVisuals, 'overlayFontSize', v)} />
              <Color label="Text Color" v={visuals.overlayTextColor} onChange={v => update(visuals, setVisuals, 'overlayTextColor', v)} />
              
              <div className="space-y-1 mt-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Font Weight</span>
                  <input type="text" value={visuals.overlayFontWeight} onChange={e => update(visuals, setVisuals, 'overlayFontWeight', e.target.value)} className="w-full p-2 bg-white/5 rounded-lg text-xs font-bold text-zinc-200 outline-none border border-white/5 focus:border-indigo-500 transition-all" />
              </div>
            </Section>

             <Section icon={Type} label="Countdown / Counter">
                <Toggle label="Enabled" active={counter.enabled} onClick={() => update(counter, setCounter, 'enabled', !counter.enabled)} />
                {counter.enabled && (
                    <>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                           {(['TIMER', 'SEQUENCE', 'LINEAR', 'EXPONENTIAL'] as CounterMode[]).map(m => (
                               <button key={m} onClick={() => update(counter, setCounter, 'mode', m)} className={`py-2 text-[8px] font-black uppercase rounded-lg border transition-all ${counter.mode === m ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                                   {m}
                               </button>
                           ))}
                        </div>
                        
                        {counter.mode === 'TIMER' && (
                            <Control label="Seconds" v={counter.seconds} min={1} max={300} onChange={v => update(counter, setCounter, 'seconds', v)} />
                        )}
                        {counter.mode === 'SEQUENCE' && (
                             <div className="mb-4">
                                 <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Sequence (CSV)</span>
                                 <input type="text" value={counter.sequenceStr} onChange={e => update(counter, setCounter, 'sequenceStr', e.target.value)} className="w-full p-2 mt-1 bg-white/5 border border-white/5 rounded text-[10px] font-mono" />
                             </div>
                        )}
                        {(counter.mode === 'LINEAR' || counter.mode === 'EXPONENTIAL') && (
                             <>
                                <Control label="Start Value" v={counter.mathStart} min={0} max={100} onChange={v => update(counter, setCounter, 'mathStart', v)} />
                                {counter.mode === 'LINEAR' && <Control label="Step" v={counter.mathStep} min={-100} max={100} onChange={v => update(counter, setCounter, 'mathStep', v)} />}
                                {counter.mode === 'EXPONENTIAL' && <Control label="Factor" v={counter.mathFactor} min={0} max={10} step={0.1} onChange={v => update(counter, setCounter, 'mathFactor', v)} />}
                             </>
                        )}
                        
                        <div className="border-t border-white/5 pt-4 mt-4">
                            <Control label="Font Size" v={counter.fontSize} min={10} max={500} onChange={v => update(counter, setCounter, 'fontSize', v)} />
                            <Control label="Vertical Offset" v={counter.yOffset} min={-500} max={500} onChange={v => update(counter, setCounter, 'yOffset', v)} />
                            <Control label="Opacity" v={counter.opacity} min={0} max={1} step={0.01} onChange={v => update(counter, setCounter, 'opacity', v)} />
                            <Toggle label="Show Decimals" active={counter.showDecimals} onClick={() => update(counter, setCounter, 'showDecimals', !counter.showDecimals)} />
                             <div className="grid grid-cols-2 gap-2 mt-2">
                                <button onClick={() => update(counter, setCounter, 'textPosition', 'ball')} className={`py-2 text-[8px] font-black uppercase rounded-lg border ${counter.textPosition === 'ball' ? 'bg-indigo-600 border-indigo-400' : 'bg-white/5 border-white/5'}`}>On Ball</button>
                                <button onClick={() => update(counter, setCounter, 'textPosition', 'center')} className={`py-2 text-[8px] font-black uppercase rounded-lg border ${counter.textPosition === 'center' ? 'bg-indigo-600 border-indigo-400' : 'bg-white/5 border-white/5'}`}>In Center</button>
                            </div>
                        </div>
                    </>
                )}
             </Section>
          </div>
        )}

        {tab === 'prd' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <Section icon={Clapperboard} label="Video Production">
                    <Control label="Max Duration (s)" v={production.maxVideoDuration} min={0} max={300} onChange={v => update(production, setProduction, 'maxVideoDuration', v)} />
                    <Control label="Resolution Scale" v={production.resolutionScale} min={0.5} max={3.0} step={0.1} onChange={v => update(production, setProduction, 'resolutionScale', v)} />
                    <Toggle label="Force 9:16 HD (1080x1920)" active={production.forceHD} onClick={() => update(production, setProduction, 'forceHD', !production.forceHD)} />
                    <Toggle label="Cinematic Zoom Out" active={production.cinematicOut} onClick={() => update(production, setProduction, 'cinematicOut', !production.cinematicOut)} />
                    {production.cinematicOut && (
                        <Control label="Zoom Speed" v={production.cinematicZoomSpeed} min={0.001} max={0.05} step={0.001} onChange={v => update(production, setProduction, 'cinematicZoomSpeed', v)} />
                    )}
                    <Toggle label="Cinematic Dust" active={production.cinematicDust} onClick={() => update(production, setProduction, 'cinematicDust', !production.cinematicDust)} />
                    <Toggle label="Cinematic Explosion" active={production.cinematicExplosion} onClick={() => update(production, setProduction, 'cinematicExplosion', !production.cinematicExplosion)} />
                </Section>
                
                <Section icon={Layers} label="Batch & Automation">
                    <Control label="Batch Count" v={production.batchCount} min={1} max={100} step={1} onChange={v => update(production, setProduction, 'batchCount', v)} />
                    <Toggle label="Auto Save" active={production.autoSave} onClick={() => update(production, setProduction, 'autoSave', !production.autoSave)} />
                    <Toggle label="Preview Before Save" active={production.previewBeforeSave} onClick={() => update(production, setProduction, 'previewBeforeSave', !production.previewBeforeSave)} />
                    
                    <button 
                        onClick={onStartBatch}
                        className={`w-full py-4 mt-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                    >
                        {isRecording ? `Recording... (Take ${currentTake})` : 'Start Batch Recording'}
                    </button>
                </Section>
            </div>
        )}
        
        {tab === 'ai' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                 <Section icon={Wand2} label="AI Generator">
                     <p className="text-[10px] text-zinc-500 mb-2">Describe the physics and visuals you want.</p>
                     <textarea 
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="e.g., fast heavy balls with red neon glow and square shape"
                        className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                     />
                     <button onClick={handleAiGenerate} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-opacity">
                         Generate Settings
                     </button>
                 </Section>
            </div>
        )}

      </div>

      <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-sm">
         <div className="flex gap-2">
            <button onClick={() => setIsRunning(!isRunning)} className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[10px] transition-all ${isRunning ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-black hover:bg-zinc-200'}`}>
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? 'Pause' : 'Start'}
            </button>
            <button onClick={onReset} className="w-14 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                <RotateCcw className="w-4 h-4" />
            </button>
         </div>
      </div>
    </div>
  );
};

export default ControlPanel;