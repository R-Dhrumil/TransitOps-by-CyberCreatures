import useApi from './useApi.js';
export const useDashboard = () => useApi('/api/dashboard/kpis');
