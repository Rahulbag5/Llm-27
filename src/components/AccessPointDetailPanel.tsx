import { useState } from 'react';
import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { AccessPoint, AccessPointStatus, PersonRecord } from '../types/access';
import { formatLocalDateTime, getInitials } from '../data/seedData';
import { AccessPointStatusLabel, PersonAccessStatusLabel } from './StatusIndicator';

interface AccessPointDetailPanelProps {
  ap: AccessPoint | null;
  people: PersonRecord[];
  onClose: () => void;
  onEdit: (ap: AccessPoint) => void;
  onDelete: (ap: AccessPoint) => void;
  onStatusChange: (apId: string, status: AccessPointStatus) => void;
  onTogglePersonAssignment: (personId: string, apId: string) => void;
  onInspectPerson: (person: PersonRecord) => void;
}

export function AccessPointDetailPanel({
  ap,
  people,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onTogglePersonAssignment,
  onInspectPerson,
}: AccessPointDetailPanelProps) {
  const [assignQuery, setAssignQuery] = useState('');

  if (!ap) return null;

  const assignedPeople = people.filter((p) => p.assignedApIds.includes(ap.id));
  const unassignedPeople = people.filter(
    (p) =>
      !p.assignedApIds.includes(ap.id) &&
      (assignQuery.trim() === '' ||
        p.fullName.toLowerCase().includes(assignQuery.toLowerCase()) ||
        p.identifier.toLowerCase().includes(assignQuery.toLowerCase()) ||
        p.department.toLowerCase().includes(assignQuery.toLowerCase()))
  );

  const occupancyPct = Math.min(
    100,
    Math.round((assignedPeople.length / Math.max(1, ap.maxClients)) * 100)
  );

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-900/30"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${ap.name}`}
    >
      <div className="w-full max-w-xl bg-white h-full border-l border-slate-200 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 text-xs text-slate-500 font-mono">
              <span className="font-semibold text-slate-700">{ap.code}</span>
              <span aria-hidden="true">·</span>
              <span>VLAN {ap.vlanId}</span>
              <span aria-hidden="true">·</span>
              <AccessPointStatusLabel status={ap.status} />
            </div>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{ap.name}</h2>
            <p className="text-xs text-slate-500">
              {ap.building} · {ap.floorRoom}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close access point details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status Switcher */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <span className="text-xs font-medium text-slate-600">Operational State</span>
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
              {(['online', 'maintenance', 'offline'] as AccessPointStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onStatusChange(ap.id, st)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                    ap.status === st
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Network Specs */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 tracking-wide">
              Network Configuration
            </h3>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500">SSID</dt>
                <dd className="font-mono text-slate-900">{ap.ssid}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">BSSID / MAC</dt>
                <dd className="font-mono text-slate-900 tabular-nums">
                  {ap.bssid || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Management IP</dt>
                <dd className="font-mono text-slate-900 tabular-nums">
                  {ap.ipAddress || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Security Protocol</dt>
                <dd className="text-slate-900">{ap.security}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500">Radio Band</dt>
                <dd className="text-slate-900">{ap.band}</dd>
              </div>
            </dl>
          </section>

          {/* Capacity */}
          <section className="space-y-2 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">Assigned Client Load</span>
              <span className="font-mono tabular-nums text-slate-700">
                {assignedPeople.length} / {ap.maxClients} ({occupancyPct}%)
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  occupancyPct >= 90
                    ? 'bg-red-600'
                    : occupancyPct >= 70
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </section>

          {/* Assigned Students & Teachers */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 tracking-wide">
              Authorized Students & Teachers ({assignedPeople.length})
            </h3>
            {assignedPeople.length === 0 ? (
              <p className="text-sm text-slate-500">
                No students or teachers are assigned to this access point yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {assignedPeople.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50/70"
                  >
                    <button
                      type="button"
                      onClick={() => onInspectPerson(person)}
                      className="flex items-center gap-3 min-w-0 text-left flex-1"
                    >
                      <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {getInitials(person.fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {person.fullName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                          <span>{person.role === 'student' ? 'Student' : 'Teacher'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{person.identifier}</span>
                          <span aria-hidden="true">·</span>
                          <PersonAccessStatusLabel status={person.accessStatus} />
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onTogglePersonAssignment(person.id, ap.id)}
                      className="px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Assign Any Student or Teacher */}
          <section className="space-y-2.5 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 tracking-wide">
              Assign Student or Teacher from Directory
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={assignQuery}
                onChange={(e) => setAssignQuery(e.target.value)}
                placeholder="Search any student or teacher by name or ID..."
                className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {unassignedPeople.length === 0 ? (
              <p className="text-xs text-slate-500 py-1">
                {people.length === assignedPeople.length
                  ? 'Everyone in the directory is already assigned to this access point.'
                  : 'No matching unassigned students or teachers found.'}
              </p>
            ) : (
              <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {unassignedPeople.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-slate-900 block truncate">
                        {person.fullName}
                      </span>
                      <span className="text-slate-500">
                        {person.role === 'student' ? 'Student' : 'Teacher'} ·{' '}
                        <span className="font-mono">{person.identifier}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTogglePersonAssignment(person.id, ap.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Assign</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {ap.notes && (
            <section className="space-y-1.5 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 tracking-wide">Notes</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{ap.notes}</p>
            </section>
          )}

          <div className="pt-3 border-t border-slate-200 text-xs text-slate-400 font-mono tabular-nums">
            Updated: {formatLocalDateTime(ap.updatedAt)}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => onDelete(ap)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete AP</span>
          </button>
          <button
            type="button"
            onClick={() => onEdit(ap)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Access Point</span>
          </button>
        </div>
      </div>
    </div>
  );
}
