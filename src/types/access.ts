export type AccessPointStatus = 'online' | 'maintenance' | 'offline';

export type FrequencyBand =
  | 'Dual-Band (2.4 / 5 GHz)'
  | '5 GHz High-Density'
  | '2.4 GHz Long-Range'
  | '6 GHz Wi-Fi 6E';

export type SecurityProtocol =
  | 'WPA3-Enterprise'
  | 'WPA2-Enterprise'
  | 'WPA2-PSK + MAC Filter';

export interface AccessPoint {
  id: string;
  code: string;
  name: string;
  ssid: string;
  bssid: string;
  ipAddress: string;
  vlanId: number;
  building: string;
  floorRoom: string;
  band: FrequencyBand;
  security: SecurityProtocol;
  maxClients: number;
  status: AccessPointStatus;
  notes: string;
  updatedAt: string;
}

export type PersonRole = 'student' | 'teacher';

export type AccessStatus = 'authorized' | 'pending' | 'suspended';

export type TeacherPrivilegeTier =
  | 'Faculty Priority'
  | 'Lab Administrator'
  | 'Standard Faculty';

export interface CustomDetailField {
  id: string;
  label: string;
  value: string;
}

export interface StudentDetails {
  program: string;
  yearSemester: string;
  sectionBatch: string;
  residenceOrGuardian: string;
}

export interface TeacherDetails {
  designation: string;
  officeRoom: string;
  subjectsTaught: string;
  privilegeTier: TeacherPrivilegeTier;
}

export interface PersonRecord {
  id: string;
  fullName: string;
  role: PersonRole;
  identifier: string;
  department: string;
  email: string;
  phone: string;
  deviceMac: string;
  deviceLabel: string;
  accessStatus: AccessStatus;
  assignedApIds: string[];
  studentDetails: StudentDetails;
  teacherDetails: TeacherDetails;
  customDetails: CustomDetailField[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type AuditCategory = 'access_point' | 'directory' | 'assignment' | 'backup';

export interface AuditEntry {
  id: string;
  timestamp: string;
  category: AuditCategory;
  summary: string;
}

export interface CampusState {
  accessPoints: AccessPoint[];
  people: PersonRecord[];
  auditLog: AuditEntry[];
}
