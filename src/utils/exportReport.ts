import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportColumn {
  header: string;
  key: string;
  format?: (value: any) => string;
  align?: 'left' | 'right' | 'center';
}

interface ExportOptions {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: any[];
  summaryRows?: { label: string; value: string }[];
}

export function exportPDF(options: ExportOptions) {
  const { title, subtitle, columns, data, summaryRows } = options;
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 28);
    doc.setTextColor(0);
  }

  let startY = subtitle ? 35 : 28;

  // Summary rows
  if (summaryRows && summaryRows.length > 0) {
    doc.setFontSize(10);
    for (const row of summaryRows) {
      doc.text(`${row.label}: ${row.value}`, 14, startY);
      startY += 6;
    }
    startY += 4;
  }

  // Table
  const headers = columns.map((c) => c.header);
  const body = data.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      return col.format ? col.format(val) : String(val ?? '-');
    })
  );

  autoTable(doc, {
    head: [headers],
    body,
    startY,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [14, 165, 233] },
    columnStyles: columns.reduce((acc, col, i) => {
      if (col.align === 'right') acc[i] = { halign: 'right' };
      return acc;
    }, {} as Record<number, any>),
  });

  // Footer
  const pageCount = (doc as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `TileTrade Pro - ${new Date().toLocaleDateString()} - Page ${i}/${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportExcel(options: ExportOptions) {
  const { title, columns, data, summaryRows } = options;

  const wsData: any[][] = [];

  // Title row
  wsData.push([title]);
  wsData.push([]);

  // Summary
  if (summaryRows) {
    for (const row of summaryRows) {
      wsData.push([row.label, row.value]);
    }
    wsData.push([]);
  }

  // Headers
  wsData.push(columns.map((c) => c.header));

  // Data rows
  for (const row of data) {
    wsData.push(
      columns.map((col) => {
        const val = row[col.key];
        return col.format ? col.format(val) : val ?? '';
      })
    );
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns
  const colWidths = columns.map((col) => {
    const headerLen = col.header.length;
    const maxDataLen = data.reduce((max, row) => {
      const val = col.format ? col.format(row[col.key]) : String(row[col.key] ?? '');
      return Math.max(max, val.length);
    }, 0);
    return { wch: Math.max(headerLen, maxDataLen, 10) + 2 };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
