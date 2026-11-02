export interface BaseRecord {
  id: string;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  updatedBy: string | null;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface Institution extends BaseRecord {
  name: string;
  rooms: number;
  holidays: Holiday[];
  workingDays: number[];
  inviteCode: string;
}

export const MODULE_IDS = ['students', 'attendance', 'timetable', 'grades', 'reports'] as const;
export type ModuleId = (typeof MODULE_IDS)[number];
export type AccessLevel = 'edit' | 'view';
export type SearchScope = 'assigned' | 'institution';

export interface SupervisorPermissions {
  assignedClasses: string[];
  searchScope: SearchScope;
  modules: Record<ModuleId, AccessLevel>;
}

export type UserRole = 'head' | 'supervisor';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User extends BaseRecord {
  name: string;
  usernameKey: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  permissions: SupervisorPermissions | null;
}

export interface SchoolClass extends BaseRecord {
  name: string;
}

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

export const BOARDING_STATUSES = ['half-boarder', 'external'] as const;
export type BoardingStatus = (typeof BOARDING_STATUSES)[number];

export interface StudentInput {
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string | null;
  placeOfBirth: string;
  repeater: boolean;
  boardingStatus: BoardingStatus;
  classId: string;
  joinDate: string | null;
  leaveDate: string | null;
}

export interface Student extends BaseRecord, StudentInput {}

export interface TimetableSlotInput {
  classId: string;
  day: number;
  period: number;
  subject: string;
  teacherId: string | null;
  roomId: string | null;
}

export interface TimetableSlot extends BaseRecord, TimetableSlotInput {}

export interface TeacherAssignment {
  classId: string;
  subject: string;
}

export interface Teacher extends BaseRecord {
  name: string;
  assignments: TeacherAssignment[];
}

export interface Room extends BaseRecord {
  name: string;
}

export interface StudentAbsenceInput {
  classId: string;
  studentId: string;
  date: string;
  period: number;
  subject: string;
  justified: boolean;
}

export interface StudentAbsence extends BaseRecord, StudentAbsenceInput {}

export interface TeacherAbsenceLesson {
  period: number;
  classId: string;
  subject: string;
}

export interface TeacherAbsence extends BaseRecord {
  teacherId: string;
  date: string;
  lessons: TeacherAbsenceLesson[];
}
