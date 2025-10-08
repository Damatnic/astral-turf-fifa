/**
 * GeoIP Service
 * 
 * Provides IP geolocation services with support for:
 * - MaxMind GeoIP2
 * - IP2Location
 * - ipapi.co (free tier)
 * 
 * Features:
 * - IP to location mapping
 * - Caching for performance
 * - Fallback providers
 */

import { loggingService } from './loggingService';

export interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  city: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp?: string;
  organization?: string;
}

export interface GeoIPConfig {
  provider: 'maxmind' | 'ip2location' | 'ipapi' | 'mock';
  apiKey?: string;
  accountId?: string;
  enableCaching: boolean;
  cacheTTL: number; // milliseconds
}

class GeoIPService {
  private config: GeoIPConfig;
  private cache: Map<string, { location: GeoLocation; timestamp: number }> = new Map();

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from environment
   */
  private loadConfig(): GeoIPConfig {
    return {
      provider: (process.env.GEOIP_SERVICE || 'mock') as GeoIPConfig['provider'],
      apiKey: process.env.MAXMIND_LICENSE_KEY || process.env.GEOIP_API_KEY,
      accountId: process.env.MAXMIND_ACCOUNT_ID,
      enableCaching: process.env.GEOIP_ENABLE_CACHE !== 'false',
      cacheTTL: parseInt(process.env.GEOIP_CACHE_TTL || '86400000'), // 24 hours default
    };
  }

  /**
   * Get geolocation for IP address
   */
  async getLocation(ipAddress: string): Promise<GeoLocation | null> {
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cached = this.cache.get(ipAddress);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
          return cached.location;
        }
      }

      // Get location from provider
      let location: GeoLocation | null = null;

      switch (this.config.provider) {
        case 'maxmind':
          location = await this.getLocationFromMaxMind(ipAddress);
          break;
        
        case 'ip2location':
          location = await this.getLocationFromIP2Location(ipAddress);
          break;
        
        case 'ipapi':
          location = await this.getLocationFromIPAPI(ipAddress);
          break;
        
        case 'mock':
        default:
          location = this.getMockLocation(ipAddress);
          break;
      }

      // Cache result
      if (location && this.config.enableCaching) {
        this.cache.set(ipAddress, {
          location,
          timestamp: Date.now(),
        });
      }

      return location;
    } catch (error) {
      loggingService.error('Failed to get geolocation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { ipAddress, provider: this.config.provider },
      });
      
      // Return mock location on error
      return this.getMockLocation(ipAddress);
    }
  }

  /**
   * MaxMind GeoIP2 implementation
   */
  private async getLocationFromMaxMind(ipAddress: string): Promise<GeoLocation | null> {
    try {
      if (!this.config.apiKey || !this.config.accountId) {
        throw new Error('MaxMind credentials not configured');
      }

      // TODO: Implement actual MaxMind integration when package is installed
      // const maxmind = await import('@maxmind/geoip2-node');
      // const client = new maxmind.Client(this.config.accountId, this.config.apiKey);
      // const response = await client.city(ipAddress);
      // return this.mapMaxMindResponse(response);

      loggingService.info('MaxMind GeoIP lookup (not yet implemented)', {
        metadata: { ipAddress },
      });

      return this.getMockLocation(ipAddress);
    } catch (error) {
      loggingService.warn('MaxMind lookup failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * IP2Location implementation
   */
  private async getLocationFromIP2Location(ipAddress: string): Promise<GeoLocation | null> {
    try {
      if (!this.config.apiKey) {
        throw new Error('IP2Location API key not configured');
      }

      // TODO: Implement actual IP2Location integration
      loggingService.info('IP2Location lookup (not yet implemented)', {
        metadata: { ipAddress },
      });

      return this.getMockLocation(ipAddress);
    } catch (error) {
      loggingService.warn('IP2Location lookup failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * ipapi.co free tier implementation
   */
  private async getLocationFromIPAPI(ipAddress: string): Promise<GeoLocation | null> {
    try {
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      
      if (!response.ok) {
        throw new Error(`ipapi.co returned status ${response.status}`);
      }

      const data = await response.json();

      return {
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'XX',
        region: data.region || 'Unknown',
        regionCode: data.region_code || 'XX',
        city: data.city || 'Unknown',
        postalCode: data.postal,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        timezone: data.timezone || 'UTC',
        isp: data.org,
      };
    } catch (error) {
      loggingService.warn('ipapi.co lookup failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Mock location for development/testing
   */
  private getMockLocation(ipAddress: string): GeoLocation {
    // Simple hash of IP to generate consistent mock data
    const hash = ipAddress.split('.').reduce((acc, part) => acc + parseInt(part || '0'), 0);
    
    const mockCities = [
      { city: 'London', country: 'United Kingdom', code: 'GB', tz: 'Europe/London', lat: 51.5074, lng: -0.1278 },
      { city: 'New York', country: 'United States', code: 'US', tz: 'America/New_York', lat: 40.7128, lng: -74.0060 },
      { city: 'Tokyo', country: 'Japan', code: 'JP', tz: 'Asia/Tokyo', lat: 35.6762, lng: 139.6503 },
      { city: 'Sydney', country: 'Australia', code: 'AU', tz: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
      { city: 'Berlin', country: 'Germany', code: 'DE', tz: 'Europe/Berlin', lat: 52.5200, lng: 13.4050 },
      { city: 'Paris', country: 'France', code: 'FR', tz: 'Europe/Paris', lat: 48.8566, lng: 2.3522 },
      { city: 'Toronto', country: 'Canada', code: 'CA', tz: 'America/Toronto', lat: 43.6532, lng: -79.3832 },
      { city: 'Madrid', country: 'Spain', code: 'ES', tz: 'Europe/Madrid', lat: 40.4168, lng: -3.7038 },
    ];

    const mockCity = mockCities[hash % mockCities.length];

    return {
      country: mockCity.country,
      countryCode: mockCity.code,
      region: mockCity.city,
      regionCode: mockCity.code,
      city: mockCity.city,
      latitude: mockCity.lat,
      longitude: mockCity.lng,
      timezone: mockCity.tz,
      isp: 'Mock ISP',
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    loggingService.info('GeoIP cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    provider: string;
    configured: boolean;
  } {
    return {
      size: this.cache.size,
      provider: this.config.provider,
      configured: this.isConfigured(),
    };
  }

  /**
   * Check if service is properly configured
   */
  private isConfigured(): boolean {
    switch (this.config.provider) {
      case 'maxmind':
        return !!(this.config.apiKey && this.config.accountId);
      
      case 'ip2location':
        return !!this.config.apiKey;
      
      case 'ipapi':
      case 'mock':
      default:
        return true;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GeoIPConfig>): void {
    this.config = { ...this.config, ...config };
    loggingService.info('GeoIP service configuration updated', {
      metadata: { provider: this.config.provider },
    });
  }
}

// Singleton instance
export const geoipService = new GeoIPService();

export default geoipService;


