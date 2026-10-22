import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  UserMinus, 
  GraduationCap, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Sparkles,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { SchoolAlert, AlertCategory } from '../../utils/alertNotificationHelper';
import { Student } from '../../types';
import { cn } from '../../lib/utils';
import { ActiveTab } from '../layout/Sidebar';

interface DashboardAlertBannerProps {
  alerts: SchoolAlert[];
  students: Student[];
  onSelectStudentDetail: (studentId: string) => void;
  onMutasi?: (student: Student) => void;
  onSTTB?: (student: Student) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardAlertBanner: React.FC<DashboardAlertBannerProps> = ({
  alerts,
  students,
  onSelectStudentDetail,
  onMutasi,
  onSTTB,
  setActiveTab,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'mutasi' | 'ijazah'>('all');

  if (alerts.length === 0) {
    return null;
  }

  const urgentCount = alerts.filter(a => a.severity === 'urgent').length;
  const mutasiCount = alerts.filter(a => a.category === 'mutasi').length;
  const ijazahCount = alerts.filter(a => a.category === 'ijazah').length;

  const filteredAlerts = alerts.filter(a => {
    if (activeFilter === 'urgent') return a.severity === 'urgent';
    if (activeFilter === 'mutasi') return a.category === 'mutasi';
    if (activeFilter === 'ijazah') return a.category === 'ijazah';
    return true;
  });

  const handleAction = (alert: SchoolAlert) => {
    const student = students.find(s => s.id === alert.studentId);
    if (!student) {
      onSelectStudentDetail(alert.studentId);
      return;
    }

    if (alert.actionType === 'mutasi') {
      if (onMutasi) {
        onMutasi(student);
      } else {
        setActiveTab('mutasi');
      }
    } else if (alert.actionType === 'sttb') {
      if (onSTTB) {
        onSTTB(student);
      } else {
        setActiveTab('sttb');
      }
    } else {
      onSelectStudentDetail(alert.studentId);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700/70 shadow-md overflow-hidden transition-all animate-in fade-in duration-200">
      {/* Banner Top Header */}
      <div className="p-4 md:p-5 bg-linear-to-r from-amber-50 via-orange-50/50 to-amber-50 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/30 border-b border-amber-200 dark:border-amber-800/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                Peringatan Operasional
              </span>
              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Pusat Tindak Lanjut Batas Waktu Mutasi & Masa Berlaku Ijazah
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Terdapat <strong>{alerts.length} siswa</strong> yang memerlukan verifikasi administrasi segera (batas 30 hari konfirmasi mutasi Dapodik, pengambilan fisik ijazah, atau blangko STTB).
            </p>
          </div>
        </div>

        {/* Header Right Action & Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>{isExpanded ? 'Ciutkan' : 'Buka Detail Alert'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 md:p-5 space-y-4">
          {/* Quick Metrics Bar & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0",
                  activeFilter === 'all'
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                Semua ({alerts.length})
              </button>
              {urgentCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('urgent')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1",
                    activeFilter === 'urgent'
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  )}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Mendesak ({urgentCount})</span>
                </button>
              )}
              {mutasiCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('mutasi')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1",
                    activeFilter === 'mutasi'
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                  )}
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Batas Mutasi ({mutasiCount})</span>
                </button>
              )}
              {ijazahCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('ijazah')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1",
                    activeFilter === 'ijazah'
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  )}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Ijazah / STTB ({ijazahCount})</span>
                </button>
              )}
            </div>

            {/* Quick Summary Chips */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              <span className="hidden md:inline">Prioritas Penanganan:</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                {urgentCount} Kasus Kritis
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                {alerts.length - urgentCount} Perhatian
              </span>
            </div>
          </div>

          {/* Alert Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredAlerts.map((alert) => {
              const isUrgent = alert.severity === 'urgent';
              const isMutasi = alert.category === 'mutasi';
              const isIjazah = alert.category === 'ijazah';

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3",
                    isUrgent
                      ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60"
                      : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                  )}
                >
                  <div className="space-y-2">
                    {/* Header: Severity Badge, Student Name, Class */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isUrgent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white shadow-xs">
                            <AlertCircle className="w-3 h-3" />
                            DARURAT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-slate-950 shadow-xs">
                            <AlertTriangle className="w-3 h-3" />
                            PERHATIAN
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                          {alert.kelas}
                        </span>

                        {alert.dueDateOrDaysAgo && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                            <Clock className="w-2.5 h-2.5" />
                            {alert.dueDateOrDaysAgo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Student Identity & Title */}
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span>{alert.studentName}</span>
                        <span className="text-[11px] font-mono text-slate-500">NIS: {alert.nis || '-'}</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>

                    {/* Recommendation box */}
                    <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Rekomendasi:</strong> {alert.recommendation}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectStudentDetail(alert.studentId)}
                      className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Lihat Profil Siswa</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction(alert)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-105",
                        isMutasi
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : isIjazah
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-blue-700 hover:bg-blue-800 text-white"
                      )}
                    >
                      <span>
                        {alert.actionType === 'mutasi'
                          ? 'Tindak Lanjuti Mutasi'
                          : alert.actionType === 'sttb'
                          ? 'Lengkapi Ijazah / STTB'
                          : 'Buka Form Siswa'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
