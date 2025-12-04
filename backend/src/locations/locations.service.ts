import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';

@Injectable()
export class LocationsService {
  private readonly apiUrl = 'https://wft-geo-db.p.rapidapi.com/v1/geo';
  private readonly apiKey = process.env.GEODB_API_KEY; // Ensure this is in your .env
  private readonly apiHost = 'wft-geo-db.p.rapidapi.com';

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private getHeaders() {
    return {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': this.apiHost,
    };
  }

  // Generic fetch with caching
  private async fetchWithCache(key: string, url: string, params: any = {}, ttl: number = 3600) {
    const cached = await this.cacheManager.get(key);
    if (cached) return cached;

    try {
      const response = await axios.get(url, { headers: this.getHeaders(), params });
      const data = response.data.data;
      await this.cacheManager.set(key, data, ttl * 1000); // TTL in milliseconds
      return data;
    } catch (error) {
      console.error(`GeoDB Error [${url}]:`, error.response?.data || error.message);
      throw new HttpException('Failed to fetch location data', HttpStatus.BAD_GATEWAY);
    }
  }

  async getCountries() {
    // Fetching max 100 countries for the dropdown. 
    // GeoDB free tier has limits, so we cache this heavily (24 hours).
    return this.fetchWithCache('countries_all', `${this.apiUrl}/countries`, { limit: 100, sort: 'name' }, 86400);
  }

  async getStates(countryCode: string) {
    return this.fetchWithCache(`states_${countryCode}`, `${this.apiUrl}/countries/${countryCode}/regions`, { limit: 100, sort: 'name' }, 86400);
  }

  async getCities(countryCode: string, regionCode: string) {
    return this.fetchWithCache(`cities_${countryCode}_${regionCode}`, `${this.apiUrl}/countries/${countryCode}/regions/${regionCode}/cities`, { limit: 100, sort: 'name' }, 3600);
  }

  async searchCities(query: string) {
    if (!query || query.length < 3) return [];
    // Cache search results briefly (5 mins) to save API calls on repeated typing
    const cacheKey = `search_${query.toLowerCase()}`;
    return this.fetchWithCache(cacheKey, `${this.apiUrl}/cities`, { namePrefix: query, limit: 10, sort: '-population' }, 300);
  }
}