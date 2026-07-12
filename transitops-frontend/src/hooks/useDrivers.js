import useApi from './useApi.js';
export const useDrivers = (params = {}) => useApi('/api/drivers', params);
