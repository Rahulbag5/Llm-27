import { useEffect, useMemo, useState } from 'react';
import {
  Database,
  FileText,
  Grid,
  Menu,
  Plus,
  Search,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import {
  AccessPoint,
  AccessPointStatus,
  AccessStatus,
  AuditCategory,
  CampusState,
  PersonRecord,
  PersonRole,
} from './types/access';
import {
  getInitials,
  INITIAL_CAMPUS_STATE,
  STORAGE_KEY,
} from './data/seedData';
import {
  AccessPointStatusLabel,
  PersonAccessStatusLabel,
} from './components/StatusIndicator';
import {
  PersonDetailDrawer,
  PersonEditorModal,
} from './components/PersonProfileElement';
import { AccessPointModal } from './components/AccessPointModal';
import { AccessPointDetailPanel } from './components/AccessPointDetailPanel';
import { AccessMatrixView } from './components/AccessMatrixView';
import { AuditLogView } from './components/AuditLogView';
import { BackupRestoreModal } from './components/BackupRestoreModal';

type NavTab = 'access_points' | 'directory' | 'matrix' | 'audit';

function loadInitialState(): CampusState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CAMPUS_STATE;
    const parsed = JSON.parse(raw) as Partial<CampusState>;
    if (!Array.isArray(parsed.accessPoints) || !Array.isArray(parsed.people)) {
      return INITIAL_CAMPUS_STATE;
    }
    return {
      accessPoints: parsed.accessPoints,
      people: parsed.people,
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
    };
  } catch {
    return INITIAL_CAMPUS_STATE;
  }
}

