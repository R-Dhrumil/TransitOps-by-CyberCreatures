import useApi from './useApi.js';
export const useVehicles = (params = {}) => useApi('/api/vehicles', params);
