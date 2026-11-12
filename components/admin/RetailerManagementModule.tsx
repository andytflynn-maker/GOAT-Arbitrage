"use client";

import { useMemo, useRef, useState } from 'react';
import RetailerEditorModal from '@/components/admin/RetailerEditorModal';
import RetailerManagementTable from '@/components/admin/RetailerManagementTable';
import type {
  RetailerConfiguration,
  RetailerConfigurationCreateInput,
} from '@/models/RetailerConfiguration';
import { RetailerConfigurationService } from '@/services/retailerConfigurationService';

function renderSummary(rows: RetailerConfiguration[]) {
  const enabledCount = rows.filter((row) => row.enabled).length;
  const disabledCount = rows.length - enabledCount;
  const maxPriority = rows.reduce((max, row) => Math.max(max, row.scanPriority), 0);

  const cards = [
    { label: 'Total Retailers', value: rows.length },
    { label: 'Enabled', value: enabledCount },
    { label: 'Disabled', value: disabledCount },
    { label: 'Max Priority', value: maxPriority },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
      {cards.map((card) => (
        <div key={card.label} style={{ background: '#0b1220', border: '1px solid #243347', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 8px 20px rgba(2, 6, 23, 0.18)' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', marginBottom: '6px' }}>{card.label}</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function RetailerManagementModule() {
  const serviceRef = useRef(new RetailerConfigurationService());
  const [rows, setRows] = useState<RetailerConfiguration[]>(() => serviceRef.current.list());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<RetailerConfiguration | null>(null);
  const [detailsMode, setDetailsMode] = useState<'edit' | 'adapter' | 'configuration' | null>(null);

  const sortedRows = useMemo(
    () => [...rows].sort((left, right) => left.scanPriority - right.scanPriority || left.retailerName.localeCompare(right.retailerName)),
    [rows],
  );

  const detailsTitle = (() => {
    if (!selectedRetailer || !detailsMode) {
      return null;
    }

    if (detailsMode === 'edit') {
      return `Edit ${selectedRetailer.retailerName}`;
    }
    if (detailsMode === 'adapter') {
      return `${selectedRetailer.retailerName} Adapter Details`;
    }

    return `${selectedRetailer.retailerName} Configuration`;
  })();

  const detailsBody = (() => {
    if (!selectedRetailer || !detailsMode) {
      return null;
    }

    if (detailsMode === 'edit') {
      return {
        description: 'Editing workflows are prepared via service methods. Persistence is intentionally not implemented.',
        payload: {
          retailerId: selectedRetailer.retailerId,
          modifiedDate: selectedRetailer.modifiedDate,
          notes: selectedRetailer.notes,
        },
      };
    }

    if (detailsMode === 'adapter') {
      return {
        description: 'Adapter metadata view sourced from RetailerConfiguration.',
        payload: {
          retailerId: selectedRetailer.retailerId,
          adapterStatus: selectedRetailer.adapterStatus,
          adapterVersion: selectedRetailer.adapterVersion,
          dataSourceType: selectedRetailer.dataSourceType,
          supportsAuthentication: selectedRetailer.supportsAuthentication,
          authenticationType: selectedRetailer.authenticationType,
        },
      };
    }

    return {
      description: 'Full in-memory retailer configuration object.',
      payload: selectedRetailer,
    };
  })();

  const selectRetailer = (retailerId: string, mode: 'edit' | 'adapter' | 'configuration') => {
    const found = serviceRef.current.getById(retailerId);
    setSelectedRetailer(found);
    setDetailsMode(mode);
  };

  const handleToggleEnabled = (retailerId: string) => {
    serviceRef.current.toggleEnabled(retailerId);
    setRows(serviceRef.current.list());

    if (selectedRetailer?.retailerId === retailerId) {
      const refreshed = serviceRef.current.getById(retailerId);
      setSelectedRetailer(refreshed);
    }
  };

  const handleAddRetailer = (input: RetailerConfigurationCreateInput) => {
    serviceRef.current.add(input);
    setRows(serviceRef.current.list());
  };

  return (
    <main className="page-shell" style={{ gap: '24px' }}>
      <section className="hero-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <p className="eyebrow">GOAT Admin</p>
        <h1 style={{ marginBottom: '12px' }}>Retailer Management</h1>
        <p className="subtitle" style={{ maxWidth: '760px', margin: '0 auto' }}>
          Central management module for retailer configuration, adapter status, and scanning policy controls.
        </p>
      </section>

      <section className="dashboard-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div style={{ color: '#cbd5e1' }}>
            Configure data sources, capabilities, and scan priorities without changing runtime scan behavior.
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            style={{
              borderRadius: '999px',
              border: '1px solid #2563eb',
              background: '#1d4ed8',
              color: '#f8fafc',
              fontWeight: 700,
              fontSize: '13px',
              padding: '8px 14px',
              cursor: 'pointer',
            }}
          >
            Add Retailer
          </button>
        </div>

        {renderSummary(sortedRows)}

        <RetailerManagementTable
          rows={sortedRows}
          onEdit={(retailerId) => selectRetailer(retailerId, 'edit')}
          onToggleEnabled={handleToggleEnabled}
          onViewAdapter={(retailerId) => selectRetailer(retailerId, 'adapter')}
          onViewConfiguration={(retailerId) => selectRetailer(retailerId, 'configuration')}
        />
      </section>

      {detailsTitle && detailsBody ? (
        <section className="dashboard-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '8px' }}>
            {detailsTitle}
          </div>
          <p style={{ color: '#cbd5e1', marginTop: 0, marginBottom: '10px' }}>{detailsBody.description}</p>
          <pre
            style={{
              margin: 0,
              borderRadius: '12px',
              border: '1px solid #243347',
              background: '#0b1220',
              color: '#e2e8f0',
              padding: '12px',
              overflowX: 'auto',
              fontSize: '12px',
              lineHeight: 1.45,
            }}
          >
            {JSON.stringify(detailsBody.payload, null, 2)}
          </pre>
        </section>
      ) : null}

      <RetailerEditorModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAddRetailer}
      />
    </main>
  );
}
