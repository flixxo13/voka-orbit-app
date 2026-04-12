import { useGlobalStats, useDetailedCardStats } from '../hooks/useStats';
import { db } from '../core/storage-local';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, BookOpen, CheckCircle, Activity, Info, Database, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export function StatsScreen() {
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
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tighter text-white">
          Lern-Statistik
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Dein Fortschritt im Überblick
        </p>
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
                  <th className="px-4 py-4 min-w-[120px]">Vokabel</th>
                  <th className="px-4 py-4">Deck</th>
                  <th className="px-4 py-4">Intervall</th>
                  <th className="px-4 py-4">Ease</th>
                  <th className="px-4 py-4">Zuletzt</th>
                  <th className="px-4 py-4">Fälligkeit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {detailedStats?.map((card, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-200 break-words max-w-[200px]">{card.front}</td>
                    <td className="px-4 py-4 text-slate-500">{card.deckName}</td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{card.review?.interval.toFixed(1) || '-'} Tage</td>
                    <td className="px-4 py-4 text-slate-500">{card.review?.ease.toFixed(2) || '-'}</td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                      {card.review ? new Date(card.review.reviewedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {card.review ? (
                        <div className="flex flex-col gap-0.5">
                          {card.review.nextDueAt < todayMs ? (
                            <>
                              <span className="text-red-500 font-black flex items-center gap-1 text-[10px] uppercase tracking-tighter">
                                Heute
                                <span className="px-1 bg-red-500/10 rounded border border-red-500/20">Überfällig</span>
                              </span>
                              <span className="text-[9px] text-slate-400 italic">
                                War fällig: {new Date(card.review.nextDueAt).toLocaleDateString()}
                              </span>
                            </>
                          ) : (
                            <span className={card.review.nextDueAt <= Date.now() ? 'text-emerald-500 font-bold' : 'text-slate-500'}>
                              {new Date(card.review.nextDueAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-orbit-purple font-bold italic">Neu</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!detailedStats || detailedStats.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Keine Vokabeln vorhanden.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Developer Debug Info */}
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
