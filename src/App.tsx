/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signOut, 
  type User 
} from './lib/firebase';
import { 
  subscribeStudents, 
  addStudent, 
  deleteStudent,
  subscribeAttendance,
  saveAttendanceStatus,
  subscribePayments,
  addPayment,
  updatePayment,
  deletePayment,
  getTeacherProfile,
  updateTeacherProfile
} from './lib/academicService';
import type { 
  Student, 
  AttendanceRecord, 
  PaymentRecord, 
  TeacherProfile,
  AttendanceStatus 
} from './types';
import { getTodayDateString } from './utils/helpers';

// Components
import { LoginModal } from './components/LoginModal';
import { Header } from './components/Header';
import { FeesManagerCard } from './components/FeesManagerCard';
import { DailyAttendanceCard } from './components/DailyAttendanceCard';
import { GroupsAndStudentsCard } from './components/GroupsAndStudentsCard';
import { AbsenceAnalysisCard } from './components/AbsenceAnalysisCard';
import { TeacherProfileModal } from './components/TeacherProfileModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [sessionUnlocked, setSessionUnlocked] = useState<boolean>(
    () => sessionStorage.getItem('academic_auth_session') === 'true'
  );

  // Core Data States - Pre-loaded instantly from cache so data never disappears
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const cached = localStorage.getItem('cached_academic_students');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    try {
      const cached = localStorage.getItem('cached_academic_payments');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  
  // Profile state
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>({
    teacherName: 'أستاذ عبد الرازق',
    subject: 'اللغة العربية والتربية الإسلامية',
    centerName: 'أكاديمية النجاح والتفوق',
    whatsappTemplate: 'السلام عليكم ورحمة الله وبركاته، نود إحاطة سيادتكم علماً بأن الطالب/ة {student_name} قد تغيب اليوم {date} عن حصة {group_name}. يرجى المتابعة والاطلاع مع خالص تحياتنا - {teacher_name}.',
    pinCode: 'Emooo@1212',
    callMeBotApiKey: '2155589',
    callMeBotPhone: '201559735253'
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGridView, setIsGridView] = useState(true);

  // Monitor Firebase Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch or initialize profile
        const profile = await getTeacherProfile(user.uid);
        setTeacherProfile(profile);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Determine active teacher ID (either from auth or default master teacher ID)
  const teacherId = currentUser?.uid || 'teacher_abdelrazeq';

  // Real-time Firestore Subscriptions for teacher
  useEffect(() => {
    getTeacherProfile(teacherId).then((profile) => {
      setTeacherProfile(profile);
    });

    const unsubStudents = subscribeStudents(teacherId, (data) => {
      setStudents(data);
    });

    const unsubPayments = subscribePayments(teacherId, (data) => {
      setPayments(data);
    });

    return () => {
      unsubStudents();
      unsubPayments();
    };
  }, [teacherId]);

  // Subscribe to Attendance based on date
  useEffect(() => {
    const unsubAttendance = subscribeAttendance(teacherId, selectedDate, (data) => {
      setAttendanceRecords(data);
    });
    return () => unsubAttendance();
  }, [teacherId, selectedDate]);

  // Handler: Save Payment with optimistic UI update
  const handleSavePayment = async (paymentData: Omit<PaymentRecord, 'id'>) => {
    const tempId = 'pay_' + Date.now();
    const newPayment: PaymentRecord = { id: tempId, ...paymentData };
    setPayments((prev) => [newPayment, ...prev]);

    try {
      const realId = await addPayment(paymentData);
      setPayments((prev) =>
        prev.map((p) => (p.id === tempId ? { ...p, id: realId } : p))
      );
    } catch (err) {
      console.error('Error saving payment:', err);
    }
  };

  // Handler: Toggle Payment Status
  const handleTogglePaymentStatus = async (id: string, newStatus: 'paid' | 'unpaid') => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    await updatePayment(id, { status: newStatus });
  };

  // Handler: Delete Payment
  const handleDeletePayment = async (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    await deletePayment(id);
  };

  // Handler: Save Single Student Attendance with optimistic UI update
  const handleSaveSingleAttendance = async (student: Student, status: AttendanceStatus) => {
    const existingIndex = attendanceRecords.findIndex(
      (r) => r.studentId === student.id && r.date === selectedDate
    );

    if (existingIndex >= 0) {
      setAttendanceRecords((prev) =>
        prev.map((r, i) => (i === existingIndex ? { ...r, status } : r))
      );
    } else {
      const newRec: AttendanceRecord = {
        id: 'att_' + Date.now(),
        date: selectedDate,
        studentId: student.id,
        studentName: student.name,
        parentPhone: student.parentPhone,
        grade: student.grade,
        groupName: student.groupName,
        status,
        teacherId,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setAttendanceRecords((prev) => [newRec, ...prev]);
    }

    await saveAttendanceStatus(teacherId, student, selectedDate, status);
  };

  // Handler: Mark all present for group
  const handleMarkAllPresent = async (groupStudents: Student[]) => {
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setAttendanceRecords((prev) => {
      const updated = [...prev];
      for (const st of groupStudents) {
        const idx = updated.findIndex((r) => r.studentId === st.id && r.date === selectedDate);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], status: 'present' };
        } else {
          updated.push({
            id: 'att_' + Math.random().toString(36).substring(2, 9),
            date: selectedDate,
            studentId: st.id,
            studentName: st.name,
            parentPhone: st.parentPhone,
            grade: st.grade,
            groupName: st.groupName,
            status: 'present',
            teacherId,
            time: nowTime
          });
        }
      }
      return updated;
    });

    for (const student of groupStudents) {
      await saveAttendanceStatus(teacherId, student, selectedDate, 'present');
    }
  };

  // Handler: Add Student with instant optimistic UI update
  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    const tempId = 'student_' + Date.now();
    const newStudent: Student = { id: tempId, ...studentData };
    
    // Add instantly to state so the student appears in the list with ZERO delay
    setStudents((prev) => [newStudent, ...prev]);

    try {
      const realId = await addStudent(studentData);
      setStudents((prev) =>
        prev.map((s) => (s.id === tempId ? { ...s, id: realId } : s))
      );
    } catch (err) {
      console.error('Error adding student:', err);
      // rollback if failed
      setStudents((prev) => prev.filter((s) => s.id !== tempId));
    }
  };

  // Handler: Delete Student
  const handleDeleteStudent = async (id: string, name?: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id && (name ? s.name !== name : true)));
    await deleteStudent(id, name);
  };

  // Handler: Save Profile
  const handleSaveProfile = async (updated: Partial<TeacherProfile>) => {
    await updateTeacherProfile(teacherId, updated);
    setTeacherProfile((prev) => ({ ...prev, ...updated }));
  };

  // Handler: Sign out
  const handleSignOut = async () => {
    sessionStorage.removeItem('academic_auth_session');
    setSessionUnlocked(false);
    await signOut(auth);
  };

  const handleLoginSuccess = () => {
    sessionStorage.setItem('academic_auth_session', 'true');
    setSessionUnlocked(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#333] py-6 px-3 sm:px-6 flex justify-center items-start">
      {/* If not authenticated with password, show Login Overlay modal */}
      {!sessionUnlocked && (
        <LoginModal onSuccess={handleLoginSuccess} />
      )}

      {/* Main Dashboard Container */}
      <div className="w-full max-w-[1380px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 md:p-8 my-auto">
        {/* Header */}
        <Header
          profile={teacherProfile}
          students={students}
          payments={payments}
          attendanceRecords={attendanceRecords}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSignOut={handleSignOut}
          isGridView={isGridView}
          onToggleView={() => setIsGridView(!isGridView)}
        />

        {/* 4 Cards Grid - Matching user's 2x2 grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: تسجيل الشهريات والمذكرات */}
          <FeesManagerCard
            students={students}
            payments={payments}
            teacherId={teacherId}
            onSavePayment={handleSavePayment}
            onToggleStatus={handleTogglePaymentStatus}
            onDeletePayment={handleDeletePayment}
          />

          {/* Card 2: تسجيل الحضور اليومي */}
          <DailyAttendanceCard
            students={students}
            payments={payments}
            attendanceRecords={attendanceRecords}
            selectedDate={selectedDate}
            teacherId={teacherId}
            onDateChange={setSelectedDate}
            onSaveSingleAttendance={handleSaveSingleAttendance}
            onMarkAllPresent={handleMarkAllPresent}
            onAddStudent={handleAddStudent}
          />

          {/* Card 3: تسجيل الطلاب والمجموعات والأيام */}
          <GroupsAndStudentsCard
            students={students}
            teacherId={teacherId}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
          />

          {/* Card 4: تحليل الغياب والتواصل الفوري عبر الواتساب */}
          <AbsenceAnalysisCard
            students={students}
            attendanceRecords={attendanceRecords}
            selectedDate={selectedDate}
            profile={teacherProfile}
          />
        </div>
      </div>

      {/* Profile & Template Settings Modal */}
      <TeacherProfileModal
        profile={teacherProfile}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
