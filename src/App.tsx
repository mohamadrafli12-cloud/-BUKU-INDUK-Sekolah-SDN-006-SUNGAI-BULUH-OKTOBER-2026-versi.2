import React, { useState, useEffect, useRef } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';

// Views
import { DashboardView } from './components/views/DashboardView';
import { ActiveStudentsView } from './components/views/ActiveStudentsView';
import { StudentListView } from './components/views/StudentListView';
import { DataGuruView } from './components/views/DataGuruView';
import { LaporanView } from './components/views/LaporanView';
import { PrintBukuIndukView } from './components/views/PrintBukuIndukView';
import { KartuPelajarView } from './components/views/KartuPelajarView';
import { RaportView } from './components/views/RaportView';
import { MutasiView } from './components/views/MutasiView';
import { STTBView } from './components/views/STTBView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SchoolProfileView } from './components/views/SchoolProfileView';
import { AdminSettingsView } from './components/views/AdminSettingsView';
import { PublicVerifyView } from './components/views/PublicVerifyView';
import { LoginView } from './components/views/LoginView';
import { PenerimaBantuanView } from './components/views/PenerimaBantuanView';


// Modals
import { StudentFormModal } from './components/modals/StudentFormModal';
import { StudentDetailModal } from './components/modals/StudentDetailModal';
import { MutationModal } from './components/modals/MutationModal';
import { STTBModal } from './components/modals/STTBModal';
import { RaportInputModal } from './components/modals/RaportInputModal';
import { ActivityLogModal } from './components/modals/ActivityLogModal';
import { RestoreDatabaseModal } from './components/modals/RestoreDatabaseModal';
import { GoogleDriveBackupModal } from './components/modals/GoogleDriveBackupModal';

import { Student, MutationRecord, GraduationSTTB, SemesterReport } from './types';

