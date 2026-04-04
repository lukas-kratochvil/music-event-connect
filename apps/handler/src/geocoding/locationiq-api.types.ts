/**
 * See: https://api-reference.locationiq.com/#forward_response
 */
export type LocationIQSearchStructuredResponse = {
  place_id: string;
  licence: string;
  osm_type: "node" | "way" | "relation";
  osm_id: string;
  // stringified coordinates in the format `[min lat (bottom-left latitude), max lat (top-right latitude), min lon (bottom-left longitude), max lon (top-right longitude)]`
  boundingbox: [string, string, string, string];
  // stringified coordinate
  lat: string;
  // stringified coordinate
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: LocationIQAddress;
}[];

/**
 * See: https://api-reference.locationiq.com/#reverse_response
 */
export type LocationIQReverseResponse = {
  place_id: string;
  licence: string;
  osm_type: "node" | "way" | "relation";
  osm_id: string;
  // stringified coordinates in the format `[min lat (bottom-left latitude), max lat (top-right latitude), min lon (bottom-left longitude), max lon (top-right longitude)]`
  boundingbox: [string, string, string, string];
  // stringified coordinate
  lat: string;
  // stringified coordinate
  lon: string;
  display_name: string;
  address?: LocationIQAddress;
};

/**
 * See: https://api-reference.locationiq.com/?javascript#address-details
 */
type LocationIQAddress = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  hamlet?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city_district?: string;
  city?: string;
  region?: string;
  county?: string;
  state_district?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
  country?: string;
  // ISO 3166-1 alpha-2 code
  country_code?: string;
  name?: string;
};
