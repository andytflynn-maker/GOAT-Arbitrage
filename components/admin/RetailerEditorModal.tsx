"use client";

import { useEffect, useState } from 'react';
import type {
  RetailerConfigurationCreateInput,
  RetailerDataSourceType,
} from '@/models/RetailerConfiguration';

interface RetailerEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: RetailerConfigurationCreateInput) => void;
}

type FormState = RetailerConfigurationCreateInput;

const SOURCE_OPTIONS: RetailerDataSourceType[] = [
  'approved-api',
  'licensed-provider',
  'merchant-feed',
  'manual',
  'disabled',
];

const INITIAL_FORM: FormState = {
  retailerName: '',
  website: '',
  dataSourceType: 'manual',
  searchUrlTemplate: '',
  productUrlTemplate: '',
  scanPriority: 5,
  notes: '',
};

export default function RetailerEditorModal({ isOpen, onClose, onSave }: RetailerEditorModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  useEffect(() => {
    if (!isOpen) {
      setForm(INITIAL_FORM);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const canSave =
    form.retailerName.trim().length > 0
    && form.website.trim().length > 0
    && form.searchUrlTemplate.trim().length > 0
    && form.productUrlTemplate.trim().length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.72)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 40,
        padding: '20px',
      }}
    >
      <div
        style={{
          width: 'min(720px, 100%)',
          background: '#0b1220',
          border: '1px solid #243347',
          borderRadius: '16px',
          boxShadow: '0 24px 70px rgba(2, 6, 23, 0.5)',
          padding: '18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px' }}>Add Retailer</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: '999px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#cbd5e1',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px' }}>
            Retailer Name
            <input
              value={form.retailerName}
              onChange={(event) => setForm((prev) => ({ ...prev, retailerName: event.target.value }))}
              style={{ borderRadius: '10px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '10px 12px' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px' }}>
            Website
            <input
              value={form.website}
              onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
              placeholder="https://www.example.com"
              style={{ borderRadius: '10px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '10px 12px' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px' }}>
            Data Source
            <select
              value={form.dataSourceType}
              onChange={(event) => setForm((prev) => ({ ...prev, dataSourceType: event.target.value as RetailerDataSourceType }))}
              style={{ borderRadius: '10px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '10px 12px' }}
            >
              {SOURCE_OPTIONS.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px' }}>
            Priority
            <input
              type="number"
              min={1}
              max={100}
              value={form.scanPriority}
              onChange={(event) => setForm((prev) => ({ ...prev, scanPriority: Number(event.target.value) || 1 }))}
              style={{ borderRadius: '10px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '10px 12px' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px', gridColumn: '1 / -1' }}>
            Search URL Template
            <input
              value={form.searchUrlTemplate}
              onChange={(event) => setForm((prev) => ({ ...prev, searchUrlTemplate: event.target.value }))}
              placeholder="https://site.com/search?q={query}"
              style={{ borderRadius: '10px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '10px 12px' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px', gridColumn: '1 / -1' }}>
            Product URL Template
            <input
              value={form.productUrlTemplate}
              onChange={(event) => setForm((prev) => ({ ...prev, productUrlTemplate: event.target.value }))}
              placeholder="https://site.com/product/{id}"
              style={{ borderRadius: '10px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '10px 12px' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px', gridColumn: '1 / -1' }}>
            Notes
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              style={{ borderRadius: '10px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '10px 12px', resize: 'vertical' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: '999px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#cbd5e1',
              padding: '8px 14px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) {
                return;
              }
              onSave(form);
              onClose();
            }}
            style={{
              borderRadius: '999px',
              border: '1px solid #2563eb',
              background: canSave ? '#1d4ed8' : '#1e293b',
              color: '#f8fafc',
              padding: '8px 14px',
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontWeight: 700,
            }}
          >
            Save Retailer
          </button>
        </div>
      </div>
    </div>
  );
}
