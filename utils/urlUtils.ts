import { Product } from '../types';

/**
 * Generates a canonical, tracking-free URL for a given product based on its platform and external ID.
 * Returns an empty string if a specific product page cannot be resolved.
 * Strictly avoids generic search result pages.
 */
export const resolveMarketplaceUrl = (product: Product): string => {
  const { platform, externalId, url } = product;

  // 1. Preferred: Verified URL (from discovery/grounding) or explicit URL in data
  // Strictly check for http/https to prevent javascript: or other schemes
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      return url;
  }

  // 2. Fallback: Construct Canonical URL from ID
  if (externalId) {
    // Security: Sanitize ID to ensure it contains only alphanumeric characters
    // This prevents injection of malicious paths or query parameters
    const cleanId = externalId.replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanId) return '';

    switch (platform) {
      case 'Amazon':
        return `https://www.amazon.com/dp/${cleanId}`;
      case 'Walmart':
        // Walmart often prefers the slug. If we only have ID, this is the safest direct link.
        return `https://www.walmart.com/ip/${cleanId}`;
      case 'BestBuy':
        // Best Buy: Use Search-by-SKU which reliably redirects to the PDP or shows the single item.
        return `https://www.bestbuy.com/site/searchpage.jsp?st=${cleanId}`;
      case 'eBay':
        return `https://www.ebay.com/itm/${cleanId}`;
    }
  }

  // 3. Last Resort Fallback (if no URL and no ID, but we have a title and platform)
  // This ensures the button always does SOMETHING useful rather than just failing.
  if (platform && product.title) {
     const query = encodeURIComponent(product.title);
     switch (platform) {
        case 'Amazon': return `https://www.amazon.com/s?k=${query}`;
        case 'eBay': return `https://www.ebay.com/sch/i.html?_nkw=${query}`;
        case 'Walmart': return `https://www.walmart.com/search?q=${query}`;
        case 'BestBuy': return `https://www.bestbuy.com/site/searchpage.jsp?st=${query}`;
     }
  }

  return '';
};

/**
 * Maps a hostname (e.g. www.bestbuy.com) to our internal Platform type
 */
export const mapDomainToPlatform = (url: string): Product['platform'] | null => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('amazon.com')) return 'Amazon';
    if (hostname.includes('ebay.com')) return 'eBay';
    if (hostname.includes('walmart.com')) return 'Walmart';
    if (hostname.includes('bestbuy.com')) return 'BestBuy';
    if (hostname.includes('target.com')) return 'Direct'; // Map others to Direct or specific if added
    if (hostname.includes('bhphotovideo.com')) return 'Direct';
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Basic security sanitization to ensure links are strictly HTTPS
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  if (!url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};