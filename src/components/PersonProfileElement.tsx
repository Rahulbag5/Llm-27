import React, { useEffect, useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  UserCheck,
  GraduationCap,
  Briefcase,
  Wifi,
  Edit3,
  Check,
} from 'lucide-react';
import {
  AccessPoint,
  AccessStatus,
  CustomDetailField,
  PersonRecord,
  PersonRole,
  TeacherPrivilegeTier,
} from '../types/access';
import {
  createEmptyPerson,
  formatLocalDateTime,
  formatMacInput,
  getInitials,
  isValidMac,
} from '../data/seedData';
import { AccessPointStatusLabel, PersonAccessStatusLabel } from './StatusIndicator';

interface PersonEditorModalProps {
  isOpen: boolean;
  initialPerson: PersonRecord | null;
  accessPoints: AccessPoint[];
  apOccupancyMap: Record<string, number>;
  onClose: () => void;
  onSave: (person: PersonRecord, isNew: boolean) => void;
}

const DEPARTMENT_SUGGESTIONS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Computer Applications',
  'Physics & Applied Sciences',
  'Mathematics',
  'Central Administration',
];

export function PersonEditorModal({
  isOpen,
  initialPerson,
  accessPoints,
  apOccupancyMap,
  onClose,
  onSave,
}: PersonEditorModalProps) {
  const isNew = !initialPerson;
  const [form, setForm] = useState<PersonRecord>(() => createEmptyPerson('student'));
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [newDetailLabel, setNewDetailLabel] = useState('');
  const [newDetailValue, setNewDetailValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialPerson
          ? {
              ...initialPerson,
              studentDetails: { ...initialPerson.studentDetails },
              teacherDetails: { ...initialPerson.teacherDetails },
              customDetails: initialPerson.customDetails.map((d) => ({ ...d })),
              assignedApIds: [...initialPerson.assignedApIds],
            }
          : createEmptyPerson('student')
      );
      setErrorMsg('');
      setNewDetailLabel('');
      setNewDetailValue('');
    }
  }, [isOpen, initialPerson]);

  if (!isOpen) return null;

  const handleRoleChange = (role: PersonRole) => {
    setForm((prev) => ({ ...prev, role }));
  };

  const toggleApAssignment = (apId: string) => {
    setForm((prev) => {
      const exists = prev.assignedApIds.includes(apId);
      return {
        ...prev,
        assignedApIds: exists
          ? prev.assignedApIds.filter((id) => id !== apId)
          : [...prev.assignedApIds, apId],
      };
    });
  };

  const handleAddCustomDetail = () => {
    const label = newDetailLabel.trim();
    const value = newDetailValue.trim();
    if (!label || !value) return;
    const item: CustomDetailField = {
      id: `cd-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      label,
      value,
    };
    setForm((prev) => ({
      ...prev,
      customDetails: [...prev.customDetails, item],
    }));
    setNewDetailLabel('');
    setNewDetailValue('');
  };

  const handleUpdateCustomDetail = (id: string, field: 'label' | 'value', val: string) => {
    setForm((prev) => ({
      ...prev,
      customDetails: prev.customDetails.map((d) =>
        d.id === id ? { ...d, [field]: val } : d
      ),
    }));
  };

  const handleRemoveCustomDetail = (id: string) => {
    setForm((prev) => ({
      ...prev,
      customDetails: prev.customDetails.filter((d) => d.id !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = form.fullName.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter a full name for this student or teacher.');
      return;
    }
    if (!form.identifier.trim()) {
      setErrorMsg(
        form.role === 'student'
          ? 'Please enter a Student Roll / Registration ID.'
          : 'Please enter a Teacher Employee / Faculty ID.'
      );
      return;
    }
    if (form.deviceMac.trim() && !isValidMac(form.deviceMac)) {
      setErrorMsg('Device MAC address must follow XX:XX:XX:XX:XX:XX hexadecimal format.');
      return;
    }

    const pendingCustom =
      newDetailLabel.trim() && newDetailValue.trim()
        ? [
            ...form.customDetails,
            {
              id: `cd-${Date.now()}`,
              label: newDetailLabel.trim(),
              value: newDetailValue.trim(),
            },
          ]
        : form.customDetails;

    onSave(
      {
        ...form,
        fullName: trimmedName,
        identifier: form.identifier.trim(),
        department: form.department.trim() || 'General',
        email: form.email.trim(),
        phone: form.phone.trim(),
        deviceMac: form.deviceMac.trim().toUpperCase(),
        deviceLabel: form.deviceLabel.trim(),
        customDetails: pendingCustom.filter((d) => d.label.trim() && d.value.trim()),
        notes: form.notes.trim(),
        updatedAt: new Date().toISOString(),
      },
      isNew
    );
  };

  const previewName = form.fullName.trim() || 'Unnamed Person';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-editor-title"
    >
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden my-auto">
        {/* Header with live universal name & role preview */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-semibold shrink-0 font-display">
              {getInitials(previewName)}
            </div>
            <div className="min-w-0">
              <h2
                id="person-editor-title"
                className="text-base font-semibold text-slate-900 truncate"
              >
                {isNew ? `Enroll ${form.role === 'student' ? 'Student' : 'Teacher'}` : previewName}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {form.role === 'student' ? 'Student Profile' : 'Teacher / Faculty Profile'}
                {form.identifier ? ` · ${form.identifier}` : ''}
                {form.department ? ` · ${form.department}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[78vh] overflow-y-auto px-6 py-5 space-y-6">
          {errorMsg && (
            <div
              role="alert"
              className="px-4 py-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg"
            >
              {errorMsg}
            </div>
          )}

          {/* Role Selector: Universal switch between Student & Teacher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span className="block text-sm font-semibold text-slate-900">Person Role</span>
              <span className="text-xs text-slate-500">
                Supports any student or teacher name with role-specific academic or faculty details.
              </span>
            </div>
            <div
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg shrink-0"
              role="group"
              aria-label="Select person role"
            >
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  form.role === 'student'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('teacher')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  form.role === 'teacher'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Teacher</span>
              </button>
            </div>
          </div>

          {/* Core Universal Identity Section (Works for ANY name) */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Identity & Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="person-full-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Full Name (Any Student or Teacher Name) <span className="text-red-600">*</span>
                </label>
                <input
                  id="person-full-name"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Enter any full name, e.g., Subham Roy, Dr. Kavita Nair, Md. Arif..."
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label htmlFor="person-identifier" className="block text-xs font-medium text-slate-700 mb-1.5">
                  {form.role === 'student' ? 'Student Roll / Reg. No.' : 'Faculty / Employee ID'}{' '}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="person-identifier"
                  type="text"
                  required
                  value={form.identifier}
                  onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))}
                  placeholder={form.role === 'student' ? 'e.g., 23CSE041' : 'e.g., FAC-CSE-108'}
                  className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label htmlFor="person-department" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Department / Academic Unit
                </label>
                <input
                  id="person-department"
                  type="text"
                  list="department-options"
                  value={form.department}
                  onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                  placeholder="e.g., Computer Science & Engineering"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
                <datalist id="department-options">
                  {DEPARTMENT_SUGGESTIONS.map((dept) => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="person-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="person-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="name@campus.edu"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label htmlFor="person-phone" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Phone / Contact Number
                </label>
                <input
                  id="person-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98300 00000"
                  className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>
          </section>

          {/* Dynamic Role-Specific Details Section */}
          <section className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              {form.role === 'student' ? 'Student Academic Details' : 'Teacher & Faculty Details'}
            </h3>

            {form.role === 'student' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="stu-program" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Program / Degree
                  </label>
                  <input
                    id="stu-program"
                    type="text"
                    value={form.studentDetails.program}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        studentDetails: { ...p.studentDetails, program: e.target.value },
                      }))
                    }
                    placeholder="e.g., B.Tech CSE, M.Sc, BCA"
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label htmlFor="stu-year" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Year / Semester
                  </label>
                  <input
                    id="stu-year"
                    type="text"
                    value={form.studentDetails.yearSemester}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        studentDetails: { ...p.studentDetails, yearSemester: e.target.value },
                      }))
                    }
                    placeholder="e.g., 3rd Year · Sem 5"
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label htmlFor="stu-batch" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Section / Batch
                  </label>
                  <input
                    id="stu-batch"
                    type="text"
                    value={form.studentDetails.sectionBatch}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        studentDetails: { ...p.studentDetails, sectionBatch: e.target.value },
                      }))
                    }
                    placeholder="e.g., Section A · 2023–27"
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label htmlFor="stu-residence" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Hostel / Guardian Contact
                  </label>
                  <input
                    id="stu-residence"
                    type="text"
                    value={form.studentDetails.residenceOrGuardian}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        studentDetails: {
                          ...p.studentDetails,
                          residenceOrGuardian: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g., Hostel Block B or Day Scholar"
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tea-designation" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Designation / Rank
                  </label>
                  <input
                    id="tea-designation"
                    type="text"
                    value={form.teacherDetails.designation}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        teacherDetails: { ...p.teacherDetails, designation: e.target.value },
                      }))
                    }
                    placeholder="e.g., Assistant Professor, HOD, Lab Instructor"
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label htmlFor="tea-office" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Office / Cabin Room
                  </label>
                  <input
                    id="tea-office"
                    type="text"
                    value={form.teacherDetails.officeRoom}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        teacherDetails: { ...p.teacherDetails, officeRoom: e.target.value },
                      }))
                    }
                    placeholder="e.g., Block C · Room 304"
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label htmlFor="tea-subjects" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Subjects / Labs Taught
                  </label>
                  <input
                    id="tea-subjects"
                    type="text"
                    value={form.teacherDetails.subjectsTaught}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        teacherDetails: { ...p.teacherDetails, subjectsTaught: e.target.value },
                      }))
                    }
                    placeholder="e.g., Computer Networks, OS Lab"
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label htmlFor="tea-tier" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Network Privilege Tier
                  </label>
                  <select
                    id="tea-tier"
                    value={form.teacherDetails.privilegeTier}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        teacherDetails: {
                          ...p.teacherDetails,
                          privilegeTier: e.target.value as TeacherPrivilegeTier,
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Faculty Priority">Faculty Priority</option>
                    <option value="Lab Administrator">Lab Administrator</option>
                    <option value="Standard Faculty">Standard Faculty</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Device & Access Status */}
          <section className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Device & Access Policy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="person-mac" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Device MAC Address
                </label>
                <input
                  id="person-mac"
                  type="text"
                  value={form.deviceMac}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, deviceMac: formatMacInput(e.target.value) }))
                  }
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label htmlFor="person-device" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Device Name / Model
                </label>
                <input
                  id="person-device"
                  type="text"
                  value={form.deviceLabel}
                  onChange={(e) => setForm((p) => ({ ...p, deviceLabel: e.target.value }))}
                  placeholder="e.g., ThinkPad E14"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label htmlFor="person-status" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Access Status
                </label>
                <select
                  id="person-status"
                  value={form.accessStatus}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, accessStatus: e.target.value as AccessStatus }))
                  }
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="authorized">Authorized</option>
                  <option value="pending">Pending Verification</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </section>

          {/* Access Point Assignments */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Assigned Access Points ({form.assignedApIds.length} selected)
              </h3>
              <span className="text-xs text-slate-500">
                Choose which campus access points this person can connect to
              </span>
            </div>
            {accessPoints.length === 0 ? (
              <p className="text-sm text-slate-500 py-3">
                No access points configured yet. Create an access point first to assign users.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {accessPoints.map((ap) => {
                  const checked = form.assignedApIds.includes(ap.id);
                  const currentCount = apOccupancyMap[ap.id] ?? 0;
                  return (
                    <label
                      key={ap.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checked
                          ? 'border-blue-600 bg-blue-50/40'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleApAssignment(ap.id)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {ap.code} · {ap.name}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                          <span>{ap.ssid}</span>
                          <span aria-hidden="true">·</span>
                          <span>VLAN {ap.vlanId}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {currentCount}/{ap.maxClients}
                          </span>
                        </div>
                        <div className="mt-1">
                          <AccessPointStatusLabel status={ap.status} />
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          {/* Flexible Custom Details Section (Any extra details for anyone) */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Additional Custom Details</h3>
              <p className="text-xs text-slate-500">
                Attach any extra information specific to this student or teacher (e.g., Advisor, Library ID, Vehicle No., Emergency Contact).
              </p>
            </div>

            {form.customDetails.length > 0 && (
              <div className="space-y-2">
                {form.customDetails.map((field) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        handleUpdateCustomDetail(field.id, 'label', e.target.value)
                      }
                      placeholder="Field label"
                      className="w-1/3 px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) =>
                        handleUpdateCustomDetail(field.id, 'value', e.target.value)
                      }
                      placeholder="Detail value"
                      className="flex-1 px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomDetail(field.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      aria-label={`Remove ${field.label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={newDetailLabel}
                onChange={(e) => setNewDetailLabel(e.target.value)}
                placeholder="New detail label (e.g., Mentor Name)"
                className="sm:w-1/3 px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
              />
              <input
                type="text"
                value={newDetailValue}
                onChange={(e) => setNewDetailValue(e.target.value)}
                placeholder="Detail value"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomDetail();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={handleAddCustomDetail}
                disabled={!newDetailLabel.trim() || !newDetailValue.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Detail</span>
              </button>
            </div>
          </section>

          {/* Notes */}
          <section className="pt-4 border-t border-slate-200">
            <label htmlFor="person-notes" className="block text-xs font-medium text-slate-700 mb-1.5">
              Administrative Notes
            </label>
            <textarea
              id="person-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Optional remarks about schedule, lab clearance, or device policy..."
              className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </section>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{isNew ? 'Save Person' : 'Update Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PersonDetailDrawerProps {
  person: PersonRecord | null;
  accessPoints: AccessPoint[];
  onClose: () => void;
  onEdit: (person: PersonRecord) => void;
  onDelete: (person: PersonRecord) => void;
  onToggleApForPerson: (personId: string, apId: string) => void;
  onCycleAccessStatus: (personId: string, status: AccessStatus) => void;
}

export function PersonDetailDrawer({
  person,
  accessPoints,
  onClose,
  onEdit,
  onDelete,
  onToggleApForPerson,
  onCycleAccessStatus,
}: PersonDetailDrawerProps) {
  if (!person) return null;

  const assignedAps = accessPoints.filter((ap) => person.assignedApIds.includes(ap.id));
  const unassignedAps = accessPoints.filter((ap) => !person.assignedApIds.includes(ap.id));

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-900/30"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${person.fullName}`}
    >
      <div className="w-full max-w-lg bg-white h-full border-l border-slate-200 shadow-xl flex flex-col">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center text-base font-semibold shrink-0 font-display">
              {getInitials(person.fullName)}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 break-words">
                {person.fullName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {person.role === 'student' ? 'Student' : 'Teacher'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{person.identifier}</span>
                <span aria-hidden="true">·</span>
                <span>{person.department}</span>
              </div>
              <div className="mt-2">
                <PersonAccessStatusLabel status={person.accessStatus} />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close profile panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Quick Status Control */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <span className="text-xs font-medium text-slate-600">Access Policy Status</span>
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
              {(['authorized', 'pending', 'suspended'] as AccessStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onCycleAccessStatus(person.id, st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                    person.accessStatus === st
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Contact & Hardware */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 tracking-wide">
              Contact & Registered Device
            </h3>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="text-slate-900 break-all">{person.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="text-slate-900 font-mono tabular-nums">
                  {person.phone || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Device MAC</dt>
                <dd className="text-slate-900 font-mono tabular-nums">
                  {person.deviceMac || 'Not registered'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Device Model</dt>
                <dd className="text-slate-900">{person.deviceLabel || '—'}</dd>
              </div>
            </dl>
          </section>

          {/* Role-Specific Details */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 tracking-wide">
              {person.role === 'student' ? 'Student Academic Details' : 'Teacher / Faculty Details'}
            </h3>
            {person.role === 'student' ? (
              <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Program</dt>
                  <dd className="text-slate-900">{person.studentDetails.program || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Year / Semester</dt>
                  <dd className="text-slate-900">{person.studentDetails.yearSemester || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Section / Batch</dt>
                  <dd className="text-slate-900">{person.studentDetails.sectionBatch || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Residence / Guardian</dt>
                  <dd className="text-slate-900">
                    {person.studentDetails.residenceOrGuardian || '—'}
                  </dd>
                </div>
              </dl>
            ) : (
              <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Designation</dt>
                  <dd className="text-slate-900">{person.teacherDetails.designation || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Office / Cabin</dt>
                  <dd className="text-slate-900">{person.teacherDetails.officeRoom || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Subjects / Labs</dt>
                  <dd className="text-slate-900">
                    {person.teacherDetails.subjectsTaught || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Privilege Tier</dt>
                  <dd className="text-slate-900">{person.teacherDetails.privilegeTier}</dd>
                </div>
              </dl>
            )}
          </section>

          {/* Custom Details */}
          {person.customDetails.length > 0 && (
            <section className="space-y-3 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 tracking-wide">
                Additional Details
              </h3>
              <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                {person.customDetails.map((field) => (
                  <div key={field.id}>
                    <dt className="text-xs text-slate-500">{field.label}</dt>
                    <dd className="text-slate-900 break-words">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Assigned Access Points */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-500 tracking-wide">
                Assigned Access Points ({assignedAps.length})
              </h3>
            </div>

            {assignedAps.length === 0 ? (
              <p className="text-sm text-slate-500">
                Not assigned to any access point yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {assignedAps.map((ap) => (
                  <div
                    key={ap.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <Wifi className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {ap.code} · {ap.name}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span>{ap.ssid}</span>
                        <span aria-hidden="true">·</span>
                        <span>VLAN {ap.vlanId}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleApForPerson(person.id, ap.id)}
                      className="px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}

            {unassignedAps.length > 0 && (
              <div className="pt-2">
                <label
                  htmlFor="quick-assign-ap"
                  className="block text-xs font-medium text-slate-600 mb-1.5"
                >
                  Grant Access to Another Point
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {unassignedAps.map((ap) => (
                    <button
                      key={ap.id}
                      type="button"
                      onClick={() => onToggleApForPerson(person.id, ap.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:border-blue-400 hover:text-blue-700 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{ap.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {person.notes && (
            <section className="space-y-1.5 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 tracking-wide">Notes</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{person.notes}</p>
            </section>
          )}

          <div className="pt-3 border-t border-slate-200 text-xs text-slate-400 font-mono tabular-nums">
            Last updated: {formatLocalDateTime(person.updatedAt)}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => onDelete(person)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove Person</span>
          </button>
          <button
            type="button"
            onClick={() => onEdit(person)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
