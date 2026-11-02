import Dexie, { type Table } from 'dexie';
import type {
  Institution,
  Room,
  SchoolClass,
  Student,
  StudentAbsence,
  Teacher,
  TeacherAbsence,
  TimetableSlot,
  User,
} from './types';

export interface OutboxEntry {
  id: string;
  institutionId: string;
  tableName: string;
  recordId: string;
  updatedAt: string;
  payload: string;
  retries: number;
  createdAt: string;
}

class SchoolDatabase extends Dexie {
  institutions!: Table<Institution, string>;
  users!: Table<User, string>;
  classes!: Table<SchoolClass, string>;
  students!: Table<Student, string>;
  timetableSlots!: Table<TimetableSlot, string>;
  teachers!: Table<Teacher, string>;
  rooms!: Table<Room, string>;
  studentAbsences!: Table<StudentAbsence, string>;
  teacherAbsences!: Table<TeacherAbsence, string>;
  outbox!: Table<OutboxEntry, string>;

  constructor() {
    super('school-admin');
    this.version(1).stores({
      institutions: 'id, inviteCode',
      users: 'id, institutionId, usernameKey, status',
    });
    this.version(2).stores({
      classes: 'id, institutionId',
      students: 'id, institutionId, classId',
    });
    this.version(3).stores({
      timetableSlots: 'id, institutionId, classId',
      teachers: 'id, institutionId',
      rooms: 'id, institutionId',
    });
    this.version(4).stores({
      studentAbsences: 'id, institutionId, classId',
      teacherAbsences: 'id, institutionId, teacherId',
    });
    this.version(5).stores({
      outbox: 'id, institutionId, tableName, updatedAt',
    });
  }
}

export const db = new SchoolDatabase();
