import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCheck, 
  ArrowRight, 
  FileText, 
  GraduationCap, 
  UserMinus, 
  ExternalLink,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  SchoolAlert, 
  AlertCategory, 
  markAlertAsRead, 
  markAllAlertsAsRead 
} from '../../utils/alertNotificationHelper';
import { Student } from '../../types';
import { cn } from '../../lib/utils';
import { ActiveTab } from './Sidebar';

interface NotificationDropdownProps {
  alerts: SchoolAlert[];
  students: Student[];
  onSelectStudentDetail: (studentId: string) => void;
  onMutasi?: (student: Student) => void;
  onSTTB?: (student: Student) => void;
  setActiveTab?: (tab: ActiveTab) => void;
  onRefreshAlerts?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  alerts,
  students,
  onSelectStudentDetail,
  onMutasi,
  onSTTB,
  setActiveTab,
  onRefreshAlerts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | AlertCategory>('all');

  const unreadAlerts = alerts.filter(a => !a.isRead);
  const unreadCount = unreadAlerts.length;
  const urgentCount = alerts.filter(a => a.severity === 'urgent').length;

  const filteredAlerts = alerts.filter(a => {
    if (filterCategory === 'all') return true;
    return a.category === filterCategory;
  });

  const handleAction = (alert: SchoolAlert) => {
    markAlertAsRead(alert.id);
    onRefreshAlerts?.();
    setIsOpen(false);

    const student = students.find(s => s.id === alert.studentId);
    if (!student) {
      onSelectStudentDetail(alert.studentId);
      return;
    }

    if (alert.actionType === 'mutasi') {
      if (onMutasi) {
        onMutasi(student);
      } else if (setActiveTab) {
        setActiveTab('mutasi');
      }
    } else if (alert.actionType === 'sttb') {
      if (onSTTB) {
        onSTTB(student);
      } else if (setActiveTab) {
        setActiveTab('sttb');
      }
    } else {
      onSelectStudentDetail(alert.studentId);
    }
  };

  const handleMarkAllRead = () => {
    markAllAlertsAsRead(alerts.map(a => a.id));
    onRefreshAlerts?.();
  };

  const getSeverityBadge = (severity: SchoolAlert['severity']) => {
    switch (severity) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            DARURAT
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            PERHATIAN
          </span>
        );
      case 'info':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
            <Info className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        id="btn-topbar-notification"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-xl transition-all relative flex items-center justify-center cursor-pointer",
          isOpen
            ? "bg-blue-100 dark:bg-blue-950/80 text-[#003399] dark:text-blue-300 ring-2 ring-blue-500/20"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80"
        )}
        title={unreadCount > 0 ? `${unreadCount} Peringatan Batas Waktu & Mutasi/Ijazah Siswa` : 'Pusat Peringatan & Notifikasi'}
        aria-label="Pusat Peringatan & Notifikasi Otomatis"
      >
        <Bell className="w-4 h-4" />
        
        {/* Unread badge count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-black shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Pulse indicator for urgent alerts */}
        {urgentCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          </span>
        )}
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop click outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="absolute right-0 mt-2 w-80 sm:w-96 md:w-[420px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#003399] dark:text-blue-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Peringatan Batas Waktu & Ijazah
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {alerts.length} siswa memerlukan tindak lanjut pihak sekolah
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Tandai semua alert sebagai sudah dibaca"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tandai Dibaca</span>
                </button>
              )}
            </div>

            {/* Filter Category Pills */}
            <div className="p-2 bg-white dark:bg-slate-900 flex items-center gap-1 overflow-x-auto border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer",
                  filterCategory === 'all'
                    ? "bg-[#003399] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                Semua ({alerts.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('mutasi')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer",
                  filterCategory === 'mutasi'
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                )}
              >
                <UserMinus className="w-3 h-3" />
                <span>Mutasi ({alerts.filter(a => a.category === 'mutasi').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('ijazah')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer",
                  filterCategory === 'ijazah'
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                )}
              >
                <GraduationCap className="w-3 h-3" />
                <span>Ijazah / STTB ({alerts.filter(a => a.category === 'ijazah').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('dapodik')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer",
                  filterCategory === 'dapodik'
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                )}
              >
                <FileText className="w-3 h-3" />
                <span>Prasyarat ({alerts.filter(a => a.category === 'dapodik').length})</span>
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tidak ada peringatan aktif
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Seluruh proses mutasi dan arsip blangko ijazah telah terdokumentasi dengan baik sesuai standar.
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors space-y-2",
                      !alert.isRead && "bg-blue-50/40 dark:bg-blue-950/20"
                    )}
                  >
                    {/* Top Row: Severity & Deadline pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                          {alert.kelas}
                        </span>
                      </div>
                      {alert.dueDateOrDaysAgo && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          <Clock className="w-2.5 h-2.5" />
                          {alert.dueDateOrDaysAgo}
                        </span>
                      )}
                    </div>

                    {/* Student & Problem */}
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {alert.studentName}
                        <span className="text-[10px] font-normal text-slate-500 ml-1.5">
                          (NIS: {alert.nis || '-'})
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                        {alert.title}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                        {alert.message}
                      </p>
                    </div>

                    {/* Recommendation snippet */}
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[10px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <span>{alert.recommendation}</span>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          markAlertAsRead(alert.id);
                          onRefreshAlerts?.();
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {alert.isRead ? 'Tersimpan' : 'Tandai Dibaca'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction(alert)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs",
                          alert.category === 'mutasi'
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : alert.category === 'ijazah'
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-[#003399] hover:bg-[#002266] text-white"
                        )}
                      >
                        <span>
                          {alert.actionType === 'mutasi'
                            ? 'Tindak Lanjuti Mutasi'
                            : alert.actionType === 'sttb'
                            ? 'Lengkapi Ijazah'
                            : 'Lihat Siswa'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {setActiveTab && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setIsOpen(false);
                  }}
                  className="text-xs font-bold text-[#003399] dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka Pusat Peringatan Lengkap di Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
