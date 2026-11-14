import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import {
  AccessPoint,
  AccessPointStatus,
  FrequencyBand,
  SecurityProtocol,
} from '../types/access';
import { formatMacInput, isValidIp, isValidMac } from '../data/seedData';

interface AccessPointModalProps {
  isOpen: boolean;
  initialAp: AccessPoint | null;
  onClose: () => void;
  onSave: (ap: AccessPoint, isNew: boolean) => void;
}

function createBlankAp(): AccessPoint {
  return {
    id: `ap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    code: '',
    name: '',
    ssid: 'CampusNet-Academic',
    bssid: '',
    ipAddress: '',
    vlanId: 20,
    building: '',
    floorRoom: '',
    band: 'Dual-Band (2.4 / 5 GHz)',
    security: 'WPA3-Enterprise',
    maxClients: 50,
    status: 'online',
    notes: '',
    updatedAt: new Date().toISOString(),
  };
}

export function AccessPointModal({
  isOpen,
  initialAp,
  onClose,
  onSave,
}: AccessPointModalProps) {
  const isNew = !initialAp;
  const [form, setForm] = useState<AccessPoint>(() => createBlankAp());
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(initialAp ? { ...initialAp } : createBlankAp());
      setErrorMsg('');
    }
  }, [isOpen, initialAp]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      setErrorMsg('Access point code and name are required.');
      return;
    }
    if (!form.ssid.trim()) {
      setErrorMsg('SSID network name is required.');
      return;
    }
    if (form.bssid.trim() && !isValidMac(form.bssid)) {
      setErrorMsg('BSSID / MAC address must follow XX:XX:XX:XX:XX:XX format.');
      return;
    }
    if (form.ipAddress.trim() && !isValidIp(form.ipAddress)) {
      setErrorMsg('IPv4 address must be valid (e.g., 10.24.12.11).');
      return;
    }
    if (form.maxClients < 1 || form.maxClients > 500) {
      setErrorMsg('Max client capacity must be between 1 and 500.');
      return;
    }

    onSave(
      {
        ...form,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        ssid: form.ssid.trim(),
        bssid: form.bssid.trim().toUpperCase(),
        ipAddress: form.ipAddress.trim(),
        building: form.building.trim() || 'Main Campus',
        floorRoom: form.floorRoom.trim() || 'Unassigned Room',
        notes: form.notes.trim(),
        updatedAt: new Date().toISOString(),
      },
      isNew
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ap-modal-title"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2 id="ap-modal-title" className="text-base font-semibold text-slate-900">
              {isNew ? 'Register New Access Point' : `Edit ${initialAp?.code}`}
            </h2>
            <p className="text-xs text-slate-500">
              Configure network parameters, physical location, and client capacity.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[78vh] overflow-y-auto px-6 py-5 space-y-5">
          {errorMsg && (
            <div
              role="alert"
              className="px-4 py-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg"
            >
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ap-code" className="block text-xs font-medium text-slate-700 mb-1.5">
                AP Code <span className="text-red-600">*</span>
              </label>
              <input
                id="ap-code"
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="e.g., AP-CSE-01"
                className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ap-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                Location / Display Name <span className="text-red-600">*</span>
              </label>
              <input
                id="ap-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Systems & Networking Lab North"
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ap-ssid" className="block text-xs font-medium text-slate-700 mb-1.5">
                SSID <span className="text-red-600">*</span>
              </label>
              <input
                id="ap-ssid"
                type="text"
                required
                value={form.ssid}
                onChange={(e) => setForm((p) => ({ ...p, ssid: e.target.value }))}
                placeholder="CampusNet-Lab"
                className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ap-bssid" className="block text-xs font-medium text-slate-700 mb-1.5">
                BSSID / Hardware MAC
              </label>
              <input
                id="ap-bssid"
                type="text"
                value={form.bssid}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bssid: formatMacInput(e.target.value) }))
                }
                placeholder="A4:2B:8C:11:4E:10"
                className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ap-ip" className="block text-xs font-medium text-slate-700 mb-1.5">
                Management IPv4
              </label>
              <input
                id="ap-ip"
                type="text"
                value={form.ipAddress}
                onChange={(e) => setForm((p) => ({ ...p, ipAddress: e.target.value }))}
                placeholder="10.24.12.11"
                className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ap-vlan" className="block text-xs font-medium text-slate-700 mb-1.5">
                VLAN ID
              </label>
              <input
                id="ap-vlan"
                type="number"
                min={1}
                max={4094}
                value={form.vlanId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, vlanId: Number(e.target.value) || 1 }))
                }
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ap-building" className="block text-xs font-medium text-slate-700 mb-1.5">
                Building / Block
              </label>
              <input
                id="ap-building"
                type="text"
                value={form.building}
                onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))}
                placeholder="e.g., Academic Block A"
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ap-floor" className="block text-xs font-medium text-slate-700 mb-1.5">
                Floor / Room
              </label>
              <input
                id="ap-floor"
                type="text"
                value={form.floorRoom}
                onChange={(e) => setForm((p) => ({ ...p, floorRoom: e.target.value }))}
                placeholder="e.g., 2nd Floor · Room 204"
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ap-band" className="block text-xs font-medium text-slate-700 mb-1.5">
                Radio Band
              </label>
              <select
                id="ap-band"
                value={form.band}
                onChange={(e) =>
                  setForm((p) => ({ ...p, band: e.target.value as FrequencyBand }))
                }
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Dual-Band (2.4 / 5 GHz)">Dual-Band (2.4 / 5 GHz)</option>
                <option value="5 GHz High-Density">5 GHz High-Density</option>
                <option value="2.4 GHz Long-Range">2.4 GHz Long-Range</option>
                <option value="6 GHz Wi-Fi 6E">6 GHz Wi-Fi 6E</option>
              </select>
            </div>

            <div>
              <label htmlFor="ap-security" className="block text-xs font-medium text-slate-700 mb-1.5">
                Security Protocol
              </label>
              <select
                id="ap-security"
                value={form.security}
                onChange={(e) =>
                  setForm((p) => ({ ...p, security: e.target.value as SecurityProtocol }))
                }
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="WPA3-Enterprise">WPA3-Enterprise</option>
                <option value="WPA2-Enterprise">WPA2-Enterprise</option>
                <option value="WPA2-PSK + MAC Filter">WPA2-PSK + MAC Filter</option>
              </select>
            </div>

            <div>
              <label htmlFor="ap-capacity" className="block text-xs font-medium text-slate-700 mb-1.5">
                Max Client Capacity
              </label>
              <input
                id="ap-capacity"
                type="number"
                min={1}
                max={500}
                value={form.maxClients}
                onChange={(e) =>
                  setForm((p) => ({ ...p, maxClients: Number(e.target.value) || 1 }))
                }
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ap-status" className="block text-xs font-medium text-slate-700 mb-1.5">
                Operational Status
              </label>
              <select
                id="ap-status"
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as AccessPointStatus }))
                }
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="online">Online</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ap-notes" className="block text-xs font-medium text-slate-700 mb-1.5">
              Deployment Notes
            </label>
            <textarea
              id="ap-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Switch port, PoE injector details, or coverage zone notes..."
              className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

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
              <span>{isNew ? 'Create Access Point' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
