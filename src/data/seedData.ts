import { CampusState, PersonRecord } from '../types/access';

export const STORAGE_KEY = 'campusgate_ap_manager_v1';

export const INITIAL_CAMPUS_STATE: CampusState = {
  accessPoints: [
    {
      id: 'ap-cse-lab-01',
      code: 'AP-CSE-01',
      name: 'Systems & Networking Lab North',
      ssid: 'CampusNet-Lab',
      bssid: 'A4:2B:8C:11:4E:10',
      ipAddress: '10.24.12.11',
      vlanId: 24,
      building: 'Academic Block A',
      floorRoom: '2nd Floor · Room 204',
      band: '5 GHz High-Density',
      security: 'WPA3-Enterprise',
      maxClients: 45,
      status: 'online',
      notes: 'Primary lab AP for networking practicals and faculty workstations.',
      updatedAt: '2026-11-14T08:30:00.000Z',
    },
    {
      id: 'ap-lib-main-02',
      code: 'AP-LIB-02',
      name: 'Central Library Reading Hall',
      ssid: 'CampusNet-Academic',
      bssid: 'A4:2B:8C:11:4E:22',
      ipAddress: '10.24.18.14',
      vlanId: 18,
      building: 'Central Library',
      floorRoom: '1st Floor · Quiet Zone',
      band: 'Dual-Band (2.4 / 5 GHz)',
      security: 'WPA3-Enterprise',
      maxClients: 80,
      status: 'online',
      notes: 'Covers reading tables and digital archive terminals.',
      updatedAt: '2026-11-14T08:15:00.000Z',
    },
    {
      id: 'ap-fac-wing-03',
      code: 'AP-FAC-03',
      name: 'Faculty Research Wing',
      ssid: 'CampusNet-Faculty',
      bssid: 'A4:2B:8C:11:4E:35',
      ipAddress: '10.24.40.08',
      vlanId: 40,
      building: 'Academic Block C',
      floorRoom: '3rd Floor · Faculty Corridor',
      band: '6 GHz Wi-Fi 6E',
      security: 'WPA3-Enterprise',
      maxClients: 30,
      status: 'online',
      notes: 'Dedicated isolated VLAN for faculty cabins and departmental servers.',
      updatedAt: '2026-11-14T07:50:00.000Z',
    },
    {
      id: 'ap-aud-hall-04',
      code: 'AP-AUD-04',
      name: 'Seminar & Lecture Complex',
      ssid: 'CampusNet-Academic',
      bssid: 'A4:2B:8C:11:4E:4C',
      ipAddress: '10.24.22.19',
      vlanId: 22,
      building: 'Lecture Annex',
      floorRoom: 'Ground Floor · Hall B',
      band: '5 GHz High-Density',
      security: 'WPA2-Enterprise',
      maxClients: 60,
      status: 'maintenance',
      notes: 'Scheduled firmware verification; non-critical sessions routed to AP-LIB-02.',
      updatedAt: '2026-11-13T17:40:00.000Z',
    },
    {
      id: 'ap-gate-kiosk-05',
      code: 'AP-GATE-05',
      name: 'Main Gate Security & Visitor Bridge',
      ssid: 'CampusNet-Gate',
      bssid: 'A4:2B:8C:11:4E:59',
      ipAddress: '10.24.90.05',
      vlanId: 90,
      building: 'South Gate Pavilion',
      floorRoom: 'Entry Checkpoint',
      band: '2.4 GHz Long-Range',
      security: 'WPA2-PSK + MAC Filter',
      maxClients: 20,
      status: 'offline',
      notes: 'Powered down pending PoE switch replacement.',
      updatedAt: '2026-11-12T14:20:00.000Z',
    },
  ],
  people: [
    {
      id: 'person-01',
      fullName: 'Arjun Chatterjee',
      role: 'student',
      identifier: '23CSE041',
      department: 'Computer Science & Engineering',
      email: 'arjun.chatterjee@campus.edu',
      phone: '+91 98301 44120',
      deviceMac: '3C:22:FB:91:0A:44',
      deviceLabel: 'ThinkPad E14',
      accessStatus: 'authorized',
      assignedApIds: ['ap-cse-lab-01', 'ap-lib-main-02'],
      studentDetails: {
        program: 'B.Tech CSE',
        yearSemester: '3rd Year · Sem 5',
        sectionBatch: 'Section A · 2023–27',
        residenceOrGuardian: 'Hostel Block B · Guardian: S. Chatterjee',
      },
      teacherDetails: {
        designation: '',
        officeRoom: '',
        subjectsTaught: '',
        privilegeTier: 'Standard Faculty',
      },
      customDetails: [
        { id: 'cd-1', label: 'Project Group', value: 'Team 4 — Offline AP Portal' },
        { id: 'cd-2', label: 'Lab Locker', value: 'L-18' },
      ],
      notes: 'Authorized for Systems Lab extended hours.',
      createdAt: '2026-11-10T09:00:00.000Z',
      updatedAt: '2026-11-14T08:10:00.000Z',
    },
    {
      id: 'person-02',
      fullName: 'Dr. Ananya Sen',
      role: 'teacher',
      identifier: 'FAC-CSE-108',
      department: 'Computer Science & Engineering',
      email: 'ananya.sen@campus.edu',
      phone: '+91 98304 71209',
      deviceMac: 'DC:A6:32:7E:41:B2',
      deviceLabel: 'MacBook Pro 14',
      accessStatus: 'authorized',
      assignedApIds: ['ap-cse-lab-01', 'ap-fac-wing-03', 'ap-lib-main-02'],
      studentDetails: {
        program: '',
        yearSemester: '',
        sectionBatch: '',
        residenceOrGuardian: '',
      },
      teacherDetails: {
        designation: 'Associate Professor',
        officeRoom: 'Block C · Room 304',
        subjectsTaught: 'Computer Networks, Distributed Systems',
        privilegeTier: 'Lab Administrator',
      },
      customDetails: [
        { id: 'cd-3', label: 'Intercom Ext.', value: '4304' },
        { id: 'cd-4', label: 'Lab Oversight', value: 'Systems & Networking Lab' },
      ],
      notes: 'Faculty coordinator for lab access approvals.',
      createdAt: '2026-11-08T10:30:00.000Z',
      updatedAt: '2026-11-14T08:00:00.000Z',
    },
    {
      id: 'person-03',
      fullName: 'Meenakshi Deshmukh',
      role: 'student',
      identifier: '24ECE019',
      department: 'Electronics & Communication',
      email: 'meenakshi.d@campus.edu',
      phone: '+91 97482 11904',
      deviceMac: '88:66:5A:19:C3:7E',
      deviceLabel: 'Dell Latitude 5430',
      accessStatus: 'authorized',
      assignedApIds: ['ap-lib-main-02', 'ap-aud-hall-04'],
      studentDetails: {
        program: 'B.Tech ECE',
        yearSemester: '2nd Year · Sem 3',
        sectionBatch: 'Section B · 2024–28',
        residenceOrGuardian: 'Day Scholar · Salt Lake Sector II',
      },
      teacherDetails: {
        designation: '',
        officeRoom: '',
        subjectsTaught: '',
        privilegeTier: 'Standard Faculty',
      },
      customDetails: [
        { id: 'cd-5', label: 'Library Card', value: 'LIB-2024-882' },
      ],
      notes: '',
      createdAt: '2026-11-11T11:20:00.000Z',
      updatedAt: '2026-11-13T16:45:00.000Z',
    },
    {
      id: 'person-04',
      fullName: 'Prof. Rajeshwar Kulkarni',
      role: 'teacher',
      identifier: 'FAC-ECE-052',
      department: 'Electronics & Communication',
      email: 'r.kulkarni@campus.edu',
      phone: '+91 98311 60530',
      deviceMac: 'F0:18:98:4B:72:9D',
      deviceLabel: 'HP EliteBook 840',
      accessStatus: 'authorized',
      assignedApIds: ['ap-fac-wing-03', 'ap-aud-hall-04'],
      studentDetails: {
        program: '',
        yearSemester: '',
        sectionBatch: '',
        residenceOrGuardian: '',
      },
      teacherDetails: {
        designation: 'Professor & HOD',
        officeRoom: 'Block C · Room 301',
        subjectsTaught: 'Wireless Communication, Antenna Theory',
        privilegeTier: 'Faculty Priority',
      },
      customDetails: [
        { id: 'cd-6', label: 'Intercom Ext.', value: '4301' },
      ],
      notes: 'Requires uninterrupted VLAN 40 access across seminar halls.',
      createdAt: '2026-11-05T09:15:00.000Z',
      updatedAt: '2026-11-12T12:00:00.000Z',
    },
    {
      id: 'person-05',
      fullName: 'Md. Tariqul Islam',
      role: 'student',
      identifier: '22MCA007',
      department: 'Computer Applications',
      email: 'tariqul.islam@campus.edu',
      phone: '+91 90512 33890',
      deviceMac: '48:E7:DA:09:51:F0',
      deviceLabel: 'ASUS Zenbook 14',
      accessStatus: 'pending',
      assignedApIds: ['ap-lib-main-02'],
      studentDetails: {
        program: 'MCA',
        yearSemester: '2nd Year · Sem 4',
        sectionBatch: 'Batch 2025–27',
        residenceOrGuardian: 'Hostel Block A · Room 112',
      },
      teacherDetails: {
        designation: '',
        officeRoom: '',
        subjectsTaught: '',
        privilegeTier: 'Standard Faculty',
      },
      customDetails: [
        { id: 'cd-7', label: 'Verification Note', value: 'Awaiting MAC address check' },
      ],
      notes: 'Requested access to Systems & Networking Lab North.',
      createdAt: '2026-11-13T14:10:00.000Z',
      updatedAt: '2026-11-14T07:20:00.000Z',
    },
  ],
  auditLog: [
    {
      id: 'log-1',
      timestamp: '2026-11-14T08:30:00.000Z',
      category: 'access_point',
      summary: 'AP-CSE-01 (Systems & Networking Lab North) verified online on VLAN 24.',
    },
    {
      id: 'log-2',
      timestamp: '2026-11-14T08:10:00.000Z',
      category: 'assignment',
      summary: 'Assigned Arjun Chatterjee (Student · 23CSE041) to AP-CSE-01 and AP-LIB-02.',
    },
    {
      id: 'log-3',
      timestamp: '2026-11-14T07:20:00.000Z',
      category: 'directory',
      summary: 'Added Md. Tariqul Islam (Student · 22MCA007) with status Pending.',
    },
    {
      id: 'log-4',
      timestamp: '2026-11-13T17:40:00.000Z',
      category: 'access_point',
      summary: 'Set AP-AUD-04 (Seminar & Lecture Complex) to Maintenance mode.',
    },
  ],
};

export function createEmptyPerson(role: 'student' | 'teacher' = 'student'): PersonRecord {
  const now = new Date().toISOString();
  return {
    id: `person-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fullName: '',
    role,
    identifier: '',
    department: '',
    email: '',
    phone: '',
    deviceMac: '',
    deviceLabel: '',
    accessStatus: 'authorized',
    assignedApIds: [],
    studentDetails: {
      program: '',
      yearSemester: '',
      sectionBatch: '',
      residenceOrGuardian: '',
    },
    teacherDetails: {
      designation: '',
      officeRoom: '',
      subjectsTaught: '',
      privilegeTier: 'Standard Faculty',
    },
    customDetails: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const cleaned = trimmed.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.|Md\.)\s+/i, '');
  const parts = (cleaned || trimmed).split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function formatMacInput(raw: string): string {
  const hex = raw.replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, 12);
  const pairs = hex.match(/.{1,2}/g);
  return pairs ? pairs.join(':') : '';
}

export function isValidMac(mac: string): boolean {
  return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac.trim().toUpperCase());
}

export function isValidIp(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
}

export function formatLocalDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
