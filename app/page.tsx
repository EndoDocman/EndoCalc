'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTargetHeightData, calculateHeightSDS, calculateWeightSDS, calculateBMI, calculateAges, calculateSPLSDS, zToPercentile } from '@/lib/auxology';
import { Baby, Users, Menu, X, Activity, ShieldAlert, TrendingUp, Clock, Dna } from 'lucide-react';

type Module = 'auxology' | 'spl';

export default function EndoCalc() {
  const [activeModule, setActiveModule] = useState<Module>('auxology');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auxology State
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState(10);
  const [height, setHeight] = useState(135);
  const [weight, setWeight] = useState(30);
  const [fatherHt, setFatherHt] = useState(170);
  const [motherHt, setMotherHt] = useState(160);

  // SPL State
  const [splValue, setSplValue] = useState(4.5);

  const { targetHeight, thSDS } = calculateTargetHeightData(fatherHt, motherHt, sex);
  const heightRes = useMemo(() => calculateHeightSDS(height, age, sex), [height, age, sex]);
  const weightRes = useMemo(() => calculateWeightSDS(weight, age, sex), [weight, age, sex]);
  const heightAge = useMemo(() => calculateAges(height, 'height', sex), [height, sex]);
  const weightAge = useMemo(() => calculateAges(weight, 'weight', sex), [weight, sex]);
  const bmi = useMemo(() => calculateBMI(weight, height), [weight, height]);

  const splRes = useMemo(() => calculateSPLSDS(splValue, age), [splValue, age]);

  const hPercentile = useMemo(() => zToPercentile(heightRes.sds), [heightRes.sds]);
  const wPercentile = useMemo(() => zToPercentile(weightRes.sds), [weightRes.sds]);
  const thPercentile = useMemo(() => zToPercentile(thSDS), [thSDS]);
  const splPercentile = useMemo(() => splRes ? zToPercentile(splRes.sds) : 'N/A', [splRes]);

  const menuItems = [
    { id: 'auxology', label: 'Auxology Engine', icon: <Baby className="w-4 h-4" /> },
    { id: 'spl', label: 'SPL Centiles', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#05070a] p-4 md:p-8 flex flex-col items-center overflow-x-hidden">
      
      {/* Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 bottom-0 w-72 bg-[#0a0c10] border-l border-white/10 z-50 p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Modules</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5 text-white/60" /></button>
              </div>
              <nav className="space-y-4">
                {menuItems.map((item) => (
                  <button key={item.id} onClick={() => { setActiveModule(item.id as Module); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${activeModule === item.id ? 'bg-cyan-400/10 border-cyan-400 text-cyan-400' : 'border-white/5 text-white/40 hover:bg-white/5'}`}>
                    {item.icon} <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 relative z-30">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic">Endo<span className="text-cyan-400">Calc</span></h1>
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"><Menu className="w-6 h-6 text-cyan-400" /></button>
      </div>

      <AnimatePresence mode="wait">
        {activeModule === 'auxology' ? (
          <motion.div key="auxology" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section className="p-8 backdrop-blur-3xl bg-white/[0.02] border border-white/10 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-8"><Baby className="w-4 h-4 text-cyan-400" /><h2 className="text-[10px] font-bold uppercase tracking-widest text-white/60">Patient Details</h2></div>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <button onClick={() => setSex('male')} className={`flex-1 py-4 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest ${sex === 'male' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-white/5 text-white/20'}`}>Boy</button>
                    <button onClick={() => setSex('female')} className={`flex-1 py-4 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest ${sex === 'female' ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-white/5 text-white/20'}`}>Girl</button>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4"><label className="text-[10px] text-white/30 uppercase font-bold">Age (Years)</label><input type="number" value={age} step="0.01" onChange={(e) => setAge(parseFloat(e.target.value) || 0)} className="bg-transparent text-cyan-400 font-mono text-sm font-bold text-right w-16 focus:outline-none" /></div>
                    <input type="range" min="0" max="18" step="0.1" value={age} onChange={(e) => setAge(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4"><label className="text-[10px] text-white/30 uppercase font-bold">Height (cm)</label><input type="number" value={height} step="0.1" onChange={(e) => setHeight(parseFloat(e.target.value) || 0)} className="bg-transparent text-cyan-400 font-mono text-sm font-bold text-right w-16 focus:outline-none" /></div>
                    <input type="range" min="40" max="220" step="0.1" value={height} onChange={(e) => setHeight(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4"><label className="text-[10px] text-white/30 uppercase font-bold">Weight (kg)</label><input type="number" value={weight} step="0.1" onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} className="bg-transparent text-cyan-400 font-mono text-sm font-bold text-right w-16 focus:outline-none" /></div>
                    <input type="range" min="2" max="150" step="0.1" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                  </div>
                </div>
              </section>
              <section className="p-8 backdrop-blur-3xl bg-white/[0.02] border border-white/10 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-6"><Users className="w-4 h-4 text-cyan-400" /><h2 className="text-[10px] font-bold uppercase tracking-widest text-white/60">Parental Heights</h2></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl"><label className="text-[8px] text-white/30 uppercase font-bold mb-2 block">Father (cm)</label><input type="number" value={fatherHt} onChange={(e) => setFatherHt(parseInt(e.target.value) || 0)} className="bg-transparent text-white font-mono text-xs font-bold w-full focus:outline-none" /></div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl"><label className="text-[8px] text-white/30 uppercase font-bold mb-2 block">Mother (cm)</label><input type="number" value={motherHt} onChange={(e) => setMotherHt(parseInt(e.target.value) || 0)} className="bg-transparent text-white font-mono text-xs font-bold w-full focus:outline-none" /></div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-6 bg-cyan-400 rounded-[2rem] text-[#05070a] shadow-xl"><div className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Ht SDS</div><div className="text-xl md:text-3xl font-black tracking-tighter">{heightRes.sds.toFixed(2)}</div><div className="text-[7px] font-bold opacity-40 mt-1">{hPercentile}</div></div>
                <div className="p-6 bg-indigo-400 rounded-[2rem] text-[#05070a] shadow-xl"><div className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Th SDS</div><div className="text-xl md:text-3xl font-black tracking-tighter">{thSDS.toFixed(2)}</div><div className="text-[7px] font-bold opacity-40 mt-1">{thPercentile}</div></div>
                <div className="p-6 bg-amber-400 rounded-[2rem] text-[#05070a] shadow-xl"><div className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Wt SDS</div><div className="text-xl md:text-3xl font-black tracking-tighter">{weightRes.sds.toFixed(2)}</div><div className="text-[7px] font-bold opacity-40 mt-1">{wPercentile}</div></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-center"><div className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-2">CA</div><div className="text-lg md:text-2xl font-black text-white">{age.toFixed(1)} <span className="text-[10px] opacity-30">y</span></div></div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-center"><div className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-2">HA</div><div className="text-lg md:text-2xl font-black text-white">{heightAge.toFixed(1)} <span className="text-[10px] opacity-30">y</span></div></div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-center"><div className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-2">WA</div><div className="text-lg md:text-2xl font-black text-white">{weightAge.toFixed(1)} <span className="text-[10px] opacity-30">y</span></div></div>
              </div>
              <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between">
                <div><div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Target Adult Height</div><div className="text-3xl font-black text-white">{targetHeight.toFixed(1)} <span className="text-[10px] opacity-30">cm</span></div></div>
                <div className="text-right"><div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">BMI</div><div className="text-2xl font-black text-white">{bmi.toFixed(1)}</div></div>
              </div>
              <div className="p-8 border-2 border-dashed border-white/5 rounded-[2.5rem] flex items-center justify-center text-white/10 text-[10px] font-black uppercase tracking-[0.5em] h-24 text-center"><span className="opacity-50 italic">Physician Interpretation Mode</span></div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="spl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="p-8 backdrop-blur-3xl bg-white/[0.02] border border-white/10 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-8"><Activity className="w-5 h-5 text-cyan-400" /><h2 className="text-sm font-bold uppercase tracking-widest text-white/60">SPL Assessment</h2></div>
                <div className="space-y-8">
                    <div><div className="flex justify-between items-center mb-4"><label className="text-[10px] text-white/30 uppercase font-bold">Measured SPL (cm)</label><input type="number" value={splValue} step="0.1" onChange={(e) => setSplValue(parseFloat(e.target.value) || 0)} className="bg-transparent text-cyan-400 font-mono text-sm font-bold text-right w-16 focus:outline-none" /></div><input type="range" min="1" max="15" step="0.1" value={splValue} onChange={(e) => setSplValue(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400" /></div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl"><p className="text-[10px] text-white/30 uppercase font-bold mb-2">Age Context</p><p className="text-white text-xs font-bold">{age.toFixed(1)} Years // {splRes?.label}</p></div>
                </div>
            </section>
            <div className="space-y-6">
                <div className="p-8 bg-cyan-400 rounded-[2.5rem] text-[#05070a] shadow-xl">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">SPL SDS</div>
                    <div className="text-5xl font-black tracking-tighter">{splRes ? splRes.sds.toFixed(2) : '---'}</div>
                    <div className="text-lg font-bold opacity-40 mt-4">{splPercentile}</div>
                </div>
                <div className="p-8 border border-white/10 bg-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-white/20 text-[7px] font-black uppercase tracking-[0.2em] text-center px-4 leading-relaxed">
                    <ShieldAlert className="w-6 h-6 mb-4 opacity-20" />
                    <span>Roy A, et al. A Cross-sectional Study of Stretched Penile Length in Boys from West Bengal, India. Indian J Endocrinol Metab. 2019.</span>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
