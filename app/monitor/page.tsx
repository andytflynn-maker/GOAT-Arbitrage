"use client";

import { useEffect, useMemo, useState } from 'react';
import MonitorOpportunityBoard from '@/components/MonitorOpportunityBoard';
import ScanStatus, { type ScanStatusState } from '@/components/ScanStatus';
import { registeredRetailers } from '@/marketplaces/registry';
import type { Opportunity } from '@/models/Opportunity';
import { buildOpportunityFeedFromScan, getAllOpportunities, getVerifiedRealOpportunityCount } from '@/services/opportunityFeed';
import { scanRetailer } from '@/services/scanEngine';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function MonitorPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [status, setStatus] = useState<ScanStatusState>('idle');
  const [showScanStatus, setShowScanStatus] = useState(false);
  const [currentRetailerName, setCurrentRetailerName] = useState<string | undefined>(undefined);
  const [scannedRetailers, setScannedRetailers] = useState(0);
  const [opportunitiesFound, setOpportunitiesFound] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const totalRetailers = useMemo(() => registeredRetailers.length, []);

  async function refreshOpportunities() {
    const nextOpportunities = await getAllOpportunities();
    setOpportunities(nextOpportunities);
  }

  useEffect(() => {
    void refreshOpportunities();
  }, []);

  async function handleScanNow() {
    setShowScanStatus(true);
    setShowSuccessBanner(false);
    setErrorMessage(undefined);
    setStatus('scanning');
    setScannedRetailers(0);
    setOpportunitiesFound(0);
    setElapsedSeconds(0);

    const startedAt = Date.now();
    const scannedResults: Opportunity[] = [];

    try {
      for (let index = 0; index < registeredRetailers.length; index += 1) {
        const adapter = registeredRetailers[index];
        setCurrentRetailerName(adapter.getRetailerName());

        const retailerOpportunities = await scanRetailer(adapter);
        scannedResults.push(...retailerOpportunities);
        setOpportunitiesFound(getVerifiedRealOpportunityCount(scannedResults));
        setScannedRetailers(index + 1);
        setElapsedSeconds((Date.now() - startedAt) / 1000);

        const delay = 500 + Math.floor(Math.random() * 501);
        await sleep(delay);
      }

      setCurrentRetailerName(undefined);
      setElapsedSeconds((Date.now() - startedAt) / 1000);
  setOpportunities(buildOpportunityFeedFromScan(scannedResults));
      setStatus('completed');
      setShowSuccessBanner(true);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Scan failed.');
    }
  }

  return (
    <main className="page-shell" style={{ gap: '24px' }}>
      <section className="hero-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <p className="eyebrow">GOAT Monitor</p>
        <h1 style={{ marginBottom: '12px' }}>Market Watch</h1>
        <p className="subtitle" style={{ maxWidth: '680px', margin: '0 auto' }}>
          Track high-signal retail opportunities and monitor price dislocations across trusted sources.
        </p>
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => {
              void handleScanNow();
            }}
            disabled={status === 'scanning'}
            style={{
              padding: '10px 16px',
              borderRadius: '999px',
              border: '1px solid #2563eb',
              background: status === 'scanning' ? '#334155' : '#2563eb',
              color: '#f8fafc',
              fontWeight: 700,
              cursor: status === 'scanning' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'scanning' ? 'Scanning...' : 'Scan Now'}
          </button>
        </div>
      </section>

      {showScanStatus ? (
        <ScanStatus
          status={status}
          currentRetailerName={currentRetailerName}
          scannedRetailers={scannedRetailers}
          totalRetailers={totalRetailers}
          opportunitiesFound={opportunitiesFound}
          elapsedSeconds={elapsedSeconds}
          errorMessage={errorMessage}
        />
      ) : null}

      {showSuccessBanner && status === 'completed' ? (
        <div
          style={{
            width: 'min(100%, 980px)',
            borderRadius: '12px',
            border: '1px solid #10b981',
            background: '#052e23',
            color: '#86efac',
            padding: '10px 14px',
            fontWeight: 700,
          }}
        >
          ✓ Scan Complete
        </div>
      ) : null}

      <MonitorOpportunityBoard opportunities={opportunities} />
    </main>
  );
}
