# GOAT Arbitrage Architecture

## Goals
- Build a scalable Next.js + TypeScript arbitrage platform.
- Keep retailer and marketplace integrations isolated behind connector modules.
- Use a shared Product model for all downstream analysis.
- Avoid scraper implementation in this milestone.

## Proposed structure
- app/: Next.js pages and app shell.
- components/: reusable UI components.
- connectors/: retailer-specific connector implementations.
- marketplaces/: marketplace enrichment connectors.
- services/: orchestration services such as analysis and scoring.
- models/: domain models like Product.
- types/: interfaces and shared contracts.
- utils/: helper functions and factory utilities.

## Connector pattern
Each retailer connector follows the same contract:
- expose a unique id
- expose a name and retailer label
- implement scan() and return a list of Product objects

This means adding a new retailer requires one connector file and one export.

## Marketplace pattern
Each marketplace connector:
- receives a Product
- enriches it with pricing and sales intelligence
- returns the updated Product

## Product model
The shared Product model includes:
- title
- category
- brand
- manufacturer
- UPC
- SKU
- image
- retailer
- retailerPrice
- marketplaceLowestBIN
- marketplaceAverageSold
- marketplaceMedianSold
- marketplaceSalesLast30Days
- marketplaceListingsAvailable
- estimatedFees
- shippingCost
- estimatedProfit
- ROI
- priceTrend
- confidenceScore
- recommendation

## Current seeded scope
- Retailers: Dave & Adam's, Steel City Collectibles
- Marketplace: eBay
- Future expansion targets: Blowout, Midwest Cards, CardGiants, Target, Walmart, Dick's Sporting Goods, Menards, Costco, Best Buy, Barnes & Noble, Amazon, Whatnot, COMC, StockX, and Facebook Marketplace
