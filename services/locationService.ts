import { api } from './api';

export interface GeoLocation {
    id?: number;
    wikiDataId: string;
    name: string;
    country?: string;
    countryCode?: string;
    region?: string;
    regionCode?: string;
    city?: string;
}

export const locationService = {
    async getCountries() {
        const response = await api.get<GeoLocation[]>('/locations/countries');
        return response.data;
    },

    async getStates(countryCode: string) {
        const response = await api.get<GeoLocation[]>(`/locations/states/${countryCode}`);
        return response.data;
    },

    async getCities(countryCode: string, regionCode: string) {
        const response = await api.get<GeoLocation[]>(`/locations/cities/${countryCode}/${regionCode}`);
        return response.data;
    },

    async searchCities(query: string) {
        const response = await api.get<GeoLocation[]>(`/locations/search?query=${encodeURIComponent(query)}`);
        return response.data;
    }
};