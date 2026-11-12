"use client";

import { useMemo, useState } from 'react';
import { disabledRetailers, registeredRetailers } from '@/marketplaces/registry';
import type { RetailerAdapter } from '@/marketplaces/retailerAdapter';
import { AdapterTestRunner } from '@/services/adapterTestRunner';
import type { AdapterTestResult, AdapterTestStatus } from '@/types/adapterTesting';
import BlowoutPipelineHarness from '@/components/admin/BlowoutPipelineHarness';

interface AdapterOption {
  id: string;
  adapter: RetailerAdapter;
  name: string;
  isDisabled: boolean;
}

const testRunner = new AdapterTestRunner();

function statusTone(status: AdapterTestStatus): { bg: string; color: string; border: string } {
  if (status === 'passed') {
    return {
      bg: 'rgba(34, 197, 94, 0.18)',
      color: '#bbf7d0',
      border: '1px solid rgba(74, 222, 128, 0.45)',
    };
  }

  if (status === 'failed') {
    return {
      bg: 'rgba(248, 113, 113, 0.18)',
      color: '#fecaca',
      border: '1px solid rgba(248, 113, 113, 0.45)',
    };
  }

  if (status === 'running') {
    return {
      bg: 'rgba(250, 204, 21, 0.18)',
      color: '#fde68a',
      border: '1px solid rgba(250, 204, 21, 0.45)',
    };
  }

  return {
    bg: 'rgba(148, 163, 184, 0.18)',
    color: '#cbd5e1',
    border: '1px solid rgba(148, 163, 184, 0.4)',
  };
}

function stepTone(status: 'passed' | 'failed'): { bg: string; color: string; border: string } {
  if (status === 'passed') {
    return {
      bg: 'rgba(34, 197, 94, 0.18)',
      color: '#bbf7d0',
      border: '1px solid rgba(74, 222, 128, 0.45)',
    };
  }

  return {
    bg: 'rgba(248, 113, 113, 0.18)',
    color: '#fecaca',
    border: '1px solid rgba(248, 113, 113, 0.45)',
  };
}

