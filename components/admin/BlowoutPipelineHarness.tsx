"use client";

import { useState } from 'react';
import { BlowoutAdapter } from '@/marketplaces/blowout/blowoutAdapter';
import type { ProductDiscoveryPipelineResult } from '@/models/ProductDiscoveryPipeline';
import { runPipeline } from '@/services/productDiscoveryPipeline';

const blowoutAdapter = new BlowoutAdapter();

export default function BlowoutPipelineHarness() {
  const [query, setQuery] = useState('2025 Topps Chrome Baseball Hobby Box');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ProductDiscoveryPipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const nextResult = await runPipeline(blowoutAdapter, query.trim());
      setResult(nextResult);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Unknown pipeline error.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="dashboard-card" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '6px' }}>
          Product Discovery Pipeline Harness
        </div>
        <div style={{ color: '#cbd5e1', fontSize: '14px' }}>
          Blowout-only pipeline inspection. This harness is standalone and does not change runtime scan or UI behavior.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px', gridColumn: '1 / -1' }}>
          Query
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ borderRadius: '10px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '10px 12px' }}
          />
        </label>
        <div>
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning || query.trim().length === 0}
            style={{
              borderRadius: '999px',
              border: '1px solid #2563eb',
              background: isRunning ? '#1e293b' : '#1d4ed8',
              color: '#f8fafc',
              fontWeight: 700,
              fontSize: '13px',
              padding: '10px 14px',
              cursor: isRunning ? 'wait' : 'pointer',
            }}
          >
            {isRunning ? 'Running Pipeline...' : 'Run Blowout Pipeline'}
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ marginBottom: '12px', borderRadius: '10px', border: '1px solid rgba(248, 113, 113, 0.45)', background: 'rgba(248, 113, 113, 0.15)', color: '#fecaca', padding: '10px 12px' }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
            <div style={{ border: '1px solid #243347', borderRadius: '10px', background: '#0b1220', padding: '10px 12px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Discovered</div>
              <div style={{ color: '#f8fafc', fontWeight: 700 }}>{result.discoveredProducts.length}</div>
            </div>
            <div style={{ border: '1px solid #243347', borderRadius: '10px', background: '#0b1220', padding: '10px 12px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Normalized</div>
              <div style={{ color: '#f8fafc', fontWeight: 700 }}>{result.normalizedProducts.length}</div>
            </div>
            <div style={{ border: '1px solid #243347', borderRadius: '10px', background: '#0b1220', padding: '10px 12px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Match Prepared</div>
              <div style={{ color: '#f8fafc', fontWeight: 700 }}>{result.matchPreparation.length}</div>
            </div>
            <div style={{ border: '1px solid #243347', borderRadius: '10px', background: '#0b1220', padding: '10px 12px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Total Time</div>
              <div style={{ color: '#f8fafc', fontWeight: 700 }}>{result.timings.totalMs} ms</div>
            </div>
          </div>

          <div style={{ borderRadius: '10px', border: '1px solid #243347', background: '#0b1220', padding: '10px 12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Stage Output: Discovered Products</div>
            <pre style={{ margin: 0, borderRadius: '10px', border: '1px solid #1f2d43', background: '#0a1020', color: '#e2e8f0', padding: '10px', fontSize: '12px', lineHeight: 1.45, overflowX: 'auto' }}>{JSON.stringify(result.discoveredProducts, null, 2)}</pre>
          </div>

          <div style={{ borderRadius: '10px', border: '1px solid #243347', background: '#0b1220', padding: '10px 12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Stage Output: Normalized Products</div>
            <pre style={{ margin: 0, borderRadius: '10px', border: '1px solid #1f2d43', background: '#0a1020', color: '#e2e8f0', padding: '10px', fontSize: '12px', lineHeight: 1.45, overflowX: 'auto' }}>{JSON.stringify(result.normalizedProducts, null, 2)}</pre>
          </div>

          <div style={{ borderRadius: '10px', border: '1px solid #243347', background: '#0b1220', padding: '10px 12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Stage Output: Match Preparation</div>
            <pre style={{ margin: 0, borderRadius: '10px', border: '1px solid #1f2d43', background: '#0a1020', color: '#e2e8f0', padding: '10px', fontSize: '12px', lineHeight: 1.45, overflowX: 'auto' }}>{JSON.stringify(result.matchPreparation, null, 2)}</pre>
          </div>

          <div style={{ borderRadius: '10px', border: '1px solid #243347', background: '#0b1220', padding: '10px 12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Stage Output: Marketplace Candidates (Placeholder)</div>
            <pre style={{ margin: 0, borderRadius: '10px', border: '1px solid #1f2d43', background: '#0a1020', color: '#e2e8f0', padding: '10px', fontSize: '12px', lineHeight: 1.45, overflowX: 'auto' }}>{JSON.stringify(result.marketplaceCandidates, null, 2)}</pre>
          </div>

          <div style={{ borderRadius: '10px', border: '1px solid #243347', background: '#0b1220', padding: '10px 12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Stage Output: Arbitrage Candidates (Placeholder)</div>
            <pre style={{ margin: 0, borderRadius: '10px', border: '1px solid #1f2d43', background: '#0a1020', color: '#e2e8f0', padding: '10px', fontSize: '12px', lineHeight: 1.45, overflowX: 'auto' }}>{JSON.stringify(result.arbitrageCandidates, null, 2)}</pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}
