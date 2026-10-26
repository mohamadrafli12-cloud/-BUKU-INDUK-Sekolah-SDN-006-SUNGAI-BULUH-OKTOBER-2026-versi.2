import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  User, 
  MapPin, 
  Users, 
  HeartPulse, 
  GraduationCap, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Upload,
  Trash2,
  Copy,
  Sparkles,
  Info,
  Calendar,
  Phone,
  Building2,
  FileText,
  Edit3,
  Settings,
  Plus,
  RotateCcw,
  Clock,
  Camera,
  HandCoins,
  Gift,
  HelpCircle,
  Landmark,
  BadgeCheck
} from 'lucide-react';
import { Student, Gender, Religion, StudentStatus, ParentInfo, GuardianInfo, HealthRecord, JenisBantuan } from '../../types';
import { cn } from '../../lib/utils';
import { useSchool } from '../../context/SchoolContext';
import { ManageClassesModal, defaultClassList } from './ManageClassesModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { compressPasfotoFile } from '../../utils/imageCompressor';
import { safeLocalStorageSet } from '../../utils/storageHelper';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Student>) => void;
  studentToEdit?: Student | null;
  initialData?: Student | null;
  initialTab?: TabType;
}

type TabType = 'pribadi' | 'alamat' | 'ortu' | 'kesehatan' | 'masuk' | 'bantuan';

// Helper function to safely merge existing student data with standard defaults
const getInitialStudentData = (
  studentToEdit?: Student | null,
  studentsCount: number = 0,
  schoolProfile?: { desaKelurahan?: string; kecamatan?: string; kabupatenKota?: string; provinsi?: string; kodePos?: string }
): Partial<Student> => {
  const currentYear = new Date().getFullYear();
  const defaultVillage = schoolProfile?.desaKelurahan || 'Sungai Buluh';
  const defaultDistrict = schoolProfile?.kecamatan || 'Singingi Hilir';
  const defaultRegency = schoolProfile?.kabupatenKota || 'Kabupaten Kuantan Singingi';
  const defaultProvince = schoolProfile?.provinsi || 'Riau';
  const defaultZip = schoolProfile?.kodePos || '29563';

  if (studentToEdit) {
    return {
      ...studentToEdit,
      noInduk: studentToEdit.noInduk || '',
      nisn: studentToEdit.nisn || '',
      nik: studentToEdit.nik || '',
      noKk: studentToEdit.noKk || '',
      namaLengkap: studentToEdit.namaLengkap || '',
      namaPanggilan: studentToEdit.namaPanggilan || '',
      jenisKelamin: studentToEdit.jenisKelamin || 'L',
      tempatLahir: studentToEdit.tempatLahir || defaultVillage,
      tanggalLahir: studentToEdit.tanggalLahir || '2016-01-01',
      agama: studentToEdit.agama || 'Islam',
      kewarganegaraan: studentToEdit.kewarganegaraan || 'Indonesia (WNI)',
      anakKe: studentToEdit.anakKe ?? 1,
      jumlahSaudaraKandung: studentToEdit.jumlahSaudaraKandung ?? 0,
      jumlahSaudaraTiri: studentToEdit.jumlahSaudaraTiri ?? 0,
      jumlahSaudaraAngkat: studentToEdit.jumlahSaudaraAngkat ?? 0,
      statusKeluarga: studentToEdit.statusKeluarga || 'Anak Kandung',
      bahasaIbu: studentToEdit.bahasaIbu || 'Bahasa Indonesia',
      
      // Alamat
      alamat: studentToEdit.alamat || '',
      rt: studentToEdit.rt || '001',
      rw: studentToEdit.rw || '001',
      dusun: studentToEdit.dusun || 'Dusun Suka Maju',
      kelurahanDesa: studentToEdit.kelurahanDesa || defaultVillage,
      kecamatan: studentToEdit.kecamatan || defaultDistrict,
      kabupatenKota: studentToEdit.kabupatenKota || defaultRegency,
      provinsi: studentToEdit.provinsi || defaultProvince,
      kodePos: studentToEdit.kodePos || defaultZip,
      tinggalDengan: studentToEdit.tinggalDengan || 'Orang Tua',
      jarakKeSekolahKm: studentToEdit.jarakKeSekolahKm ?? 1,
      transportasi: studentToEdit.transportasi || 'Jalan Kaki',
      noHpSiswa: studentToEdit.noHpSiswa || '',
      emailSiswa: studentToEdit.emailSiswa || '',
      
      // Kesehatan
      kesehatan: {
        golonganDarah: studentToEdit.kesehatan?.golonganDarah || 'Tidak Tahu',
        penyakitPernahDiderita: studentToEdit.kesehatan?.penyakitPernahDiderita || '-',
        kelainanJasmani: studentToEdit.kesehatan?.kelainanJasmani || '-',
        tinggiBadanCm: studentToEdit.kesehatan?.tinggiBadanCm ?? 120,
        beratBadanKg: studentToEdit.kesehatan?.beratBadanKg ?? 25,
      },
      
      // Ayah
      ayah: {
        nama: studentToEdit.ayah?.nama || '',
        nik: studentToEdit.ayah?.nik || '',
        tempatLahir: studentToEdit.ayah?.tempatLahir || '',
        tanggalLahir: studentToEdit.ayah?.tanggalLahir || '',
        agama: studentToEdit.ayah?.agama || 'Islam',
        kewarganegaraan: studentToEdit.ayah?.kewarganegaraan || 'WNI',
        pendidikan: studentToEdit.ayah?.pendidikan || 'SMA/Sederajat',
        pekerjaan: studentToEdit.ayah?.pekerjaan || 'Petani / Wiraswasta',
        penghasilanBulanan: studentToEdit.ayah?.penghasilanBulanan || 'Rp 2.000.000 - Rp 4.000.000',
        alamat: studentToEdit.ayah?.alamat || '',
        noHp: studentToEdit.ayah?.noHp || '',
        statusHidup: studentToEdit.ayah?.statusHidup || 'Masih Hidup',
      },
      
      // Ibu
      ibu: {
        nama: studentToEdit.ibu?.nama || '',
        nik: studentToEdit.ibu?.nik || '',
        tempatLahir: studentToEdit.ibu?.tempatLahir || '',
        tanggalLahir: studentToEdit.ibu?.tanggalLahir || '',
        agama: studentToEdit.ibu?.agama || 'Islam',
        kewarganegaraan: studentToEdit.ibu?.kewarganegaraan || 'WNI',
        pendidikan: studentToEdit.ibu?.pendidikan || 'SMA/Sederajat',
        pekerjaan: studentToEdit.ibu?.pekerjaan || 'Ibu Rumah Tangga',
        penghasilanBulanan: studentToEdit.ibu?.penghasilanBulanan || 'Kurang dari Rp 1.000.000',
        alamat: studentToEdit.ibu?.alamat || '',
        noHp: studentToEdit.ibu?.noHp || '',
        statusHidup: studentToEdit.ibu?.statusHidup || 'Masih Hidup',
      },
      
      // Wali
      wali: {
        nama: studentToEdit.wali?.nama || '',
        nik: studentToEdit.wali?.nik || '',
        hubungan: studentToEdit.wali?.hubungan || '',
        pendidikan: studentToEdit.wali?.pendidikan || '',
        pekerjaan: studentToEdit.wali?.pekerjaan || '',
        penghasilanBulanan: studentToEdit.wali?.penghasilanBulanan || '',
        alamat: studentToEdit.wali?.alamat || '',
        noHp: studentToEdit.wali?.noHp || '',
      },
      
      // Masuk
      sekolahAsalTK: studentToEdit.sekolahAsalTK !== undefined ? studentToEdit.sekolahAsalTK : '',
      noIjazahTK: studentToEdit.noIjazahTK || '',
      tanggalDiterima: studentToEdit.tanggalDiterima || `${currentYear}-07-15`,
      diterimaDiKelas: (!studentToEdit.diterimaDiKelas || studentToEdit.diterimaDiKelas === '7' || studentToEdit.diterimaDiKelas === '7A' || studentToEdit.diterimaDiKelas === '7B' || studentToEdit.diterimaDiKelas.toLowerCase() === 'kelas 7' || studentToEdit.diterimaDiKelas.toLowerCase() === 'vii')
        ? 'Kelas 1'
        : (studentToEdit.diterimaDiKelas || studentToEdit.kelasSekarang || 'Kelas 1'),
      kelasSekarang: studentToEdit.kelasSekarang || 'Kelas 1',
      status: studentToEdit.status || 'Aktif',
      tahunMasuk: studentToEdit.tahunMasuk || `${currentYear}`,
      fotoUrl: studentToEdit.fotoUrl || '',

      // Penerima Bantuan (No. 6)
      penerimaBantuan: studentToEdit.penerimaBantuan || '',
      jenisBantuanList: studentToEdit.jenisBantuanList || (studentToEdit.penerimaBantuan && studentToEdit.penerimaBantuan !== 'Tidak' ? [studentToEdit.penerimaBantuan] : []),
      bantuanLainnya: studentToEdit.bantuanLainnya || '',
      tahunBantuan: studentToEdit.tahunBantuan || (schoolProfile as any)?.tahunPelajaranAktif || '2026/2027',
      tahapBantuan: studentToEdit.tahapBantuan || 'Tahap 1',
      tanggalMenerimaBantuan: studentToEdit.tanggalMenerimaBantuan || '',
      nominalBantuan: studentToEdit.nominalBantuan || '',
      keteranganBantuan: studentToEdit.keteranganBantuan || '',
      riwayatBantuan: studentToEdit.riwayatBantuan || [],
    };
  }

  // New Student Default
  return {
    noInduk: `${currentYear}${String(studentsCount + 1).padStart(3, '0')}`,
    nisn: `0${Math.floor(100000000 + Math.random() * 900000000)}`,
    nik: '1409050000000000',
    noKk: '1409052000000000',
    namaLengkap: '',
    namaPanggilan: '',
    jenisKelamin: 'L',
    tempatLahir: defaultVillage,
    tanggalLahir: '2018-05-12',
    agama: 'Islam',
    kewarganegaraan: 'Indonesia (WNI)',
    anakKe: 1,
    jumlahSaudaraKandung: 0,
    jumlahSaudaraTiri: 0,
    jumlahSaudaraAngkat: 0,
    statusKeluarga: 'Anak Kandung',
    bahasaIbu: 'Bahasa Indonesia',
    alamat: `Dusun Suka Maju, RT 001/RW 001, Desa ${defaultVillage}`,
    rt: '001',
    rw: '001',
    dusun: 'Dusun Suka Maju',
    kelurahanDesa: defaultVillage,
    kecamatan: defaultDistrict,
    kabupatenKota: defaultRegency,
    provinsi: defaultProvince,
    kodePos: defaultZip,
    tinggalDengan: 'Orang Tua',
    jarakKeSekolahKm: 1,
    transportasi: 'Jalan Kaki',
    noHpSiswa: '',
    emailSiswa: '',
    kesehatan: {
      golonganDarah: 'Tidak Tahu',
      penyakitPernahDiderita: '-',
      kelainanJasmani: '-',
      tinggiBadanCm: 120,
      beratBadanKg: 25,
    },
    ayah: {
      nama: '',
      nik: '1409050000000001',
      tempatLahir: defaultVillage,
      tanggalLahir: '1985-01-01',
      agama: 'Islam',
      kewarganegaraan: 'WNI',
      pendidikan: 'SMA/Sederajat',
      pekerjaan: 'Petani Sawit',
      penghasilanBulanan: 'Rp 2.000.000 - Rp 4.000.000',
      alamat: '',
      noHp: '',
      statusHidup: 'Masih Hidup',
    },
    ibu: {
      nama: '',
      nik: '1409050000000002',
      tempatLahir: defaultVillage,
      tanggalLahir: '1989-01-01',
      agama: 'Islam',
      kewarganegaraan: 'WNI',
      pendidikan: 'SMA/Sederajat',
      pekerjaan: 'Ibu Rumah Tangga',
      penghasilanBulanan: 'Kurang dari Rp 1.000.000',
      alamat: '',
      noHp: '',
      statusHidup: 'Masih Hidup',
    },
    wali: {
      nama: '',
      nik: '',
      hubungan: '',
      pendidikan: '',
      pekerjaan: '',
      penghasilanBulanan: '',
      alamat: '',
      noHp: '',
    },
    sekolahAsalTK: `TK Pertiwi ${defaultVillage}`,
    noIjazahTK: '',
    tanggalDiterima: new Date().toISOString().split('T')[0],
    diterimaDiKelas: 'Kelas 1',
    kelasSekarang: 'Kelas 1',
    status: 'Aktif',
    tahunMasuk: `${currentYear}`,
    fotoUrl: '',

    // Penerima Bantuan (No. 6)
    penerimaBantuan: '',
    jenisBantuanList: [],
    bantuanLainnya: '',
    tahunBantuan: (schoolProfile as any)?.tahunPelajaranAktif || '2026/2027',
    tahapBantuan: 'Tahap 1',
    tanggalMenerimaBantuan: '',
    nominalBantuan: '',
    keteranganBantuan: '',
    riwayatBantuan: [],
  };
};