const MainAppContent: React.FC = () => {
  const { 
    students, 
    addStudent, 
    updateStudent, 
    processMutation, 
    updateSTTB, 
    addOrUpdateRaport,
    isAuthenticated
  } = useSchool();

  // Navigation state - automatically switch to public-verify if URL parameters or hash contain verification
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const verifyParam = urlParams.get('verify') || urlParams.get('nisn') || urlParams.get('id');
      const hash = window.location.hash || '';
      if (tabParam === 'public-verify' || verifyParam || hash.startsWith('#verify-')) {
        return 'public-verify';
      }
    }
    return 'dashboard';
  });

  // Listen for URL changes (e.g. scanning QR code or navigation with search/hash)
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const verifyParam = urlParams.get('verify') || urlParams.get('nisn') || urlParams.get('id');
      const hash = window.location.hash || '';
      if (tabParam === 'public-verify' || verifyParam || hash.startsWith('#verify-')) {
        setActiveTab('public-verify');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('buku_induk_sidebar_open');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const handleToggleSidebar = (open?: boolean) => {
    setIsSidebarOpen(prev => {
      const next = open !== undefined ? open : !prev;
      try {
        localStorage.setItem('buku_induk_sidebar_open', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Selected student for detail/print views
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentFormInitialTab, setStudentFormInitialTab] = useState<'pribadi' | 'alamat' | 'ortu' | 'kesehatan' | 'masuk' | 'bantuan'>('pribadi');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [studentForDetail, setStudentForDetail] = useState<Student | null>(null);

  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [studentForMutation, setStudentForMutation] = useState<Student | null>(null);

  const [isSTTBModalOpen, setIsSTTBModalOpen] = useState(false);
  const [studentForSTTB, setStudentForSTTB] = useState<Student | null>(null);

  const [isRaportModalOpen, setIsRaportModalOpen] = useState(false);
  const [studentForRaport, setStudentForRaport] = useState<Student | null>(null);

  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);

  // Auto-restore student form modal if browser was refreshed while filling
  const hasCheckedAutoRestoreRef = useRef(false);
  useEffect(() => {
    if (hasCheckedAutoRestoreRef.current) return;
    try {
      const savedModalState = localStorage.getItem('buku_induk_modal_open_state');
      if (savedModalState) {
        const parsed = JSON.parse(savedModalState);
        if (parsed?.isOpen) {
          hasCheckedAutoRestoreRef.current = true;
          if (parsed.isEdit && parsed.studentId) {
            const target = students.find(s => s.id === parsed.studentId);
            if (target) {
              setStudentToEdit(target);
              setIsAddEditModalOpen(true);
            }
          } else if (!parsed.isEdit) {
            setStudentToEdit(null);
            setIsAddEditModalOpen(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to restore modal open state:', err);
    }
  }, [students]);

  // Handlers
  const handleOpenAddModal = () => {
    setStudentToEdit(null);
    setStudentFormInitialTab('pribadi');
    setIsAddEditModalOpen(true);
  };

  const handleCloseAddEditModal = () => {
    setIsAddEditModalOpen(false);
    try {
      localStorage.removeItem('buku_induk_modal_open_state');
    } catch (e) {}
  };

  const handleOpenEditModal = (student: Student, initialTab: 'pribadi' | 'alamat' | 'ortu' | 'kesehatan' | 'masuk' | 'bantuan' = 'pribadi') => {
    // Cari data siswa resmi dari Buku Induk (students) agar perubahan status dan rombel sinkron di kedua menu
    const canonicalStudent = students.find(s => s.id === student.id) || student;
    setStudentToEdit(canonicalStudent);
    setStudentFormInitialTab(initialTab);
    setIsAddEditModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleSelectStudentDetail = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setStudentForDetail(student);
      setSelectedStudentId(studentId);
      setIsDetailModalOpen(true);
    }
  };

  const handleDirectPrintBukuInduk = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('print-buku-induk');
    setIsDetailModalOpen(false);
  };

  const handleDirectPrintKartuPelajar = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('kartu-pelajar');
    setIsDetailModalOpen(false);
  };

  const handleOpenMutation = (student: Student) => {
    setStudentForMutation(student);
    setIsMutationModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleOpenSTTB = (student: Student) => {
    setStudentForSTTB(student);
    setIsSTTBModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleOpenRaport = (student: Student) => {
    setStudentForRaport(student);
    setIsRaportModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleSaveStudent = (data: Partial<Student>) => {
    if (studentToEdit) {
      updateStudent(studentToEdit.id, data);
      if (studentForDetail && studentForDetail.id === studentToEdit.id) {
        setStudentForDetail(prev => prev ? ({ ...prev, ...data } as Student) : null);
      }
    } else {
      addStudent(data as Omit<Student, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  const handleSaveMutation = (studentId: string, mutation: MutationRecord) => {
    processMutation(studentId, mutation);
  };

  const handleSaveSTTB = (studentId: string, sttb: GraduationSTTB) => {
    updateSTTB(studentId, sttb);
  };

  const handleSaveRaport = (studentId: string, report: SemesterReport) => {
    addOrUpdateRaport(studentId, report);
  };

  if (!isAuthenticated) {
    return <LoginView onSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 print:h-auto print:overflow-visible print:bg-white print:block">
      {/* Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isOpen={isSidebarOpen}
        setIsOpen={handleToggleSidebar}
        onClose={() => handleToggleSidebar(false)}
        onOpenRestoreDatabase={() => setIsRestoreModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 ease-in-out print:overflow-visible print:block print:h-auto">
        {/* Topbar */}
        <Topbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => handleToggleSidebar()}
          onOpenSidebar={() => handleToggleSidebar()}
          onOpenActivityLogs={() => setIsActivityLogModalOpen(true)}
          setActiveTab={setActiveTab}
          onSelectStudentDetail={handleSelectStudentDetail}
          onOpenRestoreDatabase={() => setIsRestoreModalOpen(true)}
          onMutasi={handleOpenMutation}
          onSTTB={handleOpenSTTB}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 transition-all duration-300 ease-in-out print:overflow-visible print:p-0 print:m-0 print:block">
          <div className="w-full max-w-7xl mx-auto transition-all duration-300 ease-in-out print:max-w-none print:w-full print:m-0 print:p-0">
            {activeTab === 'dashboard' && (
              <DashboardView
                setActiveTab={setActiveTab}
                onOpenAddModal={handleOpenAddModal}
                onSelectStudentDetail={handleSelectStudentDetail}
                onMutasi={handleOpenMutation}
                onSTTB={handleOpenSTTB}
              />
            )}

            {activeTab === 'active-students' && (
              <ActiveStudentsView
                onOpenAddModal={handleOpenAddModal}
                onEditStudent={handleOpenEditModal}
                onSelectDetail={handleSelectStudentDetail}
                onPrintBukuInduk={handleDirectPrintBukuInduk}
                onPrintKartuPelajar={handleDirectPrintKartuPelajar}
                onMutasi={handleOpenMutation}
                onSTTB={handleOpenSTTB}
                onRaport={handleOpenRaport}
                setActiveTab={setActiveTab}
                onBack={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'students' && (
              <StudentListView
                onOpenAddModal={handleOpenAddModal}
                onEditStudent={handleOpenEditModal}
                onSelectDetail={handleSelectStudentDetail}
                onPrintBukuInduk={handleDirectPrintBukuInduk}
                onPrintKartuPelajar={handleDirectPrintKartuPelajar}
                onMutasi={handleOpenMutation}
                onSTTB={handleOpenSTTB}
                onRaport={handleOpenRaport}
                setActiveTab={setActiveTab}
                onBack={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'penerima-bantuan' && (
              <PenerimaBantuanView
                onEditStudent={handleOpenEditModal}
                onSelectDetail={handleSelectStudentDetail}
                onBack={() => setActiveTab('dashboard')}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'teachers' && (
              <DataGuruView
                onBack={() => setActiveTab('dashboard')}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'reports' && (
              <LaporanView
                setActiveTab={setActiveTab}
                onOpenActivityLogs={() => setIsActivityLogModalOpen(true)}
                onBack={() => setActiveTab('dashboard')}
                onOpenRestoreDatabase={() => setIsRestoreModalOpen(true)}
                onOpenGoogleDriveBackup={() => setIsGoogleDriveModalOpen(true)}
              />
            )}

            {(activeTab === 'print-buku-induk' || activeTab === 'print-blank-buku-induk') && (
              <PrintBukuIndukView
                selectedStudentId={selectedStudentId}
                onBack={() => setActiveTab('reports')}
              />
            )}

            {activeTab === 'kartu-pelajar' && (
              <KartuPelajarView
                selectedStudentId={selectedStudentId}
                onBack={() => setActiveTab('reports')}
                setActiveTab={setActiveTab}
                onSelectStudentDetail={handleSelectStudentDetail}
              />
            )}

            {activeTab === 'raport' && (
              <RaportView
                onOpenRaportModal={handleOpenRaport}
                onSelectStudentDetail={handleSelectStudentDetail}
                onBack={() => setActiveTab('reports')}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'mutasi' && (
              <MutasiView
                onOpenMutationModal={handleOpenMutation}
                onSelectStudentDetail={handleSelectStudentDetail}
                onBack={() => setActiveTab('reports')}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'sttb' && (
              <STTBView
                onOpenSTTBModal={handleOpenSTTB}
                onSelectStudentDetail={handleSelectStudentDetail}
                onBack={() => setActiveTab('reports')}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'public-verify' && (
              <PublicVerifyView
                onBack={() => setActiveTab('dashboard')}
                onSelectStudentDetail={handleSelectStudentDetail}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView 
                onBack={() => setActiveTab('dashboard')}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'school-profile' && (
              <SchoolProfileView 
                onBack={() => setActiveTab('dashboard')}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'admin-settings' && (
              <AdminSettingsView
                setActiveTab={setActiveTab}
                onBack={() => setActiveTab('dashboard')}
                onOpenActivityLogs={() => setIsActivityLogModalOpen(true)}
                onOpenRestoreDatabase={() => setIsRestoreModalOpen(true)}
                onOpenGoogleDriveBackup={() => setIsGoogleDriveModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      <StudentFormModal
        isOpen={isAddEditModalOpen}
        onClose={handleCloseAddEditModal}
        onSave={handleSaveStudent}
        studentToEdit={studentToEdit}
        initialData={studentToEdit}
        initialTab={studentFormInitialTab}
      />

      <StudentDetailModal
        key={isDetailModalOpen ? (studentForDetail?.id || 'open') : 'closed'}
        student={studentForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setStudentForDetail(null);
        }}
        onEdit={handleOpenEditModal}
        onPrintBukuInduk={handleDirectPrintBukuInduk}
        onPrintKartuPelajar={handleDirectPrintKartuPelajar}
        onMutasi={handleOpenMutation}
        onSTTB={handleOpenSTTB}
        onRaport={handleOpenRaport}
        onNavigateStudent={(nextStudent) => {
          setStudentForDetail(nextStudent);
          setSelectedStudentId(nextStudent.id);
        }}
      />

      <MutationModal
        student={studentForMutation}
        isOpen={isMutationModalOpen}
        onClose={() => setIsMutationModalOpen(false)}
        onSave={handleSaveMutation}
      />

      <STTBModal
        student={studentForSTTB}
        isOpen={isSTTBModalOpen}
        onClose={() => setIsSTTBModalOpen(false)}
        onSave={handleSaveSTTB}
      />

      <RaportInputModal
        student={studentForRaport}
        isOpen={isRaportModalOpen}
        onClose={() => setIsRaportModalOpen(false)}
        onSave={handleSaveRaport}
      />

      <ActivityLogModal
        isOpen={isActivityLogModalOpen}
        onClose={() => setIsActivityLogModalOpen(false)}
      />

      <RestoreDatabaseModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
      />

      <GoogleDriveBackupModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <SchoolProvider>
      <MainAppContent />
    </SchoolProvider>
  );
}

export default App;
