import React from 'react';
import './DataTable.css';

const DataTable = ({ columns, data, emptyMessage = 'Nenhum item encontrado.' }) => (
  <div className="adm-table-wrap">
    <table className="adm-table">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key} className="adm-th" style={col.style}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={columns.length} className="adm-td adm-td--empty">{emptyMessage}</td></tr>
        ) : (
          data.map((row, i) => (
            <tr key={row.id || i} className="adm-tr">
              {columns.map(col => (
                <td key={col.key} className="adm-td" style={col.style}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default DataTable;
