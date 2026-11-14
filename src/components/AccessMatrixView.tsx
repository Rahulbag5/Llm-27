import { useState } from 'react';
import { Search } from 'lucide-react';
import { AccessPoint, PersonRecord, PersonRole } from '../types/access';
import { getInitials } from '../data/seedData';
import { PersonAccessStatusLabel } from './StatusIndicator';

interface AccessMatrixViewProps {
  accessPoints: AccessPoint[];
  people: PersonRecord[];
  onToggleAssignment: (personId: string, apId: string) => void;
  onInspectPerson: (person: PersonRecord) => void;
  onInspectAp: (ap: AccessPoint) => void;
}

export function AccessMatrixView({
  accessPoints,
  people,
  onToggleAssignment,
  onInspectPerson,
  onInspectAp,
}: AccessMatrixViewProps) {
  const [roleFilter, setRoleFilter] = useState<'all' | PersonRole>('all');
  const [query, setQuery] = useState('');

  const filteredPeople = people.filter((p) => {
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.identifier.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by any student or teacher name, ID, or department..."
            className="w-full pl-9 pr-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start">
          {(['all', 'student', 'teacher'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setRoleFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                roleFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'all'
                ? 'All People'
                : tab === 'student'
                ? 'Students Only'
                : 'Teachers Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      {accessPoints.length === 0 || people.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-slate-900">
            Access Matrix requires at least one Access Point and one enrolled Person.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Add access points and enroll students or teachers to manage permissions in bulk.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-600 min-w-[240px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    Student / Teacher
                  </th>
                  {accessPoints.map((ap) => {
                    const count = people.filter((p) => p.assignedApIds.includes(ap.id)).length;
                    return (
                      <th
                        key={ap.id}
                        className="py-3 px-3 text-center text-xs font-semibold text-slate-700 min-w-[130px]"
                      >
                        <button
                          type="button"
                          onClick={() => onInspectAp(ap)}
                          className="hover:text-blue-600 transition-colors text-center w-full"
                          title={ap.name}
                        >
                          <div className="font-mono">{ap.code}</div>
                          <div className="font-normal text-[11px] text-slate-500 truncate max-w-[120px] mx-auto">
                            {ap.ssid}
                          </div>
                          <div className="font-mono tabular-nums text-[11px] text-slate-400 mt-0.5">
                            {count}/{ap.maxClients}
                          </div>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPeople.length === 0 ? (
                  <tr>
                    <td
                      colSpan={accessPoints.length + 1}
                      className="py-8 px-4 text-center text-sm text-slate-500"
                    >
                      No matching students or teachers found.
                    </td>
                  </tr>
                ) : (
                  filteredPeople.map((person) => (
                    <tr key={person.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 sticky left-0 bg-white z-10 border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => onInspectPerson(person)}
                          className="flex items-center gap-2.5 text-left w-full group"
                        >
                          <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-[11px] font-semibold shrink-0">
                            {getInitials(person.fullName)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 truncate">
                              {person.fullName}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <span>{person.role === 'student' ? 'Student' : 'Teacher'}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">{person.identifier}</span>
                              <span aria-hidden="true">·</span>
                              <PersonAccessStatusLabel status={person.accessStatus} />
                            </div>
                          </div>
                        </button>
                      </td>
                      {accessPoints.map((ap) => {
                        const checked = person.assignedApIds.includes(ap.id);
                        return (
                          <td key={ap.id} className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onToggleAssignment(person.id, ap.id)}
                              aria-label={`Assign ${person.fullName} to ${ap.code}`}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
