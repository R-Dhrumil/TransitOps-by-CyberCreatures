import useApi from './useApi.js';
export const useTrips = (params = {}) => useApi('/api/trips', params);
