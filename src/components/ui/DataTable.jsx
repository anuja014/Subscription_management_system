// src/components/ui/DataTable.jsx
import { useState } from 'react';

export function DataTable({ columns, data, loading = false, emptyMessage = 'No records found', pageSize = 20, className }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  let sorted = data;
  if (sort.key) {
    sorted = [...data].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = sorted.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div className="table-wrap ${className || ''}">
        <div className="empty-state">
          <div className="skeleton" style={{ height: 120, width: '60%', margin: '0 auto' }} />
          <div className="skeleton" style={{ height: 20, width: '80%', margin: '20px auto' }} />
        </div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="table-wrap ${className || ''}">
        <div className="empty-state">
          <h3>{emptyMessage}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={`table-wrap ${className || ''}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} onClick={() => setSort({ key: col.key, dir: sort.key === col.key ? (sort.dir === 'asc' ? 'desc' : 'asc') : 'asc' })}>
                {col.label}
                {sort.key === col.key && (sort.dir === 'asc' ? ' ▲' : ' ▼')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {current.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.key} data-label={col.label}>
                  {typeof col.render === 'function' ? col.render(row, col.key) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="row justify-center gap-2 mb-4">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span className="text-muted">Page {page} of {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
