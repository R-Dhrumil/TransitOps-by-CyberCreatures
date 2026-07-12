/**
 * pdfExport.js — Reusable PDF generation utilities for TransitOps
 * Uses jsPDF + jspdf-autotable for professional table-based reports.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ── Brand colors (dark-mode palette) ──────────────────────── */
const BRAND = {
  dark:    [11,  16,  21],   // #0B1015  bg-primary
  surface: [28,  27,  28],   // #1C1B1C  card
  border:  [68,  71,  74],   // #44474A  border
  text:    [229, 226, 226],  // #E5E2E2  on-surface
  muted:   [143, 145, 149],  // #8F9195  muted
  brand:   [194, 199, 206],  // #C2C7CE  primary
  success: [52,  211, 153],  // #34D399  emerald
  warning: [251, 191, 36],   // #FBBF24  amber
  danger:  [255, 180, 171],  // #FFB4AB  error
  info:    [59,  130, 246],  // #3B82F6  azure
};

/**
 * Creates a new jsPDF doc with the TransitOps header already painted.
 * @param {string} title    — Large report title text
 * @param {string} subtitle — Smaller subtitle / date range
 * @returns {{ doc: jsPDF, startY: number }}
 */
function createDoc(title, subtitle = '') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ── Dark header band ─────────────────────────────────────
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, 0, 297, 28, 'F');

  // ── Brand accent bar ──────────────────────────────────────
  doc.setFillColor(...BRAND.brand);
  doc.rect(0, 28, 297, 1.5, 'F');

  // ── Logo text ─────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.brand);
  doc.text('TransitOps', 14, 13);

  // ── Report title ──────────────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.text);
  doc.text(title, 14, 21);

  // ── Subtitle / right side ─────────────────────────────────
  const now = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short',
  });
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Generated: ${now}`, 297 - 14, 13, { align: 'right' });
  if (subtitle) doc.text(subtitle, 297 - 14, 20, { align: 'right' });

  return { doc, startY: 36 };
}

/**
 * Draws the footer (page number) on every page.
 */
function addFooter(doc) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `TransitOps — Confidential  |  Page ${i} of ${pageCount}`,
      297 / 2, 205, { align: 'center' }
    );
    // Bottom line
    doc.setDrawColor(...BRAND.border);
    doc.line(14, 203, 283, 203);
  }
}

/** Shared autoTable theme config */
const TABLE_STYLES = {
  theme: 'plain',
  styles: {
    font: 'helvetica',
    fontSize: 8.5,
    cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    textColor: BRAND.text,
    lineColor: BRAND.border,
    lineWidth: 0.2,
    fillColor: BRAND.surface,
  },
  headStyles: {
    fillColor: BRAND.dark,
    textColor: BRAND.muted,
    fontStyle: 'bold',
    fontSize: 7.5,
    lineWidth: 0,
  },
  alternateRowStyles: { fillColor: [20, 20, 21] },
  tableLineColor: BRAND.border,
  tableLineWidth: 0.3,
};

/* ══════════════════════════════════════════════════════════════
   EXPORT FUNCTIONS
   ══════════════════════════════════════════════════════════════ */

/**
 * exportDriversPDF(drivers)
 * Generates a Driver Roster PDF with safety scores color-coded.
 */
export function exportDriversPDF(drivers = []) {
  const { doc, startY } = createDoc('Driver Roster Report', `${drivers.length} drivers`);

  autoTable(doc, {
    ...TABLE_STYLES,
    startY,
    head: [['Name', 'License No.', 'Category', 'Expiry', 'Safety Score', 'Contact', 'Status']],
    body: drivers.map((d) => [
      d.name,
      d.license_number,
      d.license_category,
      d.license_expiry_date ? new Date(d.license_expiry_date).toLocaleDateString('en-IN') : '—',
      d.safety_score != null ? `${d.safety_score}/100` : '—',
      d.contact_number || '—',
      d.status || '—',
    ]),
    didParseCell: (data) => {
      // Color-code safety score column
      if (data.section === 'body' && data.column.index === 4) {
        const val = drivers[data.row.index]?.safety_score;
        if (val >= 90) data.cell.styles.textColor = BRAND.success;
        else if (val >= 70) data.cell.styles.textColor = BRAND.warning;
        else if (val != null) data.cell.styles.textColor = BRAND.danger;
      }
      // Color-code status column
      if (data.section === 'body' && data.column.index === 6) {
        const status = data.cell.raw;
        if (status === 'Available') data.cell.styles.textColor = BRAND.success;
        else if (status === 'On Trip') data.cell.styles.textColor = BRAND.info;
        else if (status === 'Suspended' || status === 'Retired') data.cell.styles.textColor = BRAND.danger;
        else data.cell.styles.textColor = BRAND.warning;
      }
      // Color-code expiry column
      if (data.section === 'body' && data.column.index === 3) {
        const raw = drivers[data.row.index]?.license_expiry_date;
        if (raw && new Date(raw) < new Date()) data.cell.styles.textColor = BRAND.danger;
      }
    },
  });

  addFooter(doc);
  doc.save(`transitops_drivers_${Date.now()}.pdf`);
}

/**
 * exportTripsPDF(trips)
 * Generates a Trip Log PDF.
 */
export function exportTripsPDF(trips = []) {
  const { doc, startY } = createDoc('Trip Log Report', `${trips.length} trips`);

  autoTable(doc, {
    ...TABLE_STYLES,
    startY,
    head: [['Trip #', 'Status', 'Source', 'Destination', 'Driver', 'Vehicle', 'Cargo (lbs)', 'Distance (mi)']],
    body: trips.map((t) => [
      t.trip_number || t.id?.split('-')[0]?.toUpperCase() || '—',
      t.status || '—',
      t.source || '—',
      t.destination || '—',
      t.driver_name || '—',
      t.registration_number || '—',
      t.cargo_weight != null ? Number(t.cargo_weight).toLocaleString() : '—',
      t.planned_distance != null ? Number(t.planned_distance).toLocaleString() : '—',
    ]),
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const status = data.cell.raw;
        if (status === 'Completed') data.cell.styles.textColor = BRAND.success;
        else if (status === 'Dispatched') data.cell.styles.textColor = BRAND.info;
        else if (status === 'Cancelled') data.cell.styles.textColor = BRAND.danger;
        else data.cell.styles.textColor = BRAND.warning;
      }
    },
  });

  addFooter(doc);
  doc.save(`transitops_trips_${Date.now()}.pdf`);
}

/**
 * exportFuelEfficiencyPDF(data)
 * Generates a Fuel Efficiency report PDF.
 */
export function exportFuelEfficiencyPDF(data = []) {
  const { doc, startY } = createDoc('Fuel Efficiency Report');

  autoTable(doc, {
    ...TABLE_STYLES,
    startY,
    head: [['Vehicle', 'Model', 'Total Distance (km)', 'Total Fuel (L)', 'Efficiency (km/L)']],
    body: data.map((r) => [
      r.registration_number,
      r.name_model || '—',
      Number(r.total_distance_km || 0).toLocaleString(),
      Number(r.total_fuel_liters || 0).toLocaleString(),
      r.km_per_liter ?? '—',
    ]),
    didParseCell: (data2) => {
      if (data2.section === 'body' && data2.column.index === 4) {
        const val = parseFloat(data2.cell.raw);
        if (!isNaN(val)) {
          if (val >= 15) data2.cell.styles.textColor = BRAND.success;
          else if (val >= 10) data2.cell.styles.textColor = BRAND.warning;
          else data2.cell.styles.textColor = BRAND.danger;
        }
      }
    },
  });

  addFooter(doc);
  doc.save(`transitops_fuel_efficiency_${Date.now()}.pdf`);
}

/**
 * exportUtilizationPDF(data)
 */
export function exportUtilizationPDF(data = []) {
  const { doc, startY } = createDoc('Fleet Utilization Report');

  autoTable(doc, {
    ...TABLE_STYLES,
    startY,
    head: [['Vehicle', 'Model', 'Completed Trips', 'Active Trips', 'Total Trips']],
    body: data.map((r) => [
      r.registration_number,
      r.name_model || '—',
      r.completed_trips ?? 0,
      r.active_trips ?? 0,
      (Number(r.completed_trips || 0) + Number(r.active_trips || 0)),
    ]),
  });

  addFooter(doc);
  doc.save(`transitops_utilization_${Date.now()}.pdf`);
}

/**
 * exportCostPDF(data)
 */
export function exportCostPDF(data = []) {
  const { doc, startY } = createDoc('Cost Breakdown Report');

  autoTable(doc, {
    ...TABLE_STYLES,
    startY,
    head: [['Vehicle', 'Model', 'Fuel Cost (₹)', 'Maintenance Cost (₹)', 'Total Operating Cost (₹)']],
    body: data.map((r) => [
      r.registration_number,
      r.name_model || '—',
      `₹${Number(r.total_fuel_cost || 0).toLocaleString('en-IN')}`,
      `₹${Number(r.total_maintenance_cost || 0).toLocaleString('en-IN')}`,
      `₹${Number(r.total_operating_cost || 0).toLocaleString('en-IN')}`,
    ]),
    didParseCell: (data2) => {
      if (data2.section === 'body' && data2.column.index === 4) {
        data2.cell.styles.fontStyle = 'bold';
        data2.cell.styles.textColor = BRAND.brand;
      }
    },
  });

  addFooter(doc);
  doc.save(`transitops_cost_${Date.now()}.pdf`);
}

/**
 * exportRoiPDF(data)
 */
export function exportRoiPDF(data = []) {
  const { doc, startY } = createDoc('ROI Analysis Report');

  autoTable(doc, {
    ...TABLE_STYLES,
    startY,
    head: [['Vehicle', 'Model', 'Acquisition Cost (₹)', 'Total Operating Cost (₹)', 'Cost/Acquisition %']],
    body: data.map((r) => [
      r.registration_number,
      r.name_model || '—',
      `₹${Number(r.acquisition_cost || 0).toLocaleString('en-IN')}`,
      `₹${Number(r.total_cost || 0).toLocaleString('en-IN')}`,
      `${r.cost_to_acquisition_pct ?? 0}%`,
    ]),
    didParseCell: (data2) => {
      if (data2.section === 'body' && data2.column.index === 4) {
        const val = parseFloat(data2.cell.raw);
        if (!isNaN(val)) {
          if (val > 50) data2.cell.styles.textColor = BRAND.danger;
          else if (val > 20) data2.cell.styles.textColor = BRAND.warning;
          else data2.cell.styles.textColor = BRAND.success;
        }
      }
    },
  });

  addFooter(doc);
  doc.save(`transitops_roi_${Date.now()}.pdf`);
}
