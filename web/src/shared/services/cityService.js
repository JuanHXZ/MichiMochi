/**
 * Servicio de infraestructura para consulta de ciudades de Colombia
 */

const CITIES_API_URL = 'https://api-colombia.com/api/v1/City';

export const cityService = {
  async getCities() {
    const response = await fetch(CITIES_API_URL);
    if (!response.ok) {
      throw new Error(`Error al consultar ciudades: ${response.statusText}`);
    }
    const data = await response.json();
    return data.map(({ id, name }) => ({
      value: id,
      label: name,
    }));
  },
};
