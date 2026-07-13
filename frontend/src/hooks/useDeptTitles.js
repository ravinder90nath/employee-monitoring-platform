import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

const useDeptTitles = () => {
  const [deptTitles, setDeptTitles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getDeptAndTitle()
      .then(r => setDeptTitles(r.data?.data?.departmentTitles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { deptTitles, loading };
};

export default useDeptTitles;
