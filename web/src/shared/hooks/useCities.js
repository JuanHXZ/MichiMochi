import { useState, useEffect } from 'react';
import { cityService } from '@shared/services/cityService';

/**
 * Hook de aplicación para obtener la lista de ciudades
 */
export function useCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    cityService
      .getCities()
      .then((data) => {
        if (isMounted) {
          setCities(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

  return () => {
    isMounted = false;
  };
}, []);

  return { cities, loading, error };
}
