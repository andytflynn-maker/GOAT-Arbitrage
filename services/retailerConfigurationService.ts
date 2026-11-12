import { mockRetailerConfigurations } from '@/data/mockRetailerConfigurations';
import type {
  RetailerConfiguration,
  RetailerConfigurationCreateInput,
  RetailerDataSourceType,
} from '@/models/RetailerConfiguration';

function cloneConfig(config: RetailerConfiguration): RetailerConfiguration {
  return {
    ...config,
    categoryMappings: { ...config.categoryMappings },
  };
}

function toRetailerId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveAdapterStatus(enabled: boolean, sourceType: RetailerDataSourceType): RetailerConfiguration['adapterStatus'] {
  if (!enabled || sourceType === 'disabled') {
    return 'disabled';
  }

  return 'ready';
}

export class RetailerConfigurationService {
  private configs: RetailerConfiguration[];

  constructor(initialConfigs: RetailerConfiguration[] = mockRetailerConfigurations) {
    this.configs = initialConfigs.map(cloneConfig);
  }

  list(): RetailerConfiguration[] {
    return this.configs.map(cloneConfig);
  }

  add(input: RetailerConfigurationCreateInput): RetailerConfiguration {
    const now = new Date().toISOString();
    const created: RetailerConfiguration = {
      retailerId: toRetailerId(input.retailerName),
      retailerName: input.retailerName.trim(),
      logoUrl: '',
      website: input.website.trim(),
      enabled: input.dataSourceType !== 'disabled',
      adapterStatus: resolveAdapterStatus(input.dataSourceType !== 'disabled', input.dataSourceType),
      adapterVersion: '0.1.0',
      dataSourceType: input.dataSourceType,
      searchUrlTemplate: input.searchUrlTemplate.trim(),
      productUrlTemplate: input.productUrlTemplate.trim(),
      supportsSearch: true,
      supportsInventory: true,
      supportsPricing: true,
      supportsProductDetails: true,
      supportsRestockMonitoring: false,
      supportsAuthentication: false,
      authenticationType: 'none',
      scanPriority: input.scanPriority,
      scanFrequencyMinutes: 60,
      categoryMappings: {},
      notes: input.notes.trim(),
      createdDate: now,
      modifiedDate: now,
    };

    this.configs = [...this.configs, created];
    return cloneConfig(created);
  }

  update(config: RetailerConfiguration): RetailerConfiguration {
    const updatedConfig: RetailerConfiguration = {
      ...config,
      modifiedDate: new Date().toISOString(),
      adapterStatus: resolveAdapterStatus(config.enabled, config.dataSourceType),
    };

    this.configs = this.configs.map((item) =>
      item.retailerId === updatedConfig.retailerId ? cloneConfig(updatedConfig) : item,
    );

    return cloneConfig(updatedConfig);
  }

  toggleEnabled(retailerId: string): RetailerConfiguration | null {
    let nextValue: RetailerConfiguration | null = null;

    this.configs = this.configs.map((item) => {
      if (item.retailerId !== retailerId) {
        return item;
      }

      const toggledEnabled = !item.enabled;
      const nextStatus = resolveAdapterStatus(toggledEnabled, item.dataSourceType);
      const nextType: RetailerDataSourceType = toggledEnabled
        ? item.dataSourceType === 'disabled'
          ? 'manual'
          : item.dataSourceType
        : 'disabled';

      const updated: RetailerConfiguration = {
        ...item,
        enabled: toggledEnabled,
        dataSourceType: nextType,
        adapterStatus: nextStatus,
        modifiedDate: new Date().toISOString(),
      };

      nextValue = updated;
      return updated;
    });

    return nextValue ? cloneConfig(nextValue) : null;
  }

  getById(retailerId: string): RetailerConfiguration | null {
    const found = this.configs.find((item) => item.retailerId === retailerId);
    return found ? cloneConfig(found) : null;
  }
}
