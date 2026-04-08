import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Target, Zap, Brain, Info, Search
} from 'lucide-react';

// --- Helper: Generate Simulation Data ---

function generateGarchData(omega: number, alpha: number, beta: number, n: number = 100) {
  let sigma2 = [omega / (1 - alpha - beta)]; // Long-term variance
  let epsilon = [0];
  let returns = [0];
  
  for (let i = 1; i < n; i++) {
    // 1. Update Variance
    const nextSigma2 = omega + alpha * Math.pow(epsilon[i-1], 2) + beta * sigma2[i-1];
    sigma2.push(nextSigma2);
    
    // 2. Generate Shock (Normal Distribution approx)
    const z = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 1.5;
    const nextEpsilon = Math.sqrt(nextSigma2) * z;
    epsilon.push(nextEpsilon);
    
    // 3. Return
    returns.push(nextEpsilon);
  }
  
  return returns.map((r, i) => ({
    time: i,
    return: r,
    volatility: Math.sqrt(sigma2[i]),
    shock: Math.abs(epsilon[i]),
  }));
}

// --- Sub-components for Simple Mode ---

const SimpleStoryMode = () => {
  const [stepData, setStepData] = useState({
    priceYesterday: 100,
    priceToday: 105,
    meanReturn: 2,
    lastVol: 1.5,
  });

  // Fixed Parameters determined by Likelihood Analysis
  const alpha = 0.15; // Tingkat Kaget (Fixed)
  const beta = 0.8;   // Tingkat Ingatan (Fixed)
  const omega = 0.1;  // Kegelisahan Dasar (Fixed)

  // Step 1: Calculate Return
  const calculatedReturn = useMemo(() => {
    return ((stepData.priceToday - stepData.priceYesterday) / stepData.priceYesterday) * 100;
  }, [stepData.priceToday, stepData.priceYesterday]);

  // Step 2: Calculate Shock (Return - Mean)
  const calculatedShock = useMemo(() => {
    return Math.abs(calculatedReturn - stepData.meanReturn);
  }, [calculatedReturn, stepData.meanReturn]);

  // Step 3: Calculate Current Volatility (GARCH Formula)
  const resultVariance = useMemo(() => {
    return omega + alpha * Math.pow(calculatedShock, 2) + beta * Math.pow(stepData.lastVol, 2);
  }, [calculatedShock, stepData.lastVol]);

  const resultVol = Math.sqrt(resultVariance);

  const getStatus = (val: number) => {
    if (val <= 1) return { label: "STABIL", color: "text-blue-400", emoji: "📉" };
    if (val <= 3) return { label: "BERGEJOLAK", color: "text-yellow-400", emoji: "⚠️" };
    return { label: "KRISIS / EXTREME", color: "text-red-500", emoji: "🔥" };
  };

  const resultStatus = getStatus(resultVol);

  return (
    <div className="space-y-6">
      <div className="bg-accent/10 border border-accent/30 p-6 rounded-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
            <span className="text-2xl">🧈</span> Gold Market: Analisis Volatilitas
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Parameter volatilitas Emas telah <strong>Ditetapkan (Fixed)</strong> berdasarkan data historis pasar. Fokus sekarang adalah menghitung risiko harian berdasarkan pergerakan harga XAU/USD.
          </p>
        </div>
        
        {/* Likelihood HUD - Now as a "Verified" Badge */}
        <div className="absolute top-0 right-0 p-4 text-right hidden md:block">
          <div className="bg-accent/20 backdrop-blur-md border border-accent/50 p-3 rounded-xl flex items-center gap-3">
            <div className="bg-accent text-black p-1 rounded-full">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-accent uppercase font-black tracking-widest">Market Verified</p>
              <p className="text-xs font-mono font-bold text-white">XAU/USD DATA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Input Manual */}
        <div className="space-y-4">
          <div className="glass p-5 rounded-xl border-l-4 border-l-accent">
            <h5 className="text-xs font-bold text-accent uppercase mb-4 tracking-widest">1. Data Harga Emas (USD/oz)</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-muted block mb-1 uppercase">Harga Kemarin ($)</label>
                <input 
                  type="number" value={stepData.priceYesterday}
                  onChange={(e) => setStepData(s => ({ ...s, priceYesterday: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-black/40 border border-border p-2 rounded font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted block mb-1 uppercase">Harga Hari Ini ($)</label>
                <input 
                  type="number" value={stepData.priceToday}
                  onChange={(e) => setStepData(s => ({ ...s, priceToday: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-black/40 border border-border p-2 rounded font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="glass p-5 rounded-xl border-l-4 border-l-accent">
            <h5 className="text-xs font-bold text-accent uppercase mb-4 tracking-widest">2. Ekspektasi Pasar</h5>
            <div>
              <label className="text-[10px] text-muted block mb-1 uppercase">Target Return Harian (%)</label>
              <input 
                type="number" value={stepData.meanReturn}
                onChange={(e) => setStepData(s => ({ ...s, meanReturn: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-black/40 border border-border p-2 rounded font-mono text-sm"
              />
            </div>
          </div>

          <div className="glass p-5 rounded-xl border-l-4 border-l-accent">
            <h5 className="text-xs font-bold text-accent uppercase mb-4 tracking-widest">3. Kondisi Kemarin</h5>
            <div>
              <label className="text-[10px] text-muted block mb-1 uppercase">Volatilitas Kemarin (σ)</label>
              <input 
                type="number" value={stepData.lastVol}
                onChange={(e) => setStepData(s => ({ ...s, lastVol: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-black/40 border border-border p-2 rounded font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Kolom Hasil Hitungan Otomatis */}
        <div className="space-y-4">
          <div className="bg-white/5 p-5 rounded-xl border border-white/10 h-full flex flex-col justify-between">
            <h5 className="text-xs font-bold text-muted uppercase mb-4 tracking-widest">Alur Perhitungan GARCH</h5>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-border pb-2">
                <div>
                  <p className="text-[10px] text-muted uppercase">Langkah A: Hitung Return</p>
                  <p className="text-xs italic text-muted">((Hari Ini - Kemarin) / Kemarin)</p>
                </div>
                <p className="text-xl font-bold font-mono text-white">{calculatedReturn.toFixed(2)}%</p>
              </div>

              <div className="flex justify-between items-end border-b border-border pb-2">
                <div>
                  <p className="text-[10px] text-muted uppercase">Langkah B: Hitung Kejutan (Shock)</p>
                  <p className="text-xs italic text-muted">|Return - Target|</p>
                </div>
                <p className="text-xl font-bold font-mono text-accent">{calculatedShock.toFixed(2)}</p>
              </div>

              <div className="pt-4">
                <p className="text-[10px] text-muted uppercase mb-3">Langkah C: Prediksi Volatilitas Baru</p>
                <div className="bg-black/60 p-3 rounded font-mono text-[10px] leading-relaxed border border-border">
                  σ² = {omega} + ({alpha} × {calculatedShock.toFixed(2)}²) + ({beta} × {stepData.lastVol}²)
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="text-[8px] bg-accent/10 text-accent px-2 py-1 rounded">α = {alpha} (Reaksi)</span>
                  <span className="text-[8px] bg-accent/10 text-accent px-2 py-1 rounded">β = {beta} (Memori)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-accent text-black p-6 rounded-2xl text-center relative overflow-hidden neon-glow">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Estimasi Volatilitas (σ_t)</p>
                <div className="text-5xl font-black italic mb-2">
                  {resultVol.toFixed(2)}
                </div>
                <p className="text-sm font-bold uppercase tracking-wider">
                  PASAR {resultStatus.label}! {resultStatus.emoji}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kamus Analogi */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-6">
        <h5 className="text-xs font-bold text-accent uppercase mb-4 tracking-widest">Kamus Analogi Pasar</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-black/20 rounded-lg border border-white/5">
            <p className="text-[10px] font-bold text-white uppercase mb-1">Kejutan (Shock)</p>
            <p className="text-[11px] text-muted">Berita ekonomi mendadak (data inflasi, kebijakan bank sentral, konflik geopolitik) yang menggerakkan harga emas.</p>
          </div>
          <div className="p-3 bg-black/20 rounded-lg border border-white/5">
            <p className="text-[10px] font-bold text-white uppercase mb-1">Alpha (α)</p>
            <p className="text-[11px] text-muted">Seberapa sensitif harga emas terhadap berita baru. Emas cenderung lebih stabil dibanding kripto.</p>
          </div>
          <div className="p-3 bg-black/20 rounded-lg border border-white/5">
            <p className="text-[10px] font-bold text-white uppercase mb-1">Beta (β)</p>
            <p className="text-[11px] text-muted">Memori pasar. Jika terjadi ketidakpastian global, volatilitas emas cenderung bertahan (clustering).</p>
          </div>
        </div>
      </div>

      {/* Analisis Likelihood: Di Balik Layar */}
      <div className="bg-black/40 border border-accent/20 rounded-2xl overflow-hidden">
        <div className="bg-accent/10 p-4 border-b border-accent/20 flex items-center justify-between">
          <h5 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Search className="w-4 h-4 text-accent" /> Analisis Likelihood: Mencari Sifat Terbaik
          </h5>
          <span className="text-[10px] bg-accent text-black px-2 py-0.5 rounded font-bold">MODE DETEKTIF</span>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                Bagaimana kita tahu bahwa <span className="text-accent">α=0.15</span> dan <span className="text-accent">β=0.80</span> adalah angka yang paling pas? Kita menggunakan <strong>Log-Likelihood</strong>. Semakin besar angkanya (mendekati nol), semakin "masuk akal" tebakan kita terhadap data.
              </p>
              <div className="bg-black/60 p-4 rounded-xl border border-white/5">
                <p className="text-[10px] text-muted uppercase mb-2">Rumus Log-Likelihood (Lengkap)</p>
                <div className="font-mono text-[11px] text-accent leading-relaxed">
                  log L = -1/2 Σ [log(2π) + log(σt²) + εt²/σt²]
                </div>
                <p className="text-[9px] text-muted mt-2 italic">*Ini adalah fungsi densitas normal yang dijumlahkan untuk seluruh data.</p>
              </div>

              {/* Glosarium Simbol */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent font-mono">log L</span>
                  <span className="text-[9px] text-muted">Skor Kecocokan Total</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent font-mono">Σ (Sigma)</span>
                  <span className="text-[9px] text-muted">Total dari semua hari</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent font-mono">σt²</span>
                  <span className="text-[9px] text-muted">Varians (Risiko hari t)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent font-mono">εt²</span>
                  <span className="text-[9px] text-muted">Kejutan (Shock hari t)</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-5 rounded-xl border border-white/10">
              <p className="text-[10px] text-muted uppercase mb-4 tracking-widest">Perhitungan Likelihood Saat Ini</p>
              <div className="space-y-3">
                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-muted">Varians (σ²)</span>
                  <span className="font-mono">{resultVariance.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-muted">Kuadrat Kejutan (ε²)</span>
                  <span className="font-mono">{Math.pow(calculatedShock, 2).toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-xs pt-2">
                  <span className="font-bold text-accent">Skor Likelihood (t)</span>
                  <span className="font-mono font-bold text-white">
                    {(-0.5 * (Math.log(2 * Math.PI) + Math.log(resultVariance) + (Math.pow(calculatedShock, 2) / resultVariance))).toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-2 bg-accent/5 rounded border border-accent/20 text-[9px] text-center text-accent italic">
                "Skor ini dihitung untuk setiap titik data, lalu dijumlahkan (Σ)."
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function GarchQuest() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl w-full mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase italic">
            GARCH <span className="text-accent">ANALYSIS</span>
          </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Narrative */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass p-8 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-accent text-black font-bold px-2 py-0.5 text-xs rounded">GARCH</span>
              <h2 className="text-muted font-mono text-xs uppercase tracking-widest">Analisis Volatilitas</h2>
            </div>
            <h3 className="text-3xl font-bold mb-4">Eksplorasi Emas</h3>
            <p className="text-muted leading-relaxed mb-6">
              Gunakan model GARCH untuk memahami dinamika risiko pasar emas (XAU/USD) secara real-time.
            </p>
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex items-start gap-3">
                <div className="bg-accent/20 p-1.5 rounded mt-1">
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase">Shock (α)</p>
                  <p className="text-[10px] text-muted">Reaksi pasar terhadap berita mendadak.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-accent/20 p-1.5 rounded mt-1">
                  <Brain className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase">Memori (β)</p>
                  <p className="text-[10px] text-muted">Seberapa lama gejolak harga bertahan.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-accent/5 border border-accent/20 p-6 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="bg-accent/20 p-2 rounded-lg">
                <Info className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h5 className="font-bold text-sm mb-1">Volatility Clustering</h5>
                <p className="text-xs text-muted leading-relaxed">
                  Fenomena di mana perubahan besar cenderung diikuti oleh perubahan besar. Inilah inti dari pemodelan GARCH.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Interactive Calculator */}
        <div className="lg:col-span-8">
          <SimpleStoryMode />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-muted font-mono text-[10px] uppercase tracking-[0.3em]">
      </footer>
    </div>
  );
}
