import { useState } from 'react';
import { Search } from 'lucide-react';
import { AuditCategory, AuditEntry } from '../types/access';
import { formatLocalDateTime } from '../data/seedData';

interface AuditLogViewProps {
  entries: AuditEntry[];
}

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  access_point: 'Access Point',
  directory: 'Directory',
  assignment: 'Assignment',
  backup: 'Backup / Restore',
};

export function AuditLogView({ entries }: AuditLogViewProps) {
  const [category, setCategory] = useState<'all' | AuditCategory>('all');
  const [query, setQuery] = useState('');

  const filtered = entries.filter((item) => {
    const matchesCat = category === 'all' || item.category === category;
    const q = query.trim().toLowerCase();
    const matchesQ = !q || item.summary.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audit history..."
            className="w-full pl-9 pr-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          {(['all', 'access_point', 'directory', 'assignment', 'backup'] as const).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  category === cat
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'All Events' : CATEGORY_LABELS[cat]}
              </button>
            )
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No matching activity events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-600 w-44">
                    Timestamp
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-600 w-36">
                    Category
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-600">
                    Action Summary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {formatLocalDateTime(entry.timestamp)}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {CATEGORY_LABELS[entry.category]}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900">{entry.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
