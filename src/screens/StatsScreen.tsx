import { useGlobalStats, useDetailedCardStats } from '../hooks/useStats';
import { db } from '../core/storage-local';
import { exportBackup, parseBackupFile, restoreBackup, mergeBackup } from '../core/backup';
import type { VokaOrbitBackup } from '../core/backup';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, BookOpen, CheckCircle, Activity, Info, Database, Clock, Sun, Moon, Download, Upload, RotateCcw, GitMerge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef } from 'react';

export function StatsScreen({ theme = 'dark', onToggleTheme }: { theme?: 'dark' | 'light'; onToggleTheme?: () => void }) {
  const isLight = theme === 'light';
  const stats = useGlobalStats();
  const detailedStats = useDetailedCardStats();

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orbit-purple"></div>
    </div>
  );

  const cardDistribution = [
    { name: 'Neu', value: stats.newCards, color: '#8B5CF6' },
    { name: 'Lernen', value: stats.learning, color: '#F59E0B' },
    { name: 'Wiederholen', value: stats.review, color: '#10B981' },
  ];

  const retentionScore = Math.round((stats.avgGrade / 5) * 100);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className={`text-3xl font-black tracking-tighter ${isLight ? 'text-[#1E1B4B]' : 'text-white'}`}>
            Lern-Statistik
          </h2>
          <p className={`text-sm font-medium ${isLight ? 'text-[rgba(30,27,75,0.60)]' : 'text-slate-500'}`}>
            Dein Fortschritt im Überblick
          </p>
        </div>
        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={onToggleTheme}
          aria-label={isLight ? 'Zu Dark Mode wechseln' : 'Zu Light Mode wechseln'}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
          style={{
            background: isLight ? 'rgba(30,27,75,0.08)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${isLight ? 'rgba(30,27,75,0.18)' : 'rgba(255,255,255,0.15)'}`,
          }}
        >
          {isLight
            ? <Moon size={18} className="text-[#1E1B4B]" />
            : <Sun size={18} className="text-amber-300" />
          }
        </button>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<BookOpen className="text-orbit-purple" size={20} />}
          label="Gesamt Karten"
          value={stats.totalCards}
          subValue={`${stats.totalReviewed} gelernt`}
        />
        <StatCard 
          icon={<TrendingUp className="text-amber-500" size={20} />}
          label="Erfolgsquote"
          value={`${retentionScore}%`}
          subValue="Basierend auf Noten"
        />
        <StatCard 
          icon={<CheckCircle className="text-emerald-500" size={20} />}
          label="Fällig"
          value={stats.totalDue}
          subValue={`${stats.dueNow} Wiederholung${stats.overdueCount > 0 ? ` (${stats.overdueCount} überfällig)` : ''}, ${stats.newCards} Neu`}
        />
        <StatCard 
          icon={<Activity className="text-blue-500" size={20} />}
          label="Aktive Decks"
          value={stats.activeDecksCount}
          subValue={`von ${stats.totalDecksCount}`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Info size={18} className="text-orbit-purple" />
            Karten-Verteilung
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cardDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1E293B',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {cardDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Database size={18} className="text-orbit-purple" />
            Aktive Decks
          </h3>
          <div className="space-y-4">
            {stats.activeDecksNames.length > 0 ? (
              stats.activeDecksNames.map((name, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="w-2 h-2 rounded-full bg-orbit-purple" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{name}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm italic">Keine Decks aktiv.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Detailed Algorithm Stats */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Clock size={18} className="text-orbit-purple" />
          Lern-Algorithmus Details
        </h3>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] sm:text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase tracking-widest font-black">
                <tr>
                  <th className="px-4 py-4 min-w-[100px]">Vokabel</th>
                  <th className="px-4 py-4 min-w-[100px]">Übersetzung</th>
                  <th className="px-4 py-4">Deck</th>
                  <th className="px-4 py-4">Intervall</th>
                  <th className="px-4 py-4">Ease</th>
                  <th className="px-4 py-4">Fälligkeit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {detailedStats?.map((card, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-200 break-words max-w-[120px]">{card.front}</td>
                    <td className="px-4 py-4 text-violet-300 font-semibold break-words max-w-[120px]">{card.back}</td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{card.deckName}</td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{card.review?.interval.toFixed(1) ?? '-'} Tage</td>
                    <td className="px-4 py-4 text-slate-500">{card.review?.ease.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {card.review ? (
                        <div className="flex flex-col gap-0.5">
                          {card.review.nextDueAt < todayMs ? (
                            <span className="text-red-400 font-black text-[10px] uppercase tracking-tighter">
                              Überfällig
                            </span>
                          ) : (
                            <span className={card.review.nextDueAt <= Date.now() ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                              {new Date(card.review.nextDueAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-violet-400 font-bold italic text-[10px]">Neu</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!detailedStats || detailedStats.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">Keine Vokabeln vorhanden.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* === DEVELOPER DEBUG INFO (auskommentiert für Production) ===
      <div className="mt-12 p-6 bg-slate-100 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Developer Debug Info</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[10px] font-mono text-slate-500">
          <div>Last Update: {new Date(stats.lastUpdate).toLocaleTimeString()}</div>
          <div>Avg Ease: 2.5 (Default)</div>
          <div>DB Version: 3</div>
          <div>Total Reviews: {stats.totalReviewed}</div>
          <div>Total Cards: {stats.totalCards}</div>
          <div>Active Decks: {stats.activeDecksCount}</div>
          <div>Due Now: {stats.dueNow}</div>
          <div>Avg Grade: {stats.avgGrade.toFixed(2)}</div>
          <div className="col-span-full pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => { if(confirm('Alle Daten löschen?')) { db.delete().then(() => window.location.reload()); } }}
              className="text-red-500 hover:underline"
            >
              [DANGER] Reset Database
            </button>
          </div>
        </div>
      </div>
      === END DEBUG === */}
      {/* ── Backup & Restore ── */}
      <BackupSection isLight={isLight} />

    </div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string | number, subValue: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="glass-card p-5"
    >
      <div className="mb-3">{icon}</div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div className="text-[10px] text-slate-500">{subValue}</div>
    </motion.div>
  );
}

/* ── Backup & Restore Section ─────────────────────────────────────────────── */
type BackupStatus =
  | { type: 'idle' }
  | { type: 'loading'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

function BackupSection({ isLight }: { isLight: boolean }) {
  const [status, setStatus] = useState<BackupStatus>({ type: 'idle' });
  const [pendingBackup, setPendingBackup] = useState<VokaOrbitBackup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const textPrimary   = isLight ? 'text-[#1E1B4B]'             : 'text-white';
  const textSecondary = isLight ? 'text-[rgba(30,27,75,0.60)]' : 'text-slate-400';
  const cardBg        = isLight ? 'light-glass-card'            : 'glass-card';

  const handleExport = async () => {
    try {
      setStatus({ type: 'loading', message: 'Backup wird erstellt…' });
      await exportBackup();
      const now = new Date().toLocaleString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      localStorage.setItem('vokaorbit_last_backup', now);
      setStatus({ type: 'success', message: `Backup gespeichert — ${now}` });
    } catch {
      setStatus({ type: 'error', message: 'Backup konnte nicht erstellt werden.' });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      setStatus({ type: 'loading', message: 'Datei wird geprüft…' });
      const backup = await parseBackupFile(file);
      setPendingBackup(backup);
      setStatus({ type: 'idle' });
    } catch (err: unknown) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Ungültige Datei.' });
    }
  };

  const handleRestore = async (mode: 'replace' | 'merge') => {
    if (!pendingBackup) return;
    const label = mode === 'replace' ? 'alle Daten ersetzt' : 'zusammengeführt';
    try {
      setStatus({ type: 'loading', message: mode === 'replace' ? 'Daten werden ersetzt…' : 'Daten werden zusammengeführt…' });
      const result = mode === 'replace'
        ? await restoreBackup(pendingBackup)
        : await mergeBackup(pendingBackup);
      setPendingBackup(null);
      setStatus({
        type: 'success',
        message: `Erfolgreich ${label}: ${result.decks} Decks, ${result.cards} Karten, ${result.reviews} Reviews.`,
      });
      setTimeout(() => window.location.reload(), 1800);
    } catch {
      setStatus({ type: 'error', message: 'Fehler beim Einspielen des Backups.' });
    }
  };

  const lastBackup = localStorage.getItem('vokaorbit_last_backup');

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-bold flex items-center gap-2 ${textPrimary}`}>
        <Database size={18} className="text-orbit-purple" />
        Backup & Wiederherstellung
      </h3>

      <div className={`${cardBg} p-6 space-y-5`}>

        {/* Export */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-sm font-bold ${textPrimary}`}>Backup erstellen</p>
            <p className={`text-[11px] mt-0.5 ${textSecondary}`}>
              {lastBackup ? `Letztes Backup: ${lastBackup}` : 'Noch kein Backup erstellt'}
            </p>
          </div>
          <motion.button
            id="backup-export-btn"
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            disabled={status.type === 'loading'}
            className="flex items-center gap-2 bg-orbit-purple hover:bg-orbit-indigo text-white font-bold px-5 py-2.5 rounded-full text-xs tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-orbit-purple/20 whitespace-nowrap"
          >
            <Download size={14} /> Exportieren
          </motion.button>
        </div>

        <div className={`h-px w-full ${isLight ? 'bg-[rgba(30,27,75,0.10)]' : 'bg-white/8'}`} />

        {/* Import */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-sm font-bold ${textPrimary}`}>Backup einspielen</p>
            <p className={`text-[11px] mt-0.5 ${textSecondary}`}>
              .json Datei aus einem früheren Export
            </p>
          </div>
          <motion.button
            id="backup-import-btn"
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={status.type === 'loading'}
            className={`flex items-center gap-2 font-bold px-5 py-2.5 rounded-full text-xs tracking-wider transition-all disabled:opacity-50 whitespace-nowrap
              ${isLight
                ? 'bg-[rgba(30,27,75,0.08)] text-[#1E1B4B] border border-[rgba(30,27,75,0.18)]'
                : 'bg-white/8 text-white border border-white/12 hover:bg-white/14'
              }`}
          >
            <Upload size={14} /> Datei wählen
          </motion.button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
        </div>

        {/* Modul-Auswahl nach Datei-Auswahl */}
        <AnimatePresence>
          {pendingBackup && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl p-4 space-y-3 ${isLight ? 'bg-[rgba(30,27,75,0.06)] border border-[rgba(30,27,75,0.12)]' : 'bg-white/6 border border-white/10'}`}
            >
              <p className={`text-xs font-bold ${textPrimary}`}>
                Backup vom {new Date(pendingBackup.exportedAt).toLocaleString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' — '}
                {pendingBackup.data.decks.length} Decks, {pendingBackup.data.cards.length} Karten
              </p>
              <p className={`text-[11px] ${textSecondary}`}>Wie soll das Backup eingespielt werden?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleRestore('replace')}
                  className="flex items-center gap-1.5 flex-1 justify-center bg-red-500/80 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  <RotateCcw size={13} /> Alles ersetzen
                </button>
                <button
                  onClick={() => handleRestore('merge')}
                  className="flex items-center gap-1.5 flex-1 justify-center bg-orbit-purple hover:bg-orbit-indigo text-white font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  <GitMerge size={13} /> Zusammenführen
                </button>
                <button
                  onClick={() => setPendingBackup(null)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isLight ? 'text-[rgba(30,27,75,0.50)]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status-Meldungen */}
        <AnimatePresence>
          {status.type !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2
                ${status.type === 'success' ? 'bg-emerald-500/15 text-emerald-400'
                : status.type === 'error'   ? 'bg-red-500/15 text-red-400'
                :                             `${isLight ? 'bg-[rgba(30,27,75,0.06)] text-[rgba(30,27,75,0.60)]' : 'bg-white/6 text-slate-400'}`}
              `}
            >
              {status.type === 'success' && <CheckCircle size={14} />}
              {status.type === 'error'   && <Activity size={14} />}
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
