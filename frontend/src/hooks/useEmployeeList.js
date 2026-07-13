import useFetch from './useFetch';
import { dashboardService } from '../services/dashboard.service';

const useEmployeeList = () => {
  const { data, loading, refetch } = useFetch(() => dashboardService.getEmployeeList(), []);
  return { employees: Array.isArray(data) ? data : [], loading, refetch };
};

export default useEmployeeList;
