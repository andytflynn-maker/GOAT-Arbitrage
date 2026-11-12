# Target Integration Plan

## Purpose
This document defines compliant paths to integrate Target product data into GOAT via the existing RetailerAdapter contract, while keeping the current Target adapter disabled until an approved source is activated.

## Current State
- Target adapter exists at marketplaces/target/targetAdapter.ts.
- Adapter mode defaults to disabled.
- Registry behavior remains unchanged; Target is not in the active registeredRetailers list.

## Compliance Guardrails
- Do not scrape or crawl Target without written authorization.
- Do not use undocumented private endpoints in production.
- Do not fabricate Target data.
- Use only contract-approved, licensed, or written-permission data sources.

## Shared Adapter Contract Mapping
All supported paths must map upstream product data into the existing Product model used by RetailerAdapter:
- universal.id
- universal.title
- universal.brand
- universal.manufacturer
- universal.category
- universal.subcategory
- universal.UPC
- universal.SKU
- universal.image
- universal.url
- retailPricing[0].retailer
- retailPricing[0].retailerPrice
- retailPricing[0].availability
- retailPricing[0].quantity

Normalization stage should continue to reuse existing project conventions in TargetAdapter.normalizeProduct().

## Path A: Approved Target API / Partner Access
### Requirements
- Written approval and legal authorization.
- API credentials (for example: client_id/client_secret, API key, OAuth token, or partner token).
- Terms that allow product, price, and inventory ingestion for this use case.

### Expected Product Fields
- Product identifier (Target item id).
- Product title/name.
- Brand/manufacturer.
- Product URL.
- Primary image URL.
- Price value and currency.
- Availability / inventory status.
- UPC and SKU when provided.
- Optional category metadata.

### Authentication Model
- Store credentials in secure environment variables.
- Retrieve short-lived access tokens where required.
- Refresh tokens on schedule and rotate secrets per policy.
- Adapter should fail closed on auth errors and return empty results with structured logs.

### RetailerAdapter Plug-in
- searchProducts(query): call approved API search endpoint and map results to Product[].
- getProductByUrl(url): resolve URL to item id and fetch detail endpoint.
- normalizeProduct(product): apply shared normalization and category attribute enrichment.

## Path B: Licensed Third-Party Product-Data Provider
### Adapter Boundary
- Provider client fetches raw records.
- TargetAdapter performs only mapping, normalization, and contract checks.
- Provider-specific logic remains outside scan orchestration boundaries.

### Required Fields
- Product title.
- Canonical product URL.
- Current price.
- Availability or stock indicator.
- Image URL.
- UPC and SKU where available.
- Stable external item id.

### Data Freshness Requirements
- Price freshness target: <= 15 minutes for scan use.
- Inventory freshness target: <= 15 minutes.
- Catalog metadata freshness target: daily refresh baseline.

### Inventory and Price Requirements
- Price must include source timestamp.
- Inventory should include signal confidence or source state when available.
- Adapter should reject stale records beyond freshness thresholds.

## Path C: Merchant or Affiliate Product Feed
### Feed Ingestion
- Support CSV, JSON, or XML feed formats.
- Parse feed into normalized internal records.
- Validate required fields before exposing to scan flow.

### Scheduled Updates
- Incremental ingestion every 15-30 minutes for price/inventory.
- Full catalog reconciliation daily.
- Deduplicate by stable feed id plus URL.

### Required Feed Fields
- product URL
- price
- availability
- image URL
- UPC
- SKU

Records missing required fields should be skipped and logged.

## Activation Plan (No Runtime Behavior Change Today)
1. Keep TargetAdapter mode set to disabled.
2. Select one approved path and sign data-use agreements.
3. Add source client module (API/provider/feed).
4. Implement mapping in TargetAdapter methods.
5. Run validation for Product model completeness and freshness checks.
6. Move TargetAdapter from disabled to active registry list when approved.

## Future End-to-End Flow
Search
-> Raw Target Product
-> Normalization
-> Product Match Engine
-> eBay Comparison
-> Arbitrage Engine

This flow can be enabled without changing Scan Engine APIs because TargetAdapter already implements RetailerAdapter.
