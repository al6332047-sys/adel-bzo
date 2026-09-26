import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from './firebase';
import type {
  Student,
  AttendanceRecord,
  PaymentRecord,
  TeacherProfile,
  WeekDay
} from '../types';

const DEFAULT_PROFILE: TeacherProfile = {
  teacherName: 'أستاذ عبد الرازق',
  subject: 'اللغة العربية والتربية الإسلامية',
  centerName: 'أكاديمية النجاح والتفوق',
  whatsappTemplate: 'السلام عليكم ورحمة الله وبركاته، نود إحاطة سيادتكم علماً بأن الطالب/ة {student_name} قد تغيب اليوم {date} عن حصة {group_name}. يرجى المتابعة والاطلاع مع خالص تحياتنا - {teacher_name}.',
  pinCode: 'Emooo@1212',
  callMeBotApiKey: '2155589',
  callMeBotPhone: '201559735253'
};

export const MASTER_TEACHER_ID = 'teacher_abdelrazeq_master';

// Teacher Profile
export const getTeacherProfile = async (teacherId: string): Promise<TeacherProfile> => {
  try {
    const activeId = teacherId || MASTER_TEACHER_ID;
    const docRef = doc(db, 'teachers', activeId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_PROFILE, ...(snap.data() as TeacherProfile) };
    }
    // initialize if not found
    await setDoc(docRef, DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  } catch (err) {
    console.error('Error fetching teacher profile:', err);
    return DEFAULT_PROFILE;
  }
};

// Helper to completely strip out any undefined values before writing to Firestore
export const stripUndefined = <T extends Record<string, any>>(obj: T): T => {
  const clean: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean as T;
};

export const updateTeacherProfile = async (teacherId: string, profile: Partial<TeacherProfile>): Promise<void> => {
  const activeId = teacherId || MASTER_TEACHER_ID;
  const docRef = doc(db, 'teachers', activeId);
  await setDoc(docRef, stripUndefined(profile), { merge: true });
};

// Students subscriptions and operations - NEVER filters out students!
export const subscribeStudents = (teacherId: string, callback: (students: Student[]) => void) => {
  const coll = collection(db, 'students');
  return onSnapshot(
    coll,
    (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({ ...data, id: d.id } as Student);
      });
      // sort by creation date descending
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      // Backup to localStorage for 100% permanence and instant offline restore
      try {
        localStorage.setItem('cached_academic_students', JSON.stringify(list));
      } catch (e) {
        console.warn('LocalStorage save warning:', e);
      }

      callback(list);
    },
    (err) => {
      console.error('Firestore subscribeStudents error:', err);
      // Fallback to cached students so they never disappear
      try {
        const cached = localStorage.getItem('cached_academic_students');
        if (cached) {
          callback(JSON.parse(cached));
        }
      } catch (e) {}
    }
  );
};

export const addStudent = async (student: Omit<Student, 'id'>): Promise<string> => {
  const finalTeacherId = student.teacherId && student.teacherId !== '' ? student.teacherId : MASTER_TEACHER_ID;
  const cleanData = stripUndefined({
    ...student,
    studentPhone: student.studentPhone || '',
    notes: student.notes || '',
    teacherId: finalTeacherId,
    createdAt: student.createdAt || Date.now()
  });
  const ref = await addDoc(collection(db, 'students'), cleanData);
  return ref.id;
};

export const updateStudent = async (id: string, data: Partial<Student>): Promise<void> => {
  const docRef = doc(db, 'students', id);
  await updateDoc(docRef, stripUndefined(data));
};

export const deleteStudent = async (id: string, name?: string): Promise<void> => {
  try {
    if (id && !id.startsWith('student_') && !id.startsWith('temp_') && !id.startsWith('manual_')) {
      const docRef = doc(db, 'students', id);
      await deleteDoc(docRef);
      return;
    }

    // In case id was a local client-generated id or name match
    const snap = await getDocs(collection(db, 'students'));
    for (const d of snap.docs) {
      if (d.id === id || (name && d.data().name === name)) {
        await deleteDoc(doc(db, 'students', d.id));
      }
    }
  } catch (err) {
    console.error('Error deleting student:', err);
  }
};

// Attendance subscriptions and operations
export const subscribeAttendance = (teacherId: string, date: string, callback: (records: AttendanceRecord[]) => void) => {
  const q = query(
    collection(db, 'attendance'),
    where('date', '==', date)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AttendanceRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({ ...data, id: d.id } as AttendanceRecord);
      });

      try {
        localStorage.setItem(`cached_attendance_${date}`, JSON.stringify(list));
      } catch (e) {}

      callback(list);
    },
    (err) => {
      console.error('Firestore subscribeAttendance error:', err);
      try {
        const cached = localStorage.getItem(`cached_attendance_${date}`);
        if (cached) {
          callback(JSON.parse(cached));
        }
      } catch (e) {}
    }
  );
};

export const saveAttendanceStatus = async (
  teacherId: string,
  student: Student,
  date: string,
  status: AttendanceRecord['status'],
  notes = ''
) => {
  const finalTeacherId = teacherId || MASTER_TEACHER_ID;
  const q = query(
    collection(db, 'attendance'),
    where('date', '==', date),
    where('studentId', '==', student.id)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    const existingDoc = snap.docs[0];
    await updateDoc(doc(db, 'attendance', existingDoc.id), stripUndefined({
      status,
      notes: notes || '',
      groupName: student.groupName || '',
      grade: student.grade || ''
    }));
  } else {
    await addDoc(collection(db, 'attendance'), stripUndefined({
      date,
      studentId: student.id,
      studentName: student.name,
      parentPhone: student.parentPhone || '',
      grade: student.grade || '',
      groupName: student.groupName || '',
      status,
      notes: notes || '',
      teacherId: finalTeacherId,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }));
  }
};

// Payments subscriptions and operations
export const subscribePayments = (teacherId: string, callback: (payments: PaymentRecord[]) => void) => {
  const coll = collection(db, 'payments');
  return onSnapshot(
    coll,
    (snapshot) => {
      const list: PaymentRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({ ...data, id: d.id } as PaymentRecord);
      });
      // sort by date descending
      list.sort((a, b) => (b.date > a.date ? 1 : -1));

      try {
        localStorage.setItem('cached_academic_payments', JSON.stringify(list));
      } catch (e) {}

      callback(list);
    },
    (err) => {
      console.error('Firestore subscribePayments error:', err);
      try {
        const cached = localStorage.getItem('cached_academic_payments');
        if (cached) {
          callback(JSON.parse(cached));
        }
      } catch (e) {}
    }
  );
};

export const addPayment = async (payment: Omit<PaymentRecord, 'id'>): Promise<string> => {
  const finalTeacherId = payment.teacherId && payment.teacherId !== '' ? payment.teacherId : MASTER_TEACHER_ID;
  const ref = await addDoc(collection(db, 'payments'), stripUndefined({
    ...payment,
    parentPhone: payment.parentPhone || '',
    grade: payment.grade || '',
    groupName: payment.groupName || '',
    notes: payment.notes || '',
    teacherId: finalTeacherId
  }));
  return ref.id;
};

export const updatePayment = async (id: string, data: Partial<PaymentRecord>): Promise<void> => {
  const docRef = doc(db, 'payments', id);
  await updateDoc(docRef, stripUndefined(data));
};

export const deletePayment = async (id: string): Promise<void> => {
  const docRef = doc(db, 'payments', id);
  await deleteDoc(docRef);
};