const DRAFT_KEY_PREFIX = 'buku_induk_draft_student_';
export const MODAL_OPEN_STATE_KEY = 'buku_induk_modal_open_state';

export interface StudentFormDraft {
  formData: Partial<Student>;
  hasWali: boolean;
  activeTab: TabType;
  isManualClass: boolean;
  manualClassInput: string;
  isManualDiterimaClass?: boolean;
  manualDiterimaClassInput?: string;
  savedAt: string;
  studentId?: string;
  isEdit: boolean;
}

// Helper to check if a saved draft contains meaningful data worth restoring
const isMeaningfulDraft = (draftFormData?: Partial<Student>, baseline?: Partial<Student>): boolean => {
  if (!draftFormData) return false;
  if (draftFormData.namaLengkap && draftFormData.namaLengkap.trim() !== '') return true;
  if (draftFormData.nisn && draftFormData.nisn !== baseline?.nisn) return true;
  if (draftFormData.noInduk && draftFormData.noInduk !== baseline?.noInduk) return true;
  if (draftFormData.nik && draftFormData.nik !== baseline?.nik) return true;
  if (draftFormData.noKk && draftFormData.noKk !== baseline?.noKk) return true;
  if (draftFormData.alamat && draftFormData.alamat !== baseline?.alamat) return true;
  if (draftFormData.ayah?.nama && draftFormData.ayah.nama.trim() !== '') return true;
  if (draftFormData.ibu?.nama && draftFormData.ibu.nama.trim() !== '') return true;
  if (draftFormData.wali?.nama && draftFormData.wali.nama.trim() !== '') return true;
  if (draftFormData.fotoUrl && draftFormData.fotoUrl.trim() !== '') return true;
  return JSON.stringify(draftFormData) !== JSON.stringify(baseline);
};

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  studentToEdit,
  initialData,
  initialTab,
}) => {
  const currentStudent = studentToEdit || initialData;
  const { students, schoolProfile, updateSchoolProfile, logActivity } = useSchool();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'pribadi');
  const [formData, setFormData] = useState<Partial<Student>>(() => 
    getInitialStudentData(currentStudent, students.length, schoolProfile)
  );
  const [hasWali, setHasWali] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);
  
  // Auto-save state
  const draftKey = studentToEdit?.id 
    ? `${DRAFT_KEY_PREFIX}edit_${studentToEdit.id}` 
    : `${DRAFT_KEY_PREFIX}new`;
  const [draftRestored, setDraftRestored] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadedRef = useRef<boolean>(false);

  // Manual class edit & manage classes modal states
  const [isManualClass, setIsManualClass] = useState(false);
  const [manualClassInput, setManualClassInput] = useState('');
  const [isManualDiterimaClass, setIsManualDiterimaClass] = useState(false);
  const [manualDiterimaClassInput, setManualDiterimaClassInput] = useState('');
  const [isManageClassesOpen, setIsManageClassesOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state & restore draft whenever studentToEdit, initialData or isOpen changes
  useEffect(() => {
    if (isOpen) {
      const activeObj = studentToEdit || initialData;
      const initialBaseline = getInitialStudentData(activeObj, students.length, schoolProfile);

      let draftLoaded = false;
      try {
        const rawDraft = localStorage.getItem(draftKey);
        if (rawDraft) {
          const parsed: StudentFormDraft = JSON.parse(rawDraft);
          if (parsed && parsed.formData && isMeaningfulDraft(parsed.formData, initialBaseline)) {
            setFormData({
              ...initialBaseline,
              ...parsed.formData,
              ayah: { ...initialBaseline.ayah, ...parsed.formData.ayah },
              ibu: { ...initialBaseline.ibu, ...parsed.formData.ibu },
              wali: { ...initialBaseline.wali, ...parsed.formData.wali },
              kesehatan: { ...initialBaseline.kesehatan, ...parsed.formData.kesehatan },
            });
            setHasWali(parsed.hasWali ?? Boolean(parsed.formData?.wali?.nama && parsed.formData.wali.nama.trim() !== ''));
            setActiveTab(initialTab || parsed.activeTab || 'pribadi');
            setIsManualClass(parsed.isManualClass ?? false);
            setManualClassInput(parsed.manualClassInput || parsed.formData?.kelasSekarang || 'Kelas 1');
            setIsManualDiterimaClass(parsed.isManualDiterimaClass ?? false);
            setManualDiterimaClassInput(parsed.manualDiterimaClassInput || parsed.formData?.diterimaDiKelas || 'Kelas 1');
            setDraftRestored(true);
            draftLoaded = true;

            if (parsed.savedAt) {
              const d = new Date(parsed.savedAt);
              if (!isNaN(d.getTime())) {
                setLastSavedTime(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
              }
            }
          }
        }
      } catch (err) {
        console.error('Gagal memuat draf tersimpan:', err);
      }

      if (!draftLoaded) {
        setFormData(initialBaseline);
        setHasWali(Boolean(activeObj?.wali?.nama && activeObj.wali.nama.trim() !== ''));
        setActiveTab(initialTab || 'pribadi');
        setIsManualClass(false);
        setManualClassInput(initialBaseline.kelasSekarang || 'Kelas 1');
        setIsManualDiterimaClass(false);
        setManualDiterimaClassInput(initialBaseline.diterimaDiKelas || initialBaseline.kelasSekarang || 'Kelas 1');
        setDraftRestored(false);
        setLastSavedTime(null);
      }

      setErrors({});
      setSuccessToast(null);
      setIsManageClassesOpen(false);
      isLoadedRef.current = true;

      // Track modal open state in localStorage so it reopens if browser is refreshed
      try {
        localStorage.setItem(MODAL_OPEN_STATE_KEY, JSON.stringify({
          isOpen: true,
          isEdit: Boolean(studentToEdit),
          studentId: studentToEdit?.id || null,
        }));
      } catch (e) {}
    } else {
      isLoadedRef.current = false;
      setDraftRestored(false);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    }
  }, [studentToEdit, initialData, isOpen, students.length, schoolProfile, draftKey]);

  // Debounced auto-save effect to localStorage whenever form changes
  useEffect(() => {
    if (!isOpen || !isLoadedRef.current) return;

    setIsSavingDraft(true);
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const draft: StudentFormDraft = {
          formData,
          hasWali,
          activeTab,
          isManualClass,
          manualClassInput,
          isManualDiterimaClass,
          manualDiterimaClassInput,
          savedAt: now.toISOString(),
          studentId: studentToEdit?.id,
          isEdit: Boolean(studentToEdit),
        };

        const json = JSON.stringify(draft);
        const success = safeLocalStorageSet(draftKey, json);
        if (!success && draft.formData.fotoUrl?.startsWith('data:')) {
          // If quota reached, save draft without heavy base64 photo
          const leanDraft = {
            ...draft,
            formData: { ...draft.formData, fotoUrl: '' }
          };
          safeLocalStorageSet(draftKey, JSON.stringify(leanDraft));
        }

        safeLocalStorageSet(MODAL_OPEN_STATE_KEY, JSON.stringify({
          isOpen: true,
          isEdit: Boolean(studentToEdit),
          studentId: studentToEdit?.id || null,
        }));
        setLastSavedTime(timeStr);
      } catch (err) {
        console.warn('Auto-save gagal menyimpan:', err);
      } finally {
        setIsSavingDraft(false);
      }
    }, 500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, hasWali, activeTab, isManualClass, manualClassInput, isManualDiterimaClass, manualDiterimaClassInput, isOpen, draftKey, studentToEdit]);

  // Emergency synchronous flush before browser unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isOpen || !isLoadedRef.current) return;
      try {
        const now = new Date();
        const draft: StudentFormDraft = {
          formData,
          hasWali,
          activeTab,
          isManualClass,
          manualClassInput,
          isManualDiterimaClass,
          manualDiterimaClassInput,
          savedAt: now.toISOString(),
          studentId: studentToEdit?.id,
          isEdit: Boolean(studentToEdit),
        };
        safeLocalStorageSet(draftKey, JSON.stringify(draft));
        safeLocalStorageSet(MODAL_OPEN_STATE_KEY, JSON.stringify({
          isOpen: true,
          isEdit: Boolean(studentToEdit),
          studentId: studentToEdit?.id || null,
        }));
      } catch (e) {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, formData, hasWali, activeTab, isManualClass, manualClassInput, draftKey, studentToEdit]);

  // Discard draft and reset to default initial data
  const handleDiscardDraft = () => {
    if (window.confirm('Hapus draf yang tersimpan otomatis dan kembalikan formulir ke kondisi awal?')) {
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {}
      const activeObj = studentToEdit || initialData;
      const initialBaseline = getInitialStudentData(activeObj, students.length, schoolProfile);
      setFormData(initialBaseline);
      setHasWali(Boolean(activeObj?.wali?.nama && activeObj.wali.nama.trim() !== ''));
      setActiveTab('pribadi');
      setErrors({});
      setIsManualClass(false);
      setManualClassInput(initialBaseline.kelasSekarang || 'Kelas 1');
      setDraftRestored(false);
      setLastSavedTime(null);
      setSuccessToast('Draf berhasil dihapus. Formulir diatur ulang ke data awal.');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Safe close handler that preserves draft but removes open modal state
  const handleModalClose = () => {
    try {
      localStorage.removeItem(MODAL_OPEN_STATE_KEY);
    } catch (e) {}
    onClose();
  };

  // Class options from school profile, default list, and current student's class
  const availableClassList = React.useMemo(() => {
    const fromProfile = schoolProfile.daftarKelas && schoolProfile.daftarKelas.length > 0
      ? schoolProfile.daftarKelas
      : defaultClassList;
    const combined = Array.from(new Set([
      ...fromProfile,
      ...(formData.kelasSekarang ? [formData.kelasSekarang] : []),
    ]));
    return combined.length > 0 ? combined : defaultClassList;
  }, [schoolProfile.daftarKelas, formData.kelasSekarang]);

  if (!isOpen) return null;

  // Safe nested state updaters
  const updateField = <K extends keyof Student>(field: K, value: Student[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const updateAyah = (field: keyof ParentInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      ayah: {
        nama: prev.ayah?.nama || '',
        nik: prev.ayah?.nik || '',
        tempatLahir: prev.ayah?.tempatLahir || '',
        tanggalLahir: prev.ayah?.tanggalLahir || '',
        agama: prev.ayah?.agama || 'Islam',
        kewarganegaraan: prev.ayah?.kewarganegaraan || 'WNI',
        pendidikan: prev.ayah?.pendidikan || 'SMA/Sederajat',
        pekerjaan: prev.ayah?.pekerjaan || '',
        penghasilanBulanan: prev.ayah?.penghasilanBulanan || '',
        alamat: prev.ayah?.alamat || '',
        noHp: prev.ayah?.noHp || '',
        statusHidup: prev.ayah?.statusHidup || 'Masih Hidup',
        ...prev.ayah,
        [field]: value,
      }
    }));
    if (errors[`ayah_${field}`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`ayah_${field}`];
        return next;
      });
    }
  };

  const updateIbu = (field: keyof ParentInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      ibu: {
        nama: prev.ibu?.nama || '',
        nik: prev.ibu?.nik || '',
        tempatLahir: prev.ibu?.tempatLahir || '',
        tanggalLahir: prev.ibu?.tanggalLahir || '',
        agama: prev.ibu?.agama || 'Islam',
        kewarganegaraan: prev.ibu?.kewarganegaraan || 'WNI',
        pendidikan: prev.ibu?.pendidikan || 'SMA/Sederajat',
        pekerjaan: prev.ibu?.pekerjaan || '',
        penghasilanBulanan: prev.ibu?.penghasilanBulanan || '',
        alamat: prev.ibu?.alamat || '',
        noHp: prev.ibu?.noHp || '',
        statusHidup: prev.ibu?.statusHidup || 'Masih Hidup',
        ...prev.ibu,
        [field]: value,
      }
    }));
    if (errors[`ibu_${field}`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`ibu_${field}`];
        return next;
      });
    }
  };

  const updateWali = (field: keyof GuardianInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      wali: {
        nama: prev.wali?.nama || '',
        nik: prev.wali?.nik || '',
        hubungan: prev.wali?.hubungan || '',
        pendidikan: prev.wali?.pendidikan || '',
        pekerjaan: prev.wali?.pekerjaan || '',
        penghasilanBulanan: prev.wali?.penghasilanBulanan || '',
        alamat: prev.wali?.alamat || '',
        noHp: prev.wali?.noHp || '',
        ...prev.wali,
        [field]: value,
      }
    }));
  };

  const updateKesehatan = (field: keyof HealthRecord, value: any) => {
    setFormData(prev => ({
      ...prev,
      kesehatan: {
        golonganDarah: prev.kesehatan?.golonganDarah || 'Tidak Tahu',
        penyakitPernahDiderita: prev.kesehatan?.penyakitPernahDiderita || '-',
        kelainanJasmani: prev.kesehatan?.kelainanJasmani || '-',
        tinggiBadanCm: prev.kesehatan?.tinggiBadanCm ?? 120,
        beratBadanKg: prev.kesehatan?.beratBadanKg ?? 25,
        ...prev.kesehatan,
        [field]: value,
      }
    }));
  };

  // Age calculation helper
  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
      years--;
      months += 12;
    }
    return `${years} Tahun ${months} Bulan`;
  };

  // BMI status helper
  const calculateBMI = (heightCm?: number, weightKg?: number) => {
    if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    let category = 'Ideal / Normal';
    let color = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';
    if (bmi < 14) {
      category = 'Kurang / Di Bawah Standar';
      color = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200';
    } else if (bmi > 22) {
      category = 'Kelebihan Berat Badan';
      color = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200';
    }
    return { bmi: bmi.toFixed(1), category, color };
  };

  // Handle local file upload for photo with automatic compression
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, fotoUrl: 'Format berkas harus berupa gambar (JPG, PNG, WEBP)' }));
        return;
      }
      try {
        const compressed = await compressPasfotoFile(file, 480, 640, 0.82);
        updateField('fotoUrl', compressed.dataUrl);
        setErrors(prev => {
          const updated = { ...prev };
          delete updated.fotoUrl;
          return updated;
        });
      } catch (err: any) {
        console.warn('Gagal kompresi pasfoto siswa:', err);
        // Fallback to basic file reader
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          updateField('fotoUrl', base64);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Validate form
  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.noInduk?.trim()) err.noInduk = 'Nomor Induk Siswa (NIS) wajib diisi';
    if (!formData.nisn?.trim()) err.nisn = 'NISN wajib diisi (10 digit)';
    if (!formData.namaLengkap?.trim()) err.namaLengkap = 'Nama lengkap siswa wajib diisi';
    
    // Validate Ayah / Ibu
    if (formData.ayah?.statusHidup === 'Masih Hidup' && !formData.ayah?.nama?.trim()) {
      err.ayah_nama = 'Nama Ayah wajib diisi jika status masih hidup';
    }
    if (formData.ibu?.statusHidup === 'Masih Hidup' && !formData.ibu?.nama?.trim()) {
      err.ibu_nama = 'Nama Ibu wajib diisi jika status masih hidup';
    }

    setErrors(err);

    if (Object.keys(err).length > 0) {
      // Auto-switch to the tab with error
      if (err.noInduk || err.nisn || err.namaLengkap) {
        setActiveTab('pribadi');
      } else if (err.ayah_nama || err.ibu_nama) {
        setActiveTab('ortu');
      }
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalClass = isManualClass && manualClassInput.trim()
      ? manualClassInput.trim()
      : (formData.kelasSekarang || 'Kelas 1');

    let finalDiterimaClass = isManualDiterimaClass && manualDiterimaClassInput.trim()
      ? manualDiterimaClassInput.trim()
      : (formData.diterimaDiKelas || 'Kelas 1');

    if (finalDiterimaClass === '7' || finalDiterimaClass === '7A' || finalDiterimaClass === '7B' || finalDiterimaClass.toLowerCase() === 'kelas 7' || finalDiterimaClass.toLowerCase() === 'vii') {
      finalDiterimaClass = 'Kelas 1';
    }

    // Auto-save new class to schoolProfile if not in list
    if (finalClass && !availableClassList.includes(finalClass)) {
      updateSchoolProfile({
        daftarKelas: [...availableClassList, finalClass],
      });
      logActivity('EDIT', `Mendaftarkan pilihan kelas baru: ${finalClass}`);
    }

    // Clean up wali if not checked
    const submissionData: Partial<Student> = {
      ...formData,
      kelasSekarang: finalClass,
      diterimaDiKelas: finalDiterimaClass,
      wali: hasWali ? formData.wali : undefined,
    };

    // Clear saved draft on successful submit
    try {
      localStorage.removeItem(draftKey);
      localStorage.removeItem(MODAL_OPEN_STATE_KEY);
    } catch (e) {}

    onSave(submissionData);
    onClose();
  };

  const tabs: { id: TabType; label: string; subLabel: string; icon: React.ElementType }[] = [
    { id: 'pribadi', label: '1. Identitas Siswa', subLabel: 'NIS, NIK, Nama, TTL, Agama', icon: User },
    { id: 'alamat', label: '2. Alamat & Domisili', subLabel: 'Tempat Tinggal & Transport', icon: MapPin },
    { id: 'ortu', label: '3. Orang Tua & Wali', subLabel: 'Data Ayah, Ibu, & Wali Murid', icon: Users },
    { id: 'kesehatan', label: '4. Jasmani & Kesehatan', subLabel: 'Gol. Darah, TB/BB, Penyakit', icon: HeartPulse },
    { id: 'masuk', label: '5. Pendidikan & Masuk', subLabel: 'Asal TK, Kelas, Pasfoto 3x4', icon: GraduationCap },
    { id: 'bantuan', label: '6. Penerima Bantuan', subLabel: 'PIP, Baznas, Desa, Sekolah, Lainnya', icon: HandCoins },
  ];

  const studentAge = calculateAge(formData.tanggalLahir);
  const bmiInfo = calculateBMI(formData.kesehatan?.tinggiBadanCm, formData.kesehatan?.beratBadanKg);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl my-auto max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-[#003399] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/20 shrink-0">
              {formData.fotoUrl ? (
                <img src={formData.fotoUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  {studentToEdit ? 'EDIT DATA SISWA' : 'SISWA BARU'}
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  {formData.noInduk ? `NIS: ${formData.noInduk}` : 'Buku Induk'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-wide text-white truncate max-w-md">
                {formData.namaLengkap || (studentToEdit ? 'Edit Data Siswa' : 'Input Data Register Siswa')}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Save Live Status Badge */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-medium text-white shadow-2xs transition-colors"
              title={lastSavedTime ? `Terakhir disimpan otomatis pada pukul ${lastSavedTime}. Data Anda aman tersimpan di draf.` : 'Auto-save aktif melindungi data formulir dari ketidaksengajaan menutup atau refresh.'}
            >
              <span className={cn(
                "w-2 h-2 rounded-full shrink-0 transition-all",
                isSavingDraft 
                  ? "bg-amber-400 animate-ping" 
                  : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              )} />
              <span className="hidden sm:inline">
                {isSavingDraft ? 'Menyimpan draf...' : lastSavedTime ? `Auto-save: ${lastSavedTime}` : 'Auto-save aktif'}
              </span>
              <span className="sm:hidden text-[10px]">
                {isSavingDraft ? 'Menyimpan' : 'Auto-save'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-950" />
              <span>SIMPAN</span>
            </button>
            <button
              onClick={handleModalClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup Formulir"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 overflow-x-auto shrink-0 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasErrorInTab = 
              (tab.id === 'pribadi' && (errors.noInduk || errors.nisn || errors.namaLengkap)) ||
              (tab.id === 'ortu' && (errors.ayah_nama || errors.ibu_nama));

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "border-blue-600 dark:border-amber-400 text-blue-900 dark:text-amber-400 bg-white dark:bg-slate-900 shadow-xs"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0",
                  isActive 
                    ? "bg-blue-100 dark:bg-amber-400/20 text-blue-700 dark:text-amber-300 font-black" 
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                )}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1 leading-tight">
                    <span>{tab.label}</span>
                    {hasErrorInTab && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Form Body Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white dark:bg-slate-900">
          
          {/* Toast Notification */}
          {successToast && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs font-bold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{successToast}</span>
              </div>
              <button type="button" onClick={() => setSuccessToast(null)} className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Draf Restored Alert Banner */}
          {draftRestored && (
            <div className="p-3.5 rounded-xl bg-blue-50/95 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950 dark:text-blue-100 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold flex items-center gap-2">
                    <span>Draf Formulir Otomatis Dipulihkan</span>
                    {lastSavedTime && (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {lastSavedTime}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-blue-800/90 dark:text-blue-300/90 mt-0.5">
                    Data isian siswa sebelumnya telah dimuat kembali secara otomatis sehingga tidak ada data yang hilang saat modal tertutup atau halaman direfresh.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setDraftRestored(false)}
                  className="px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg border border-blue-200 dark:border-slate-700 transition-colors cursor-pointer"
                  title="Tutup pemberitahuan dan lanjutkan pengisian"
                >
                  Lanjutkan
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Hapus draf yang tersimpan dan kembalikan formulir ke data awal"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Buang Draf</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: IDENTITAS SISWA */}
          {activeTab === 'pribadi' && (
            <div className="space-y-4">
              {/* Header Box NIS / NISN / NIK */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-3">
                <div className="text-xs font-black text-blue-950 dark:text-blue-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>NOMOR IDENTITAS RESMI (NIS, NISN, NIK, KK)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      No. Induk / NIS <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.noInduk || ''}
                      onChange={(e) => updateField('noInduk', e.target.value)}
                      className={cn(
                        "w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600",
                        errors.noInduk ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300 dark:border-slate-700"
                      )}
                      placeholder="Misal: 2025001"
                    />
                    {errors.noInduk && <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.noInduk}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NISN (10 Digit) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={formData.nisn || ''}
                      onChange={(e) => updateField('nisn', e.target.value.replace(/\D/g, ''))}
                      className={cn(
                        "w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600",
                        errors.nisn ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300 dark:border-slate-700"
                      )}
                      placeholder="0123456789"
                    />
                    {errors.nisn && <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.nisn}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NIK Siswa (16 Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.nik || ''}
                      onChange={(e) => updateField('nik', e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      placeholder="140905..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      No. Kartu Keluarga (KK)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.noKk || ''}
                      onChange={(e) => updateField('noKk', e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      placeholder="140905..."
                    />
                  </div>
                </div>
              </div>

              {/* Nama Lengkap & Panggilan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Siswa (Standar Akta / Ijazah) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.namaLengkap || ''}
                      onChange={(e) => updateField('namaLengkap', e.target.value.toUpperCase())}
                      className={cn(
                        "w-full px-3 py-2 text-xs font-black rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase focus:ring-2 focus:ring-blue-600",
                        errors.namaLengkap ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300 dark:border-slate-700"
                      )}
                      placeholder="AHMAD FAUZI NUGRAHA"
                    />
                  </div>
                  {errors.namaLengkap && <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.namaLengkap}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    value={formData.namaPanggilan || ''}
                    onChange={(e) => updateField('namaPanggilan', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                    placeholder="Fauzi"
                  />
                </div>
              </div>

              {/* Jenis Kelamin, Tempat Lahir, Tanggal Lahir */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.jenisKelamin || 'L'}
                    onChange={(e) => updateField('jenisKelamin', e.target.value as Gender)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={formData.tempatLahir || ''}
                    onChange={(e) => updateField('tempatLahir', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="Sungai Buluh"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tanggal Lahir
                    </label>
                    {studentAge && (
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                        Usia: {studentAge}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={formData.tanggalLahir || ''}
                    onChange={(e) => updateField('tanggalLahir', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Agama, Kewarganegaraan, Bahasa */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Agama & Kepercayaan
                  </label>
                  <select
                    value={formData.agama || 'Islam'}
                    onChange={(e) => updateField('agama', e.target.value as Religion)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kewarganegaraan
                  </label>
                  <input
                    type="text"
                    value={formData.kewarganegaraan || 'Indonesia (WNI)'}
                    onChange={(e) => updateField('kewarganegaraan', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bahasa Sehari-hari di Rumah
                  </label>
                  <input
                    type="text"
                    value={formData.bahasaIbu || 'Bahasa Indonesia'}
                    onChange={(e) => updateField('bahasaIbu', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Posisi Anak dalam Keluarga */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Keberadaan Siswa Dalam Susunan Keluarga</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Anak Ke-
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.anakKe ?? 1}
                      onChange={(e) => updateField('anakKe', parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Jml Sdr Kandung
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.jumlahSaudaraKandung ?? 0}
                      onChange={(e) => updateField('jumlahSaudaraKandung', parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Jml Sdr Tiri
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.jumlahSaudaraTiri ?? 0}
                      onChange={(e) => updateField('jumlahSaudaraTiri', parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Jml Sdr Angkat
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.jumlahSaudaraAngkat ?? 0}
                      onChange={(e) => updateField('jumlahSaudaraAngkat', parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Status Keluarga
                    </label>
                    <select
                      value={formData.statusKeluarga || 'Anak Kandung'}
                      onChange={(e) => updateField('statusKeluarga', e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="Anak Kandung">Anak Kandung</option>
                      <option value="Anak Tiri">Anak Tiri</option>
                      <option value="Anak Angkat">Anak Angkat</option>
                      <option value="Yatim">Yatim</option>
                      <option value="Piatu">Piatu</option>
                      <option value="Yatim Piatu">Yatim Piatu</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Kontak Siswa Opsional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Telepon / HP Siswa (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.noHpSiswa || ''}
                    onChange={(e) => updateField('noHpSiswa', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    placeholder="0812..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Siswa (Opsional)
                  </label>
                  <input
                    type="email"
                    value={formData.emailSiswa || ''}
                    onChange={(e) => updateField('emailSiswa', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    placeholder="siswa@gmail.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALAMAT & TEMPAT TINGGAL */}
          {activeTab === 'alamat' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap (Nama Jalan, Gang, Nomor Rumah, atau Blok)
                </label>
                <textarea
                  rows={2}
                  value={formData.alamat || ''}
                  onChange={(e) => updateField('alamat', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="Jl. Poros Desa Sungai Buluh No. 12"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">RT</label>
                  <input
                    type="text"
                    value={formData.rt || '001'}
                    onChange={(e) => updateField('rt', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">RW</label>
                  <input
                    type="text"
                    value={formData.rw || '001'}
                    onChange={(e) => updateField('rw', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dusun / Lingkungan</label>
                  <input
                    type="text"
                    value={formData.dusun || ''}
                    onChange={(e) => updateField('dusun', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    placeholder="Dusun Suka Maju"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Desa / Kelurahan</label>
                  <input
                    type="text"
                    value={formData.kelurahanDesa || ''}
                    onChange={(e) => updateField('kelurahanDesa', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={formData.kecamatan || ''}
                    onChange={(e) => updateField('kecamatan', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kabupaten / Kota</label>
                  <input
                    type="text"
                    value={formData.kabupatenKota || ''}
                    onChange={(e) => updateField('kabupatenKota', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formData.provinsi || ''}
                    onChange={(e) => updateField('provinsi', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={formData.kodePos || ''}
                    onChange={(e) => updateField('kodePos', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    placeholder="29563"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tinggal Bersama</label>
                  <select
                    value={formData.tinggalDengan || 'Orang Tua'}
                    onChange={(e) => updateField('tinggalDengan', e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Wali">Wali</option>
                    <option value="Asrama / Pondok">Asrama / Pondok Pesantren</option>
                    <option value="Kost">Kost</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jarak ke Sekolah (KM)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.jarakKeSekolahKm ?? 1}
                    onChange={(e) => updateField('jarakKeSekolahKm', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Transportasi ke Sekolah</label>
                  <select
                    value={formData.transportasi || 'Jalan Kaki'}
                    onChange={(e) => updateField('transportasi', e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="Jalan Kaki">Jalan Kaki</option>
                    <option value="Sepeda">Sepeda</option>
                    <option value="Sepeda Motor">Sepeda Motor</option>
                    <option value="Angkutan Umum">Angkutan Umum</option>
                    <option value="Mobil / Jemputan">Mobil / Jemputan Sekolah</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATA ORANG TUA & WALI */}
          {activeTab === 'ortu' && (
            <div className="space-y-5">
              {/* DATA AYAH KANDUNG */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-blue-900 dark:text-blue-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>A. DATA AYAH KANDUNG</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Status:</label>
                    <select
                      value={formData.ayah?.statusHidup || 'Masih Hidup'}
                      onChange={(e) => updateAyah('statusHidup', e.target.value)}
                      className="px-2 py-0.5 text-xs rounded-md border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-800 font-bold"
                    >
                      <option value="Masih Hidup">Masih Hidup</option>
                      <option value="Meninggal Dunia">Meninggal Dunia</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap Ayah {formData.ayah?.statusHidup === 'Masih Hidup' && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.ayah?.nama || ''}
                      onChange={(e) => updateAyah('nama', e.target.value)}
                      className={cn(
                        "w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold",
                        errors.ayah_nama ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300 dark:border-slate-700"
                      )}
                      placeholder="Nama Lengkap Ayah"
                    />
                    {errors.ayah_nama && <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.ayah_nama}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">NIK Ayah (16 Digit)</label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.ayah?.nik || ''}
                      onChange={(e) => updateAyah('nik', e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      placeholder="140905..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Pendidikan Terakhir</label>
                    <select
                      value={formData.ayah?.pendidikan || 'SMA/Sederajat'}
                      onChange={(e) => updateAyah('pendidikan', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="Tidak Sekolah">Tidak Sekolah</option>
                      <option value="SD/Sederajat">SD / Sederajat</option>
                      <option value="SMP/Sederajat">SMP / Sederajat</option>
                      <option value="SMA/Sederajat">SMA / SMK / Sederajat</option>
                      <option value="D1/D2/D3">D1 / D2 / D3</option>
                      <option value="S1/D4">S1 / D4</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Pekerjaan Utama</label>
                    <input
                      type="text"
                      value={formData.ayah?.pekerjaan || ''}
                      onChange={(e) => updateAyah('pekerjaan', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      placeholder="Petani Sawit / Wiraswasta"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Penghasilan Bulanan</label>
                    <select
                      value={formData.ayah?.penghasilanBulanan || 'Rp 2.000.000 - Rp 4.000.000'}
                      onChange={(e) => updateAyah('penghasilanBulanan', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="Tidak Berpenghasilan">Tidak Berpenghasilan</option>
                      <option value="Kurang dari Rp 1.000.000">Kurang dari Rp 1.000.000</option>
                      <option value="Rp 1.000.000 - Rp 2.000.000">Rp 1.000.000 - Rp 2.000.000</option>
                      <option value="Rp 2.000.000 - Rp 4.000.000">Rp 2.000.000 - Rp 4.000.000</option>
                      <option value="Rp 4.000.000 - Rp 6.000.000">Rp 4.000.000 - Rp 6.000.000</option>
                      <option value="Lebih dari Rp 6.000.000">Lebih dari Rp 6.000.000</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">No. HP / WhatsApp Ayah</label>
                    <input
                      type="text"
                      value={formData.ayah?.noHp || ''}
                      onChange={(e) => updateAyah('noHp', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      placeholder="0812..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Alamat Tempat Tinggal</label>
                      <button
                        type="button"
                        onClick={() => updateAyah('alamat', formData.alamat || '')}
                        className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                      >
                        Salin dari Alamat Siswa
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.ayah?.alamat || ''}
                      onChange={(e) => updateAyah('alamat', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      placeholder="Sama dengan alamat siswa"
                    />
                  </div>
                </div>
              </div>

              {/* DATA IBU KANDUNG */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-rose-900 dark:text-rose-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-rose-600" />
                    <span>B. DATA IBU KANDUNG</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Status:</label>
                    <select
                      value={formData.ibu?.statusHidup || 'Masih Hidup'}
                      onChange={(e) => updateIbu('statusHidup', e.target.value)}
                      className="px-2 py-0.5 text-xs rounded-md border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 font-bold"
                    >
                      <option value="Masih Hidup">Masih Hidup</option>
                      <option value="Meninggal Dunia">Meninggal Dunia</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap Ibu {formData.ibu?.statusHidup === 'Masih Hidup' && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.ibu?.nama || ''}
                      onChange={(e) => updateIbu('nama', e.target.value)}
                      className={cn(
                        "w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold",
                        errors.ibu_nama ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300 dark:border-slate-700"
                      )}
                      placeholder="Nama Lengkap Ibu"
                    />
                    {errors.ibu_nama && <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.ibu_nama}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">NIK Ibu (16 Digit)</label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.ibu?.nik || ''}
                      onChange={(e) => updateIbu('nik', e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      placeholder="140905..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Pendidikan Terakhir</label>
                    <select
                      value={formData.ibu?.pendidikan || 'SMA/Sederajat'}
                      onChange={(e) => updateIbu('pendidikan', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="Tidak Sekolah">Tidak Sekolah</option>
                      <option value="SD/Sederajat">SD / Sederajat</option>
                      <option value="SMP/Sederajat">SMP / Sederajat</option>
                      <option value="SMA/Sederajat">SMA / SMK / Sederajat</option>
                      <option value="D1/D2/D3">D1 / D2 / D3</option>
                      <option value="S1/D4">S1 / D4</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Pekerjaan</label>
                    <input
                      type="text"
                      value={formData.ibu?.pekerjaan || ''}
                      onChange={(e) => updateIbu('pekerjaan', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      placeholder="Ibu Rumah Tangga / Guru"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Penghasilan Bulanan</label>
                    <select
                      value={formData.ibu?.penghasilanBulanan || 'Kurang dari Rp 1.000.000'}
                      onChange={(e) => updateIbu('penghasilanBulanan', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="Tidak Berpenghasilan">Tidak Berpenghasilan</option>
                      <option value="Kurang dari Rp 1.000.000">Kurang dari Rp 1.000.000</option>
                      <option value="Rp 1.000.000 - Rp 2.000.000">Rp 1.000.000 - Rp 2.000.000</option>
                      <option value="Rp 2.000.000 - Rp 4.000.000">Rp 2.000.000 - Rp 4.000.000</option>
                      <option value="Rp 4.000.000 - Rp 6.000.000">Rp 4.000.000 - Rp 6.000.000</option>
                      <option value="Lebih dari Rp 6.000.000">Lebih dari Rp 6.000.000</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">No. HP / WhatsApp Ibu</label>
                    <input
                      type="text"
                      value={formData.ibu?.noHp || ''}
                      onChange={(e) => updateIbu('noHp', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      placeholder="0812..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Alamat Tempat Tinggal</label>
                      <button
                        type="button"
                        onClick={() => updateIbu('alamat', formData.alamat || '')}
                        className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                      >
                        Salin dari Alamat Siswa
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.ibu?.alamat || ''}
                      onChange={(e) => updateIbu('alamat', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      placeholder="Sama dengan alamat siswa"
                    />
                  </div>
                </div>
              </div>

              {/* DATA WALI MURID (OPSIONAL DENGAN TOGGLE) */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-amber-950 dark:text-amber-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>C. DATA WALI MURID (BILA TINGGAL BERSAMA WALI)</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasWali}
                      onChange={(e) => setHasWali(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Ada Data Wali</span>
                  </label>
                </div>

                {hasWali ? (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap Wali</label>
                        <input
                          type="text"
                          value={formData.wali?.nama || ''}
                          onChange={(e) => updateWali('nama', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                          placeholder="Nama Wali Murid"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Hubungan Keluarga</label>
                        <input
                          type="text"
                          value={formData.wali?.hubungan || ''}
                          onChange={(e) => updateWali('hubungan', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          placeholder="Kakek / Paman / Kakak"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">NIK Wali</label>
                        <input
                          type="text"
                          maxLength={16}
                          value={formData.wali?.nik || ''}
                          onChange={(e) => updateWali('nik', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                          placeholder="140905..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Pekerjaan Wali</label>
                        <input
                          type="text"
                          value={formData.wali?.pekerjaan || ''}
                          onChange={(e) => updateWali('pekerjaan', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Penghasilan Wali</label>
                        <input
                          type="text"
                          value={formData.wali?.penghasilanBulanan || ''}
                          onChange={(e) => updateWali('penghasilanBulanan', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          placeholder="Rp 2.000.000 - Rp 4.000.000"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">No. HP / WA Wali</label>
                        <input
                          type="text"
                          value={formData.wali?.noHp || ''}
                          onChange={(e) => updateWali('noHp', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          placeholder="0812..."
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Centang kotak di atas jika siswa diasuh atau tinggal bersama wali murid selain orang tua kandung.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: JASMANI & KESEHATAN */}
          {activeTab === 'kesehatan' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Golongan Darah</label>
                  <select
                    value={formData.kesehatan?.golonganDarah || 'Tidak Tahu'}
                    onChange={(e) => updateKesehatan('golonganDarah', e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="Tidak Tahu">Tidak Tahu / Belum Cek</option>
                    <option value="A">Golongan Darah A</option>
                    <option value="B">Golongan Darah B</option>
                    <option value="AB">Golongan Darah AB</option>
                    <option value="O">Golongan Darah O</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tinggi Badan (CM)</label>
                  <input
                    type="number"
                    min="50"
                    max="220"
                    value={formData.kesehatan?.tinggiBadanCm ?? 120}
                    onChange={(e) => updateKesehatan('tinggiBadanCm', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Berat Badan (KG)</label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={formData.kesehatan?.beratBadanKg ?? 25}
                    onChange={(e) => updateKesehatan('beratBadanKg', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* BMI Indicator Banner */}
              {bmiInfo && (
                <div className={cn("p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold", bmiInfo.color)}>
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 shrink-0" />
                    <span>Indeks Massa Tubuh (IMT / BMI): <strong>{bmiInfo.bmi} kg/m²</strong></span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-slate-900/60 text-[11px] font-black uppercase">
                    Status Gizi: {bmiInfo.category}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Riwayat Penyakit yang Pernah Diderita (TBC / Asma / Tifus / Lainnya)
                </label>
                <input
                  type="text"
                  value={formData.kesehatan?.penyakitPernahDiderita || ''}
                  onChange={(e) => updateKesehatan('penyakitPernahDiderita', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Misal: Asma, Tifus, Tidak Ada"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kelainan Jasmani / Disabilitas / Kebutuhan Khusus (Bila Ada)
                </label>
                <input
                  type="text"
                  value={formData.kesehatan?.kelainanJasmani || ''}
                  onChange={(e) => updateKesehatan('kelainanJasmani', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Tidak ada / Normal"
                />
              </div>
            </div>
          )}

          {/* TAB 5: PENDIDIKAN & PENDAFTARAN */}
          {activeTab === 'masuk' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sekolah Asal (TK / PAUD / RA / Pindahan)
                  </label>
                  <input
                    type="text"
                    value={formData.sekolahAsalTK || ''}
                    onChange={(e) => updateField('sekolahAsalTK', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    placeholder="TK Pertiwi Sungai Buluh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Ijazah / SKTB TK / Asal
                  </label>
                  <input
                    type="text"
                    value={formData.noIjazahTK || ''}
                    onChange={(e) => updateField('noIjazahTK', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    placeholder="TK-1409-2024-..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Diterima Tanggal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Diterima Tanggal
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalDiterima || ''}
                    onChange={(e) => updateField('tanggalDiterima', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Tanggal resmi diterima di sekolah
                  </span>
                </div>

                {/* 2. Diterima di Tingkat Kelas */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Diterima di Tingkat Kelas
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isManualDiterimaClass;
                        setIsManualDiterimaClass(next);
                        if (next) {
                          setManualDiterimaClassInput(formData.diterimaDiKelas || 'Kelas 1');
                        }
                      }}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer flex items-center gap-1 transition-colors"
                      title="Beralih antara pilihan daftar atau isi/edit manual"
                    >
                      {isManualDiterimaClass ? (
                        <span>📋 Pilih dari Daftar</span>
                      ) : (
                        <>
                          <Edit3 className="w-3 h-3" />
                          <span>✏️ Edit / Manual</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isManualDiterimaClass ? (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <div className="relative">
                        <input
                          type="text"
                          autoFocus
                          list="list-saran-diterima-kelas"
                          value={manualDiterimaClassInput}
                          onChange={(e) => {
                            setManualDiterimaClassInput(e.target.value);
                            updateField('diterimaDiKelas', e.target.value);
                          }}
                          placeholder="Contoh: Kelas 1, Kelas 1A, Kelas 2..."
                          className="w-full px-3 py-2 pr-16 text-xs rounded-lg border-2 border-indigo-500 bg-white dark:bg-slate-800 font-bold text-indigo-900 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = manualDiterimaClassInput.trim();
                            if (!val) return;
                            updateField('diterimaDiKelas', val);
                            setIsManualDiterimaClass(false);
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>

                      <datalist id="list-saran-diterima-kelas">
                        {availableClassList.map(cls => (
                          <option key={`dl-${cls}`} value={cls} />
                        ))}
                        <option value="Kelas 1 (Siswa Baru)" />
                        <option value="Kelas 2 (Pindahan)" />
                        <option value="Kelas 3 (Pindahan)" />
                        <option value="Kelas 4 (Pindahan)" />
                        <option value="Kelas 5 (Pindahan)" />
                        <option value="Kelas 6 (Pindahan)" />
                      </datalist>

                      {/* Quick shortcut chips */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[9.5px] font-bold text-slate-400">Pintasan:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const current = formData.kelasSekarang || 'Kelas 1';
                            setManualDiterimaClassInput(current);
                            updateField('diterimaDiKelas', current);
                          }}
                          className="text-[9.5px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded font-semibold cursor-pointer"
                          title="Samakan dengan kelas sekarang"
                        >
                          = Kelas Sekarang
                        </button>
                        {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map(k => (
                          <button
                            key={`btn-k-${k}`}
                            type="button"
                            onClick={() => {
                              setManualDiterimaClassInput(k);
                              updateField('diterimaDiKelas', k);
                            }}
                            className="text-[9.5px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold cursor-pointer"
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <select
                        value={(!formData.diterimaDiKelas || formData.diterimaDiKelas === '7' || formData.diterimaDiKelas === '7A' || formData.diterimaDiKelas === '7B' || formData.diterimaDiKelas.toLowerCase() === 'kelas 7') ? 'Kelas 1' : formData.diterimaDiKelas}
                        onChange={(e) => {
                          if (e.target.value === '__manual__') {
                            setIsManualDiterimaClass(true);
                            setManualDiterimaClassInput(formData.diterimaDiKelas || 'Kelas 1');
                          } else {
                            updateField('diterimaDiKelas', e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <optgroup label="Pilihan Kelas Terdaftar di Sekolah">
                          {availableClassList.map(c => (
                            <option key={`opt-reg-${c}`} value={c}>
                              {c} {c === formData.diterimaDiKelas ? '★' : ''}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Standar Masuk / Pindahan">
                          <option value="Kelas 1">Kelas 1 (Siswa Baru)</option>
                          <option value="Kelas 2 (Pindahan)">Kelas 2 (Pindahan)</option>
                          <option value="Kelas 3 (Pindahan)">Kelas 3 (Pindahan)</option>
                          <option value="Kelas 4 (Pindahan)">Kelas 4 (Pindahan)</option>
                          <option value="Kelas 5 (Pindahan)">Kelas 5 (Pindahan)</option>
                          <option value="Kelas 6 (Pindahan)">Kelas 6 (Pindahan)</option>
                        </optgroup>
                        {formData.diterimaDiKelas && 
                         !availableClassList.includes(formData.diterimaDiKelas) && 
                         !['Kelas 1', 'Kelas 2 (Pindahan)', 'Kelas 3 (Pindahan)', 'Kelas 4 (Pindahan)', 'Kelas 5 (Pindahan)', 'Kelas 6 (Pindahan)'].includes(formData.diterimaDiKelas) && (
                          <optgroup label="Nilai Khusus Saat Ini">
                            <option value={formData.diterimaDiKelas}>
                              {formData.diterimaDiKelas} (Kustom)
                            </option>
                          </optgroup>
                        )}
                        <optgroup label="Opsi Lain">
                          <option value="__manual__" className="text-blue-600 font-bold">
                            ✏️ + Ketik / Edit Nama Kelas Bebas...
                          </option>
                        </optgroup>
                      </select>

                      <div className="flex items-center justify-between text-[10px] px-0.5 text-slate-500">
                        <button
                          type="button"
                          onClick={() => updateField('diterimaDiKelas', formData.kelasSekarang || 'Kelas 1')}
                          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
                          title="Samakan diterima di kelas dengan kelas sekarang"
                        >
                          ↳ Samakan dgn Kelas Sekarang ({formData.kelasSekarang || 'Kelas 1'})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualDiterimaClass(true);
                            setManualDiterimaClassInput(formData.diterimaDiKelas || 'Kelas 1');
                          }}
                          className="text-slate-600 dark:text-slate-400 hover:text-blue-600 font-medium cursor-pointer"
                        >
                          ✏️ Edit Manual
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Kelas Sekarang */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Kelas Sekarang <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isManualClass;
                          setIsManualClass(next);
                          if (next) {
                            setManualClassInput(formData.kelasSekarang || 'Kelas 1');
                          }
                        }}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer flex items-center gap-1 transition-colors"
                        title="Beralih antara pilihan daftar atau isi/edit manual"
                      >
                        {isManualClass ? (
                          <span>📋 Pilih dari Daftar</span>
                        ) : (
                          <>
                            <Edit3 className="w-3 h-3" />
                            <span>✏️ Edit / Manual</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsManageClassesOpen(true)}
                        className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Kelola & Edit Daftar Pilihan Kelas"
                      >
                        <Settings className="w-3 h-3" />
                        <span>Kelola Pilihan</span>
                      </button>
                    </div>
                  </div>

                  {isManualClass ? (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <div className="relative">
                        <input
                          type="text"
                          autoFocus
                          list="list-saran-kelas"
                          value={manualClassInput}
                          onChange={(e) => {
                            setManualClassInput(e.target.value);
                            updateField('kelasSekarang', e.target.value);
                          }}
                          placeholder="Contoh: Kelas 1A, 7B, X-IPA..."
                          className="w-full px-3 py-2 pr-16 text-xs rounded-lg border-2 border-blue-500 bg-white dark:bg-slate-800 font-black text-blue-900 dark:text-amber-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = manualClassInput.trim();
                            if (!val) return;
                            updateField('kelasSekarang', val);
                            if (!availableClassList.includes(val)) {
                              updateSchoolProfile({
                                daftarKelas: [...availableClassList, val],
                              });
                            }
                            setIsManualClass(false);
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>

                      <datalist id="list-saran-kelas">
                        {availableClassList.map(cls => (
                          <option key={cls} value={cls} />
                        ))}
                      </datalist>

                      {/* Quick suggestions chips */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[9.5px] font-bold text-slate-400">Saran:</span>
                        {['Kelas 1', 'Kelas 1A', 'Kelas 1B', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map(sugg => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => {
                              setManualClassInput(sugg);
                              updateField('kelasSekarang', sugg);
                            }}
                            className="text-[9.5px] px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 rounded font-semibold cursor-pointer transition-colors"
                          >
                            +{sugg}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                        <span>Ketik bebas nama kelas / rombel</span>
                        <button
                          type="button"
                          onClick={() => setIsManualClass(false)}
                          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-bold"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <select
                        value={formData.kelasSekarang || 'Kelas 1'}
                        onChange={(e) => {
                          if (e.target.value === '__manual__') {
                            setIsManualClass(true);
                            setManualClassInput(formData.kelasSekarang || 'Kelas 1');
                          } else if (e.target.value === '__manage__') {
                            setIsManageClassesOpen(true);
                          } else {
                            updateField('kelasSekarang', e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-blue-900 dark:text-amber-400 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      >
                        <optgroup label="Pilihan Kelas Terdaftar">
                          {availableClassList.map(c => (
                            <option key={c} value={c}>
                              {c} {c === formData.kelasSekarang ? '★ (Terpilih)' : ''}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Opsi Edit & Kelola Pilihan">
                          <option value="__manual__" className="text-blue-600 font-bold">
                            ✏️ + Ketik / Edit Kelas Bebas...
                          </option>
                          <option value="__manage__" className="text-indigo-600 font-bold">
                            ⚙️ + Kelola & Edit Daftar Pilihan Kelas...
                          </option>
                        </optgroup>
                      </select>

                      <div className="flex items-center justify-between text-[10px] px-0.5 text-slate-500">
                        <span>
                          Pilihan: <strong className="text-slate-800 dark:text-slate-200 font-bold">{formData.kelasSekarang || 'Kelas 1'}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualClass(true);
                              setManualClassInput(formData.kelasSekarang || 'Kelas 1');
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                            title="Edit nama kelas saat ini"
                          >
                            ✏️ Edit
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => setIsManageClassesOpen(true)}
                            className="text-slate-600 dark:text-slate-400 hover:text-blue-600 font-medium cursor-pointer"
                            title="Kelola semua opsi kelas"
                          >
                            Kelola
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Siswa di Buku Induk
                  </label>
                  <select
                    value={formData.status || 'Aktif'}
                    onChange={(e) => updateField('status', e.target.value as StudentStatus)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="Aktif">Aktif (Terdaftar Aktif Belajar)</option>
                    <option value="Lulus">Lulus (Tamat Belajar / Alumni)</option>
                    <option value="Mutasi Keluar">Mutasi Keluar (Pindah Sekolah)</option>
                    <option value="Drop Out">Drop Out (Berhenti Sekolah)</option>
                    <option value="Meninggal">Meninggal Dunia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tahun Masuk (Tahun Pelajaran)
                  </label>
                  <input
                    type="text"
                    value={formData.tahunMasuk || `${new Date().getFullYear()}`}
                    onChange={(e) => updateField('tahunMasuk', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    placeholder="2025"
                  />
                </div>
              </div>

              {/* FOTO PASFOTO SISWA DENGAN UPLOAD FILE & PRESET */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>KELOLA PASFOTO SISWA (UKURAN RESMI 3x4)</span>
                  </div>
                  {formData.fotoUrl && (
                    <button
                      type="button"
                      onClick={() => updateField('fotoUrl', '')}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Photo Preview 3x4 Box */}
                  <div className="w-24 h-32 rounded-xl bg-slate-200 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-xs relative group">
                    {formData.fotoUrl ? (
                      <img
                        src={formData.fotoUrl}
                        alt="Pasfoto Siswa"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <User className="w-8 h-8 mx-auto opacity-50" />
                        <span className="text-[9px] font-bold block mt-1">Foto 3x4</span>
                      </div>
                    )}
                  </div>

                  {/* Actions to change photo */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoFileUpload}
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                        title="Ambil foto pasfoto siswa langsung menggunakan kamera/webcam"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ambil dengan Kamera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih Foto dari Komputer / HP</span>
                      </button>

                      {/* Preset Sample Avatars */}
                      <button
                        type="button"
                        onClick={() => updateField('fotoUrl', formData.jenisKelamin === 'P' 
                          ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=240&auto=format&fit=crop&q=80'
                          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&auto=format&fit=crop&q=80'
                        )}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Gunakan Contoh Pasfoto</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                        Atau Masukkan Tautan URL Gambar:
                      </label>
                      <input
                        type="text"
                        value={formData.fotoUrl || ''}
                        onChange={(e) => updateField('fotoUrl', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: PENERIMA BANTUAN (PIP, BAZNAS, SEKOLAH, DESA, LAINNYA) */}
          {/* ========================================================================= */}
          {activeTab === 'bantuan' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header Box Tab 6 */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <HandCoins className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-blue-950 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span>6. KEPESERTAAN & STATUS PENERIMA BANTUAN</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Pilih dan catat program bantuan yang diterima oleh siswa (PIP, Baznas, Bantuan Sekolah, Bantuan dari Desa, atau Bantuan Lainnya). Data ini disesuaikan dengan Tahun Pelajaran Aktif (<strong className="text-blue-700 dark:text-blue-300">{schoolProfile?.tahunPelajaranAktif || '2026/2027'}</strong>) dan menjadi acuan utama pada menu <strong>Penerima Bantuan</strong> di dashboard samping.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-extrabold bg-blue-100 text-[#003399] dark:bg-blue-950 dark:text-blue-300 rounded-full shrink-0">
                  TP {formData.tahunBantuan || schoolProfile?.tahunPelajaranAktif || '2026/2027'}
                </span>
              </div>

              {/* Status Utama: Apakah Menerima Bantuan? */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Apakah Siswa Ini Menerima Bantuan Pendidikan / Sosial? <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pilihan 1: Bukan Penerima Bantuan */}
                  <label className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                    (!formData.penerimaBantuan || formData.penerimaBantuan === 'Tidak' || formData.penerimaBantuan === 'Bukan Penerima' || (!formData.jenisBantuanList || formData.jenisBantuanList.length === 0))
                      ? "border-slate-400 bg-white dark:bg-slate-800 shadow-xs ring-1 ring-slate-400/30"
                      : "border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-white"
                  )}>
                    <input
                      type="radio"
                      name="statusBantuanRadio"
                      checked={!formData.penerimaBantuan || formData.penerimaBantuan === 'Tidak' || formData.penerimaBantuan === 'Bukan Penerima' || (!formData.jenisBantuanList || formData.jenisBantuanList.length === 0)}
                      onChange={() => {
                        updateField('penerimaBantuan', 'Tidak');
                        updateField('jenisBantuanList', []);
                        updateField('bantuanLainnya', '');
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Bukan Penerima Bantuan
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Siswa tidak menerima bantuan sosial/beasiswa pada tahun pelajaran ini
                      </div>
                    </div>
                  </label>

                  {/* Pilihan 2: Ya, Siswa Penerima Bantuan */}
                  <label className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                    (formData.penerimaBantuan && formData.penerimaBantuan !== 'Tidak' && formData.penerimaBantuan !== 'Bukan Penerima') || (formData.jenisBantuanList && formData.jenisBantuanList.length > 0)
                      ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/30"
                      : "border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-white"
                  )}>
                    <input
                      type="radio"
                      name="statusBantuanRadio"
                      checked={Boolean(
                        (formData.penerimaBantuan && formData.penerimaBantuan !== 'Tidak' && formData.penerimaBantuan !== 'Bukan Penerima') ||
                        (formData.jenisBantuanList && formData.jenisBantuanList.length > 0)
                      )}
                      onChange={() => {
                        const defaultList = formData.jenisBantuanList && formData.jenisBantuanList.length > 0 
                          ? formData.jenisBantuanList 
                          : ['Penerima PIP'];
                        updateField('jenisBantuanList', defaultList);
                        updateField('penerimaBantuan', defaultList.join(', '));
                        if (!formData.tahunBantuan) {
                          updateField('tahunBantuan', schoolProfile?.tahunPelajaranAktif || '2026/2027');
                        }
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-[#003399] dark:text-blue-300 flex items-center gap-1.5">
                        <HandCoins className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ya, Siswa Penerima Bantuan</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Aktif menerima PIP, Baznas, Bantuan Desa, Bantuan Sekolah, atau Lainnya
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Rincian Pilihan Bantuan jika Menerima Bantuan */}
              {((formData.penerimaBantuan && formData.penerimaBantuan !== 'Tidak' && formData.penerimaBantuan !== 'Bukan Penerima') || (formData.jenisBantuanList && formData.jenisBantuanList.length > 0)) && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                        Pilih Program / Sumber Bantuan <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        {formData.jenisBantuanList?.length || 0} program dipilih
                      </span>
                    </div>

                    {/* Cards untuk 5 Pilihan Sesuai Instruksi User */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { 
                          id: 'Penerima PIP', 
                          label: 'Penerima PIP', 
                          sub: 'Program Indonesia Pintar (Kemdikbudristek / Pemegang KIP)', 
                          color: 'text-blue-700 bg-blue-50 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
                          badge: 'PIP Kemdikbud'
                        },
                        { 
                          id: 'Baznas', 
                          label: 'Baznas', 
                          sub: 'Badan Amil Zakat Nasional (Beasiswa & Santunan Pendidikan)', 
                          color: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
                          badge: 'Baznas'
                        },
                        { 
                          id: 'Bantuan Sekolah', 
                          label: 'Bantuan Sekolah', 
                          sub: 'Subsidi internal sekolah / komite / beasiswa keringanan', 
                          color: 'text-indigo-700 bg-indigo-50 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
                          badge: 'Internal Sekolah'
                        },
                        { 
                          id: 'Bantuan dari desa', 
                          label: 'Bantuan dari desa', 
                          sub: 'Bantuan Dana Desa / BLT Desa / Pemerintah Desa Setempat', 
                          color: 'text-orange-700 bg-orange-50 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
                          badge: 'Dana Desa'
                        },
                        { 
                          id: 'Bantuan Lainnya', 
                          label: 'Bantuan Lainnya', 
                          sub: 'Donatur swasta, CSR perusahaan, yayasan (bisa diisi sendiri)', 
                          color: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
                          badge: 'Kustom / Bebas'
                        },
                      ].map((item) => {
                        const isSelected = Boolean(formData.jenisBantuanList?.includes(item.id));
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              const currentList = formData.jenisBantuanList || [];
                              let nextList: string[];
                              if (isSelected) {
                                nextList = currentList.filter(x => x !== item.id);
                              } else {
                                nextList = [...currentList, item.id];
                              }
                              updateField('jenisBantuanList', nextList);
                              updateField('penerimaBantuan', nextList.length > 0 ? nextList.join(', ') : 'Tidak');
                            }}
                            className={cn(
                              "p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none",
                              isSelected 
                                ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 shadow-xs ring-1 ring-blue-500/20" 
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                  {item.label}
                                </span>
                                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", item.color)}>
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {item.sub}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Jika Bantuan Lainnya dipilih: Tampilkan Input Bebas Diisi Sendiri */}
                    {formData.jenisBantuanList?.includes('Bantuan Lainnya') && (
                      <div className="mt-3 p-3.5 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 space-y-1.5 animate-in fade-in duration-150">
                        <label className="block text-xs font-extrabold text-amber-900 dark:text-amber-200">
                          Nama / Jenis Bantuan Lainnya (Bisa Diisi Sendiri) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.bantuanLainnya || ''}
                          onChange={(e) => updateField('bantuanLainnya', e.target.value)}
                          placeholder="Contoh: Beasiswa CSR PT RAPP, Beasiswa Alumni SDN 006, Donatur Yayasan..."
                          className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                        <p className="text-[10.5px] text-amber-800 dark:text-amber-300">
                          Nama bantuan kustom ini akan menjadi rincian resmi pada tabel data dan laporan statistik.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Form Detail Tambahan: Tahun Pelajaran, Tahap, Tanggal Menerima, Nominal, No SK / Keterangan */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 border-b pb-1.5 border-slate-100 dark:border-slate-700">
                      Rincian Penyaluran & Penerimaan Bantuan:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* 1. Tahun Pelajaran */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Tahun Pelajaran Bantuan <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.tahunBantuan || schoolProfile?.tahunPelajaranAktif || '2026/2027'}
                          onChange={(e) => updateField('tahunBantuan', e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold rounded-lg border-2 border-blue-500 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 cursor-pointer"
                        >
                          {(schoolProfile?.daftarTahunPelajaran || ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028']).map(tp => (
                            <option key={tp} value={tp}>
                              TP {tp} {tp === (schoolProfile?.tahunPelajaranAktif || '2026/2027') ? '(Aktif)' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Acuan Tahun Pelajaran dashboard samping
                        </p>
                      </div>

                      {/* 2. Tahap Bantuan */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Tahap Penyaluran <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            list="tahap-bantuan-list"
                            value={formData.tahapBantuan || 'Tahap 1'}
                            onChange={(e) => updateField('tahapBantuan', e.target.value)}
                            placeholder="Contoh: Tahap 1, Tahap 2..."
                            className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          />
                          <datalist id="tahap-bantuan-list">
                            <option value="Tahap 1" />
                            <option value="Tahap 2" />
                            <option value="Tahap 3" />
                            <option value="Tahap 4" />
                            <option value="Gelombang 1" />
                            <option value="Gelombang 2" />
                            <option value="Semester Ganjil" />
                            <option value="Semester Genap" />
                          </datalist>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Tahap 1 / Tahap 2 / Gelombang penyaluran
                        </p>
                      </div>

                      {/* 3. Tanggal Menerima */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Tanggal Menerima
                        </label>
                        <input
                          type="date"
                          value={formData.tanggalMenerimaBantuan || ''}
                          onChange={(e) => updateField('tanggalMenerimaBantuan', e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Tanggal resmi bantuan diterima siswa
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* 4. Nominal */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nominal / Bentuk Bantuan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={formData.nominalBantuan || ''}
                          onChange={(e) => updateField('nominalBantuan', e.target.value)}
                          placeholder="Contoh: Rp 450.000 / tahun"
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Jumlah uang tunai atau bentuk fasilitas
                        </p>
                      </div>

                      {/* 5. Keterangan / No SK */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Keterangan / No. KIP / SK Bantuan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={formData.keteranganBantuan || ''}
                          onChange={(e) => updateField('keteranganBantuan', e.target.value)}
                          placeholder="Contoh: SK Kemenkeu No. 04/2026"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Catatan nomor SK, kartu, atau rekomendasi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Footer Navigation & Save Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleModalClose}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>

              {(draftRestored || lastSavedTime) && (
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="hidden sm:flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                  title="Hapus draf otomatis dan kembalikan formulir ke kondisi awal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Form</span>
                </button>
              )}

              {activeTab !== 'pribadi' && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = tabs.findIndex(t => t.id === activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1].id);
                  }}
                  className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  ← Sebelumnya
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                {lastSavedTime ? `Draf tersimpan otomatis (${lastSavedTime})` : 'Auto-save formulir aktif'}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activeTab !== tabs[tabs.length - 1].id && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = tabs.findIndex(t => t.id === activeTab);
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-xl border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                >
                  Selanjutnya ({tabs[tabs.findIndex(t => t.id === activeTab) + 1]?.label.split('. ')[1]}) →
                </button>
              )}

              {/* SIMPAN PERUBAHAN SELALU ADA DI SEMUA TAB */}
              <button
                type="submit"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all transform active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>{studentToEdit ? 'SIMPAN PERUBAHAN DATA' : 'SIMPAN DATA SISWA BARU'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL KELOLA & EDIT PILIHAN KELAS */}
      {isManageClassesOpen && (
        <ManageClassesModal
          isOpen={isManageClassesOpen}
          onClose={() => setIsManageClassesOpen(false)}
          currentClass={formData.kelasSekarang || 'Kelas 1'}
          onSelectClass={(cls) => {
            updateField('kelasSekarang', cls);
            setManualClassInput(cls);
            setIsManualClass(false);
          }}
        />
      )}

      {/* MODAL AMBIL FOTO DENGAN KAMERA */}
      {isCameraModalOpen && (
        <CameraCaptureModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onCapture={(photoDataUrl) => {
            updateField('fotoUrl', photoDataUrl);
            setErrors((prev) => {
              const updated = { ...prev };
              delete updated.fotoUrl;
              return updated;
            });
          }}
          title="Ambil Pasfoto Siswa"
          studentName={formData.namaLengkap}
        />
      )}
    </div>
  );
};
