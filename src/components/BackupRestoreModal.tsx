import React, { useRef, useState } from 'react';
import { Download, RotateCcw, Upload, X } from 'lucide-react';
import { CampusState } from '../types/access';

interface BackupRestoreModalProps {
  isOpen: boolean;
  state: CampusState;
  onClose: () => void;
  onImportState: (imported: CampusState) => void;
  onResetSample: () => void;
}

function escapeCsv(val: string | number): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function BackupRestoreModal({
  isOpen,
  state,
  onClose,
  onImportState,
  onResetSample,
}: BackupRestoreModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(
      JSON.stringify(state, null, 2),
      `campusgate-backup-${stamp}.json`,
      'application/json'
    );
    setFeedback({ type: 'success', text: 'Full offline JSON backup downloaded.' });
  };

  const handleExportPeopleCsv = () => {
    const headers = [
      'Full Name',
      'Role',
      'Identifier',
      'Department',
      'Email',
      'Phone',
      'Device MAC',
      'Device Model',
      'Access Status',
      'Assigned AP Codes',
      'Role Details',
      'Custom Details',
    ];
    const apById = new Map(state.accessPoints.map((ap) => [ap.id, ap.code]));
    const rows = state.people.map((p) => {
      const apCodes = p.assignedApIds.map((id) => apById.get(id) ?? id).join('; ');
      const roleDetail =
        p.role === 'student'
          ? `${p.studentDetails.program} | ${p.studentDetails.yearSemester} | ${p.studentDetails.sectionBatch}`
          : `${p.teacherDetails.designation} | ${p.teacherDetails.officeRoom} | ${p.teacherDetails.privilegeTier}`;
      const custom = p.customDetails.map((d) => `${d.label}: ${d.value}`).join('; ');
      return [
        p.fullName,
        p.role,
        p.identifier,
        p.department,
        p.email,
        p.phone,
        p.deviceMac,
        p.deviceLabel,
        p.accessStatus,
        apCodes,
        roleDetail,
        custom,
      ]
        .map(escapeCsv)
        .join(',');
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(
      [headers.join(','), ...rows].join('\n'),
      `campusgate-people-${stamp}.csv`,
      'text/csv;charset=utf-8'
    );
    setFeedback({ type: 'success', text: 'Students & Teachers directory exported as CSV.' });
  };

  const handleExportApsCsv = () => {
    const headers = [
      'Code',
      'Name',
      'SSID',
      'BSSID',
      'IP Address',
      'VLAN ID',
      'Building',
      'Floor/Room',
      'Band',
      'Security',
      'Max Clients',
      'Status',
    ];
    const rows = state.accessPoints.map((ap) =>
      [
        ap.code,
        ap.name,
        ap.ssid,
        ap.bssid,
        ap.ipAddress,
        ap.vlanId,
        ap.building,
        ap.floorRoom,
        ap.band,
        ap.security,
        ap.maxClients,
        ap.status,
      ]
        .map(escapeCsv)
        .join(',')
    );
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(
      [headers.join(','), ...rows].join('\n'),
      `campusgate-access-points-${stamp}.csv`,
      'text/csv;charset=utf-8'
    );
    setFeedback({ type: 'success', text: 'Access Points inventory exported as CSV.' });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<CampusState>;
      if (!Array.isArray(parsed.accessPoints) || !Array.isArray(parsed.people)) {
        setFeedback({
          type: 'error',
          text: 'Invalid backup file. Must contain accessPoints and people arrays.',
        });
        return;
      }
      onImportState({
        accessPoints: parsed.accessPoints,
        people: parsed.people,
        auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      });
      setFeedback({
        type: 'success',
        text: `Imported ${parsed.accessPoints.length} access points and ${parsed.people.length} people.`,
      });
    } catch {
      setFeedback({
        type: 'error',
        text: 'Could not read JSON file. Please verify it is a valid CampusGate backup.',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2 id="backup-modal-title" className="text-base font-semibold text-slate-900">
              Offline Backup & Data Transfer
            </h2>
            <p className="text-xs text-slate-500">
              All records are stored locally in this browser. Export files to share or safeguard data offline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
            aria-label="Close backup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {feedback && (
            <div
              role="status"
              className={`px-4 py-2.5 text-xs font-medium rounded-lg border ${
                feedback.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-500 tracking-wide">
              Export Local Data
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 transition-colors"
              >
                <span>Full Snapshot Backup (.json)</span>
                <Download className="w-4 h-4 text-slate-500" />
              </button>
              <button
                type="button"
                onClick={handleExportPeopleCsv}
                className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 transition-colors"
              >
                <span>Students & Teachers Directory (.csv)</span>
                <Download className="w-4 h-4 text-slate-500" />
              </button>
              <button
                type="button"
                onClick={handleExportApsCsv}
                className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 transition-colors"
              >
                <span>Access Points Inventory (.csv)</span>
                <Download className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-500 tracking-wide">
              Restore from Backup
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
              id="restore-json-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-dashed border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Backup JSON File</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-red-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Dataset</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-700 font-medium">Overwrite current data?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetSample();
                    setConfirmReset(false);
                    setFeedback({ type: 'success', text: 'Restored default campus dataset.' });
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