function makeAdapterId(name: string, group: 'active' | 'disabled'): string {
  return `${group}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export default function RetailerAdapterTestFramework() {
  const options = useMemo<AdapterOption[]>(() => {
    const active = registeredRetailers.map((adapter) => ({
      id: makeAdapterId(adapter.getRetailerName(), 'active'),
      adapter,
      name: adapter.getRetailerName(),
      isDisabled: false,
    }));

    const disabled = disabledRetailers.map((adapter) => ({
      id: makeAdapterId(adapter.getRetailerName(), 'disabled'),
      adapter,
      name: adapter.getRetailerName(),
      isDisabled: true,
    }));

    return [...active, ...disabled];
  }, []);

  const [selectedAdapterId, setSelectedAdapterId] = useState(options[0]?.id ?? '');
  const [query, setQuery] = useState('2025 Topps Chrome Baseball Hobby Box');
  const [status, setStatus] = useState<AdapterTestStatus>('idle');
  const [result, setResult] = useState<AdapterTestResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const selectedOption = options.find((option) => option.id === selectedAdapterId) ?? null;
  const selectedAdapterSource = selectedOption?.adapter.adapterSource ?? 'unknown';

  const runTest = async () => {
    if (!selectedOption) {
      return;
    }

    setStatus('running');
    setResult(null);
    setRunError(null);

    try {
      const nextResult = await testRunner.run(selectedOption.adapter, query.trim());
      setResult(nextResult);
      setStatus(nextResult.status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error while running adapter test.';
      setStatus('failed');
      setRunError(message);
    }
  };

  const currentTone = statusTone(status);

  return (
    <main className="page-shell" style={{ gap: '24px' }}>
      <section className="hero-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <p className="eyebrow">GOAT Admin</p>
        <h1 style={{ marginBottom: '12px' }}>Retailer Adapter Testing Framework</h1>
        <p className="subtitle" style={{ maxWidth: '780px', margin: '0 auto' }}>
          Validate adapter readiness before enablement using read-only test execution and transparent step diagnostics.
        </p>
      </section>

      <section className="dashboard-card" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px' }}>
            Retailer Adapter
            <select
              value={selectedAdapterId}
              onChange={(event) => setSelectedAdapterId(event.target.value)}
              style={{ borderRadius: '10px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '10px 12px' }}
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} {option.isDisabled ? '(disabled adapter)' : '(active adapter)'}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px' }}>
            Search Query
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{ borderRadius: '10px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '10px 12px' }}
            />
          </label>

          <div style={{ display: 'grid', alignContent: 'end' }}>
            <button
              type="button"
              onClick={runTest}
              disabled={!selectedOption || query.trim().length === 0 || status === 'running'}
              style={{
                borderRadius: '999px',
                border: '1px solid #2563eb',
                background: status === 'running' ? '#1e293b' : '#1d4ed8',
                color: '#f8fafc',
                fontWeight: 700,
                fontSize: '13px',
                padding: '10px 14px',
                cursor: status === 'running' ? 'wait' : 'pointer',
              }}
            >
              {status === 'running' ? 'Running Adapter Test...' : 'Run Adapter Test'}
            </button>
          </div>
        </div>

        {selectedOption?.isDisabled ? (
          <div
            style={{
              marginBottom: '12px',
              borderRadius: '10px',
              border: '1px solid rgba(148, 163, 184, 0.4)',
              background: 'rgba(148, 163, 184, 0.1)',
              color: '#cbd5e1',
              padding: '10px 12px',
              fontSize: '13px',
            }}
          >
            Disabled adapter selected. Testing is allowed only because this adapter was explicitly chosen.
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px', marginBottom: '12px' }}>
          <div style={{ border: '1px solid #243347', borderRadius: '10px', background: '#0b1220', padding: '10px 12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Overall Status</div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '999px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 700,
                background: currentTone.bg,
                color: currentTone.color,
                border: currentTone.border,
              }}
            >
              {status.toUpperCase()}
            </span>
          </div>

          <div style={{ border: '1px solid #243347', borderRadius: '10px', background: '#0b1220', padding: '10px 12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Products Returned</div>
            <div style={{ color: '#f8fafc', fontWeight: 700 }}>{result?.productsReturnedCount ?? '—'}</div>
          </div>

          <div style={{ border: '1px solid #243347', borderRadius: '10px', background: '#0b1220', padding: '10px 12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Elapsed Time</div>
            <div style={{ color: '#f8fafc', fontWeight: 700 }}>{result ? `${result.elapsedMs} ms` : '—'}</div>
          </div>

          <div style={{ border: '1px solid #243347', borderRadius: '10px', background: '#0b1220', padding: '10px 12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Adapter Source</div>
            <div style={{ color: '#f8fafc', fontWeight: 700 }}>{result?.adapterSource ?? selectedAdapterSource}</div>
          </div>
        </div>

        {runError ? (
          <div style={{ marginBottom: '12px', borderRadius: '10px', border: '1px solid rgba(248, 113, 113, 0.45)', background: 'rgba(248, 113, 113, 0.15)', color: '#fecaca', padding: '10px 12px' }}>
            {runError}
          </div>
        ) : null}

        {result ? (
          <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
            {result.steps.map((step) => {
              const tone = stepTone(step.status);
              return (
                <div key={step.key} style={{ border: tone.border, background: '#0b1220', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <div style={{ color: '#f8fafc', fontWeight: 700 }}>{step.label}</div>
                    <span style={{ color: tone.color, fontWeight: 700, fontSize: '12px' }}>{step.status.toUpperCase()}</span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '4px' }}>{step.message}</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>Duration: {step.durationMs} ms</div>
                  {step.details && step.details.length > 0 ? (
                    <ul style={{ margin: '8px 0 0', paddingLeft: '18px', color: '#e2e8f0', fontSize: '13px' }}>
                      {step.details.map((detail, index) => (
                        <li key={`${step.key}-${index}`}>{detail}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {result?.errorDetails.length ? (
          <div style={{ marginBottom: '14px', borderRadius: '10px', border: '1px solid #243347', background: '#0b1220', padding: '10px 12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Error Details</div>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#e2e8f0', fontSize: '13px' }}>
              {result.errorDetails.map((detail, index) => (
                <li key={`error-${index}`}>{detail}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {result?.sampleNormalizedProduct && result.adapterSource === 'live' ? (
          <div style={{ borderRadius: '10px', border: '1px solid #243347', background: '#0b1220', padding: '10px 12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Sample Normalized Product</div>
            <pre
              style={{
                margin: 0,
                borderRadius: '10px',
                border: '1px solid #1f2d43',
                background: '#0a1020',
                color: '#e2e8f0',
                padding: '10px',
                fontSize: '12px',
                lineHeight: 1.45,
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(result.sampleNormalizedProduct, null, 2)}
            </pre>
          </div>
        ) : result?.sampleNormalizedProduct ? (
          <div style={{ borderRadius: '10px', border: '1px solid rgba(250, 204, 21, 0.45)', background: 'rgba(250, 204, 21, 0.12)', color: '#fde68a', padding: '10px 12px' }}>
            Sample normalized product is hidden because adapter source is classified as {result.adapterSource}, not live.
          </div>
        ) : null}
      </section>

      <BlowoutPipelineHarness />
    </main>
  );
}
