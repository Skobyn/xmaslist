/**
 * Retailer Logo Detection
 * Detects retailer from URLs and provides logo URLs
 */

export interface RetailerInfo {
  name: string;
  logoUrl: string;
  primaryColor: string;
}

const RETAILER_LOGOS: Record<string, RetailerInfo> = {
  amazon: {
    name: 'Amazon',
    logoUrl: 'https://logo.clearbit.com/amazon.com',
    primaryColor: '#FF9900',
  },
  target: {
    name: 'Target',
    logoUrl: 'https://logo.clearbit.com/target.com',
    primaryColor: '#CC0000',
  },
  walmart: {
    name: 'Walmart',
    logoUrl: 'https://logo.clearbit.com/walmart.com',
    primaryColor: '#0071CE',
  },
  bestbuy: {
    name: 'Best Buy',
    logoUrl: 'https://logo.clearbit.com/bestbuy.com',
    primaryColor: '#0046BE',
  },
  etsy: {
    name: 'Etsy',
    logoUrl: 'https://logo.clearbit.com/etsy.com',
    primaryColor: '#F56400',
  },
  kohls: {
    name: "Kohl's",
    logoUrl: 'https://logo.clearbit.com/kohls.com',
    primaryColor: '#6F2C91',
  },
  macys: {
    name: "Macy's",
    logoUrl: 'https://logo.clearbit.com/macys.com',
    primaryColor: '#E21A2C',
  },
  nordstrom: {
    name: 'Nordstrom',
    logoUrl: 'https://logo.clearbit.com/nordstrom.com',
    primaryColor: '#000000',
  },
  wayfair: {
    name: 'Wayfair',
    logoUrl: 'https://logo.clearbit.com/wayfair.com',
    primaryColor: '#7B1FA2',
  },
  homedepot: {
    name: 'Home Depot',
    logoUrl: 'https://logo.clearbit.com/homedepot.com',
    primaryColor: '#F96302',
  },
  lowes: {
    name: "Lowe's",
    logoUrl: 'https://logo.clearbit.com/lowes.com',
    primaryColor: '#004990',
  },
  costco: {
    name: 'Costco',
    logoUrl: 'https://logo.clearbit.com/costco.com',
    primaryColor: '#0063A3',
  },
};

/**
 * Detect retailer from URL
 */
export function detectRetailerFromUrl(url: string): string | null {
  if (!url) return null;

  const urlLower = url.toLowerCase();

  for (const [key, info] of Object.entries(RETAILER_LOGOS)) {
    if (urlLower.includes(key) || urlLower.includes(info.name.toLowerCase().replace(/[^a-z]/g, ''))) {
      return key;
    }
  }

  return null;
}

/**
 * Get retailer logo URL from product URL
 */
export function getRetailerLogoFromUrl(url: string): string | null {
  const retailerKey = detectRetailerFromUrl(url);
  return retailerKey ? RETAILER_LOGOS[retailerKey].logoUrl : null;
}

/**
 * Get retailer info from product URL
 */
export function getRetailerInfo(url: string): RetailerInfo | null {
  const retailerKey = detectRetailerFromUrl(url);
  return retailerKey ? RETAILER_LOGOS[retailerKey] : null;
}

/**
 * Get retailer logo from domain
 */
export function getLogoFromDomain(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

/**
 * Detect retailer from multiple URLs and return most common
 */
export function detectRetailerFromUrls(urls: string[]): RetailerInfo | null {
  if (urls.length === 0) return null;

  const retailerCounts: Record<string, number> = {};

  for (const url of urls) {
    const retailerKey = detectRetailerFromUrl(url);
    if (retailerKey) {
      retailerCounts[retailerKey] = (retailerCounts[retailerKey] || 0) + 1;
    }
  }

  // Find most common retailer
  let maxCount = 0;
  let mostCommonRetailer: string | null = null;

  for (const [retailer, count] of Object.entries(retailerCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonRetailer = retailer;
    }
  }

  return mostCommonRetailer ? RETAILER_LOGOS[mostCommonRetailer] : null;
}