export default function App() {
  const [state, setState] = useState<CampusState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<NavTab>('access_points');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Access Points filter state
  const [apSearch, setApSearch] = useState('');
  const [apStatusFilter, setApStatusFilter] = useState<'all' | AccessPointStatus>('all');

  // Directory (Students & Teachers) filter state
  const [personSearch, setPersonSearch] = useState('');
  const [personRoleFilter, setPersonRoleFilter] = useState<'all' | PersonRole>('all');
  const [personStatusFilter, setPersonStatusFilter] = useState<'all' | AccessStatus>('all');

  // Inspectors & Modals
  const [selectedApId, setSelectedApId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [apModalOpen, setApModalOpen] = useState(false);
  const [editingAp, setEditingAp] = useState<AccessPoint | null>(null);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonRecord | null>(null);
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  // Persist locally on every state change (100% offline, zero external calls)
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  const appendAudit = (
    prevLog: CampusState['auditLog'],
    category: AuditCategory,
    summary: string
  ) => {
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      category,
      summary,
    };
    return [entry, ...prevLog].slice(0, 250);
  };

  // Live AP occupancy count map
  const apOccupancyMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ap of state.accessPoints) map[ap.id] = 0;
    for (const person of state.people) {
      for (const apId of person.assignedApIds) {
        if (map[apId] !== undefined) map[apId] += 1;
      }
    }
    return map;
  }, [state.accessPoints, state.people]);

  const selectedAp = useMemo(
    () => state.accessPoints.find((ap) => ap.id === selectedApId) ?? null,
    [state.accessPoints, selectedApId]
  );

  const selectedPerson = useMemo(
    () => state.people.find((p) => p.id === selectedPersonId) ?? null,
    [state.people, selectedPersonId]
  );

  // Metrics
  const onlineApCount = state.accessPoints.filter((ap) => ap.status === 'online').length;
  const studentCount = state.people.filter((p) => p.role === 'student').length;
  const teacherCount = state.people.filter((p) => p.role === 'teacher').length;
  const authorizedCount = state.people.filter((p) => p.accessStatus === 'authorized').length;

  // Filtered APs
  const filteredAps = useMemo(() => {
    const q = apSearch.trim().toLowerCase();
    return state.accessPoints.filter((ap) => {
      const matchesStatus = apStatusFilter === 'all' || ap.status === apStatusFilter;
      const matchesQ =
        !q ||
        ap.code.toLowerCase().includes(q) ||
        ap.name.toLowerCase().includes(q) ||
        ap.ssid.toLowerCase().includes(q) ||
        ap.building.toLowerCase().includes(q) ||
        ap.ipAddress.toLowerCase().includes(q);
      return matchesStatus && matchesQ;
    });
  }, [state.accessPoints, apSearch, apStatusFilter]);

  // Filtered People (any student or teacher)
  const filteredPeople = useMemo(() => {
    const q = personSearch.trim().toLowerCase();
    return state.people.filter((p) => {
      const matchesRole = personRoleFilter === 'all' || p.role === personRoleFilter;
      const matchesStatus =
        personStatusFilter === 'all' || p.accessStatus === personStatusFilter;
      const matchesCustom = p.customDetails.some(
        (d) =>
          d.label.toLowerCase().includes(q) || d.value.toLowerCase().includes(q)
      );
      const matchesQ =
        !q ||
        p.fullName.toLowerCase().includes(q) ||
        p.identifier.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.deviceMac.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.studentDetails.program.toLowerCase().includes(q) ||
        p.teacherDetails.designation.toLowerCase().includes(q) ||
        matchesCustom;
      return matchesRole && matchesStatus && matchesQ;
    });
  }, [state.people, personSearch, personRoleFilter, personStatusFilter]);

  // Handlers: Access Points
  const handleSaveAp = (ap: AccessPoint, isNew: boolean) => {
    setState((prev) => {
      const accessPoints = isNew
        ? [ap, ...prev.accessPoints]
        : prev.accessPoints.map((item) => (item.id === ap.id ? ap : item));
      const summary = isNew
        ? `Registered access point ${ap.code} (${ap.name}) on VLAN ${ap.vlanId}.`
        : `Updated access point ${ap.code} (${ap.name}).`;
      return {
        ...prev,
        accessPoints,
        auditLog: appendAudit(prev.auditLog, 'access_point', summary),
      };
    });
    setApModalOpen(false);
    setEditingAp(null);
  };

  const handleDeleteAp = (ap: AccessPoint) => {
    setState((prev) => ({
      accessPoints: prev.accessPoints.filter((item) => item.id !== ap.id),
      people: prev.people.map((person) => ({
        ...person,
        assignedApIds: person.assignedApIds.filter((id) => id !== ap.id),
      })),
      auditLog: appendAudit(
        prev.auditLog,
        'access_point',
        `Removed access point ${ap.code} (${ap.name}) and cleared linked assignments.`
      ),
    }));
    setSelectedApId(null);
  };

  const handleApStatusChange = (apId: string, status: AccessPointStatus) => {
    setState((prev) => {
      const target = prev.accessPoints.find((a) => a.id === apId);
      if (!target || target.status === status) return prev;
      return {
        ...prev,
        accessPoints: prev.accessPoints.map((a) =>
          a.id === apId ? { ...a, status, updatedAt: new Date().toISOString() } : a
        ),
        auditLog: appendAudit(
          prev.auditLog,
          'access_point',
          `Changed ${target.code} operational status to ${status}.`
        ),
      };
    });
  };

  // Handlers: Students & Teachers Directory
  const handleSavePerson = (person: PersonRecord, isNew: boolean) => {
    setState((prev) => {
      const people = isNew
        ? [person, ...prev.people]
        : prev.people.map((item) => (item.id === person.id ? person : item));
      const roleLabel = person.role === 'student' ? 'Student' : 'Teacher';
      const summary = isNew
        ? `Enrolled ${roleLabel} ${person.fullName} (${person.identifier}).`
        : `Updated ${roleLabel} profile for ${person.fullName} (${person.identifier}).`;
      return {
        ...prev,
        people,
        auditLog: appendAudit(prev.auditLog, 'directory', summary),
      };
    });
    setPersonModalOpen(false);
    setEditingPerson(null);
  };

  const handleDeletePerson = (person: PersonRecord) => {
    setState((prev) => ({
      ...prev,
      people: prev.people.filter((item) => item.id !== person.id),
      auditLog: appendAudit(
        prev.auditLog,
        'directory',
        `Removed ${person.role === 'student' ? 'Student' : 'Teacher'} ${person.fullName} (${person.identifier}).`
      ),
    }));
    setSelectedPersonId(null);
  };

  const handleCycleAccessStatus = (personId: string, accessStatus: AccessStatus) => {
    setState((prev) => {
      const target = prev.people.find((p) => p.id === personId);
      if (!target || target.accessStatus === accessStatus) return prev;
      return {
        ...prev,
        people: prev.people.map((p) =>
          p.id === personId
            ? { ...p, accessStatus, updatedAt: new Date().toISOString() }
            : p
        ),
        auditLog: appendAudit(
          prev.auditLog,
          'directory',
          `Updated ${target.fullName} access status to ${accessStatus}.`
        ),
      };
    });
  };

  const handleToggleAssignment = (personId: string, apId: string) => {
    setState((prev) => {
      const person = prev.people.find((p) => p.id === personId);
      const ap = prev.accessPoints.find((a) => a.id === apId);
      if (!person || !ap) return prev;
      const alreadyAssigned = person.assignedApIds.includes(apId);
      const nextIds = alreadyAssigned
        ? person.assignedApIds.filter((id) => id !== apId)
        : [...person.assignedApIds, apId];
      const summary = alreadyAssigned
        ? `Revoked ${person.fullName} (${person.identifier}) from ${ap.code}.`
        : `Assigned ${person.fullName} (${person.identifier}) to ${ap.code}.`;
      return {
        ...prev,
        people: prev.people.map((p) =>
          p.id === personId
            ? { ...p, assignedApIds: nextIds, updatedAt: new Date().toISOString() }
            : p
        ),
        auditLog: appendAudit(prev.auditLog, 'assignment', summary),
      };
    });
  };

  const handleImportState = (imported: CampusState) => {
    setState({
      ...imported,
      auditLog: appendAudit(
        imported.auditLog,
        'backup',
        `Restored local snapshot (${imported.accessPoints.length} APs, ${imported.people.length} people).`
      ),
    });
  };

  const handleResetSample = () => {
    setState({
      ...INITIAL_CAMPUS_STATE,
      auditLog: appendAudit(
        INITIAL_CAMPUS_STATE.auditLog,
        'backup',
        'Reset workspace to default campus dataset.'
      ),
    });
  };

  const navItems: { id: NavTab; label: string; icon: typeof Wifi; count?: number }[] = [
    {
      id: 'access_points',
      label: 'Access Points',
      icon: Wifi,
      count: state.accessPoints.length,
    },
    {
      id: 'directory',
      label: 'Students & Teachers',
      icon: Users,
      count: state.people.length,
    },
    { id: 'matrix', label: 'Access Matrix', icon: Grid },
    { id: 'audit', label: 'Activity Log', icon: FileText, count: state.auditLog.length },
  ];

  const pageTitle =
    activeTab === 'access_points'
      ? 'Access Points'
      : activeTab === 'directory'
      ? 'Students & Teachers Directory'
      : activeTab === 'matrix'
      ? 'Access Permission Matrix'
      : 'Activity & Audit Log';

  const apById = useMemo(
    () => new Map(state.accessPoints.map((a) => [a.id, a])),
    [state.accessPoints]
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar (256px) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-150 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
          <span className="text-base font-bold tracking-tight text-slate-900 font-display whitespace-nowrap">
            CampusGate
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1" aria-label="Primary sections">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.count !== undefined && (
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      active ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 space-y-2">
          <button
            type="button"
            onClick={() => {
              setBackupModalOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            <Database className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
            <span>Backup & Export</span>
          </button>
          <p className="px-2 text-[11px] text-slate-500 leading-snug">
            Offline local storage mode · Data stays on this device
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb left, max 2 primary actions right */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline">CampusGate</span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-semibold text-slate-900 truncate">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingAp(null);
                setApModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Access Point</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingPerson(null);
                setPersonModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Enroll Person</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {/* Summary Strip */}
          <section
            aria-label="Campus summary"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
              <div className="text-xs font-medium text-slate-500">Access Points Online</div>
              <div className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
                {onlineApCount}{' '}
                <span className="text-sm font-normal text-slate-400">
                  / {state.accessPoints.length}
                </span>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
              <div className="text-xs font-medium text-slate-500">Enrolled Students</div>
              <div className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
                {studentCount}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
              <div className="text-xs font-medium text-slate-500">Enrolled Teachers</div>
              <div className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
                {teacherCount}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
              <div className="text-xs font-medium text-slate-500">Authorized Devices</div>
              <div className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
                {authorizedCount}{' '}
                <span className="text-sm font-normal text-slate-400">
                  / {state.people.length}
                </span>
              </div>
            </div>
          </section>

          {/* TAB 1: ACCESS POINTS */}
          {activeTab === 'access_points' && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={apSearch}
                    onChange={(e) => setApSearch(e.target.value)}
                    placeholder="Search AP by code, name, SSID, building, or IP..."
                    className="w-full pl-9 pr-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start">
                  {(['all', 'online', 'maintenance', 'offline'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setApStatusFilter(status)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                        apStatusFilter === status
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {status === 'all' ? 'All Points' : status}
                    </button>
                  ))}
                </div>
              </div>

              {state.accessPoints.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <h2 className="text-base font-semibold text-slate-900">
                    No Access Points Configured
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                    Register your first campus wireless or lab access point to start assigning students and teachers.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAp(null);
                      setApModalOpen(true);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Access Point</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80">
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600">
                            Access Point
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600">
                            SSID & VLAN
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600">
                            Location
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600">
                            IP / BSSID
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600 text-right">
                            Assigned
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600">
                            Status
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredAps.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-10 px-4 text-center text-sm text-slate-500"
                            >
                              No access points match your search or status filter.
                            </td>
                          </tr>
                        ) : (
                          filteredAps.map((ap) => {
                            const count = apOccupancyMap[ap.id] ?? 0;
                            return (
                              <tr
                                key={ap.id}
                                onClick={() => setSelectedApId(ap.id)}
                                className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <div className="text-sm font-medium text-slate-900">
                                    {ap.name}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono">
                                    {ap.code} · {ap.security}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm font-mono text-slate-900">
                                    {ap.ssid}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono tabular-nums">
                                    VLAN {ap.vlanId} · {ap.band}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm text-slate-900">{ap.building}</div>
                                  <div className="text-xs text-slate-500">{ap.floorRoom}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-xs font-mono tabular-nums text-slate-900">
                                    {ap.ipAddress || '—'}
                                  </div>
                                  <div className="text-xs font-mono tabular-nums text-slate-500">
                                    {ap.bssid || '—'}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right font-mono tabular-nums text-sm text-slate-900">
                                  {count}
                                  <span className="text-slate-400">/{ap.maxClients}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <AccessPointStatusLabel status={ap.status} />
                                </td>
                                <td
                                  className="py-3 px-4 text-right whitespace-nowrap"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setSelectedApId(ap.id)}
                                    className="px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                  >
                                    Manage
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingAp(ap);
                                      setApModalOpen(true);
                                    }}
                                    className="ml-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAB 2: UNIVERSAL STUDENTS & TEACHERS DIRECTORY */}
          {activeTab === 'directory' && (
            <section className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={personSearch}
                    onChange={(e) => setPersonSearch(e.target.value)}
                    placeholder="Search any student or teacher by name, ID, MAC, department, or detail..."
                    className="w-full pl-9 pr-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
                    {(['all', 'student', 'teacher'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setPersonRoleFilter(role)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          personRoleFilter === role
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {role === 'all'
                          ? 'All Roles'
                          : role === 'student'
                          ? 'Students'
                          : 'Teachers'}
                      </button>
                    ))}
                  </div>

                  <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
                    {(['all', 'authorized', 'pending', 'suspended'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setPersonStatusFilter(st)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                          personStatusFilter === st
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st === 'all' ? 'All Status' : st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {state.people.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <h2 className="text-base font-semibold text-slate-900">
                    Directory Is Empty
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                    Add any student or teacher by name, assign their role-specific details, and grant access to campus access points.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPerson(null);
                      setPersonModalOpen(true);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Enroll First Person</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80">
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600">
                            Name & Role
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600">
                            Department & Role Details
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600">
                            Device & MAC
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600">
                            Assigned Access Points
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600">
                            Status
                          </th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-600 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredPeople.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-10 px-4 text-center text-sm text-slate-500"
                            >
                              No students or teachers match your current search or filters.
                            </td>
                          </tr>
                        ) : (
                          filteredPeople.map((person) => {
                            const roleSummary =
                              person.role === 'student'
                                ? [
                                    person.studentDetails.program,
                                    person.studentDetails.yearSemester,
                                    person.studentDetails.sectionBatch,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')
                                : [
                                    person.teacherDetails.designation,
                                    person.teacherDetails.officeRoom,
                                    person.teacherDetails.privilegeTier,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ');

                            const assignedCodes = person.assignedApIds
                              .map((id) => apById.get(id)?.code)
                              .filter(Boolean)
                              .join(', ');

                            return (
                              <tr
                                key={person.id}
                                onClick={() => setSelectedPersonId(person.id)}
                                className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0 font-display">
                                      {getInitials(person.fullName)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium text-slate-900">
                                        {person.fullName}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        <span>
                                          {person.role === 'student' ? 'Student' : 'Teacher'}
                                        </span>
                                        <span aria-hidden="true"> · </span>
                                        <span className="font-mono">{person.identifier}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm text-slate-900">
                                    {person.department}
                                  </div>
                                  <div className="text-xs text-slate-500 max-w-xs truncate">
                                    {roleSummary || 'No extra role details'}
                                    {person.customDetails.length > 0
                                      ? ` · +${person.customDetails.length} custom`
                                      : ''}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-xs font-mono tabular-nums text-slate-900">
                                    {person.deviceMac || 'No MAC'}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {person.deviceLabel || '—'}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-xs font-mono text-slate-700 max-w-[200px] truncate">
                                    {assignedCodes || 'Unassigned'}
                                  </div>
                                  <div className="text-xs text-slate-400 tabular-nums">
                                    {person.assignedApIds.length} point
                                    {person.assignedApIds.length === 1 ? '' : 's'}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <PersonAccessStatusLabel status={person.accessStatus} />
                                </td>
                                <td
                                  className="py-3 px-4 text-right whitespace-nowrap"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPersonId(person.id)}
                                    className="px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                  >
                                    Inspect
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPerson(person);
                                      setPersonModalOpen(true);
                                    }}
                                    className="ml-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAB 3: ACCESS MATRIX */}
          {activeTab === 'matrix' && (
            <AccessMatrixView
              accessPoints={state.accessPoints}
              people={state.people}
              onToggleAssignment={handleToggleAssignment}
              onInspectPerson={(person) => setSelectedPersonId(person.id)}
              onInspectAp={(ap) => setSelectedApId(ap.id)}
            />
          )}

          {/* TAB 4: ACTIVITY LOG */}
          {activeTab === 'audit' && <AuditLogView entries={state.auditLog} />}
        </main>
      </div>

      {/* Drawers & Modals */}
      <AccessPointDetailPanel
        ap={selectedAp}
        people={state.people}
        onClose={() => setSelectedApId(null)}
        onEdit={(ap) => {
          setEditingAp(ap);
          setApModalOpen(true);
        }}
        onDelete={handleDeleteAp}
        onStatusChange={handleApStatusChange}
        onTogglePersonAssignment={handleToggleAssignment}
        onInspectPerson={(person) => {
          setSelectedApId(null);
          setSelectedPersonId(person.id);
        }}
      />

      <PersonDetailDrawer
        person={selectedPerson}
        accessPoints={state.accessPoints}
        onClose={() => setSelectedPersonId(null)}
        onEdit={(person) => {
          setEditingPerson(person);
          setPersonModalOpen(true);
        }}
        onDelete={handleDeletePerson}
        onToggleApForPerson={handleToggleAssignment}
        onCycleAccessStatus={handleCycleAccessStatus}
      />

      <AccessPointModal
        isOpen={apModalOpen}
        initialAp={editingAp}
        onClose={() => {
          setApModalOpen(false);
          setEditingAp(null);
        }}
        onSave={handleSaveAp}
      />

      <PersonEditorModal
        isOpen={personModalOpen}
        initialPerson={editingPerson}
        accessPoints={state.accessPoints}
        apOccupancyMap={apOccupancyMap}
        onClose={() => {
          setPersonModalOpen(false);
          setEditingPerson(null);
        }}
        onSave={handleSavePerson}
      />

      <BackupRestoreModal
        isOpen={backupModalOpen}
        state={state}
        onClose={() => setBackupModalOpen(false)}
        onImportState={handleImportState}
        onResetSample={handleResetSample}
      />
    </div>
  );
}
