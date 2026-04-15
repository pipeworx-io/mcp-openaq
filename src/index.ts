interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * OpenAQ MCP — wraps OpenAQ v2 API (free, no auth required)
 *
 * Tools:
 * - get_latest: Latest measurements from air quality sensor stations
 * - get_locations: Sensor locations filtered by city and/or country
 * - get_measurements: Historical measurements for a specific location
 */


const BASE_URL = 'https://api.openaq.org/v2';

type RawLatestResult = {
  location: string;
  city: string;
  country: string;
  coordinates: { latitude: number; longitude: number };
  measurements: Array<{ parameter: string; value: number; unit: string; lastUpdated: string }>;
};

type RawLatestResponse = {
  results: RawLatestResult[];
};

type RawLocation = {
  id: number;
  name: string;
  city: string;
  country: string;
  coordinates: { latitude: number; longitude: number };
  parameters: Array<{ parameter: string; unit: string; lastUpdated: string; count: number }>;
  isMobile: boolean;
  isAnalysis: boolean;
  firstUpdated: string;
  lastUpdated: string;
  sources: Array<{ name: string; url: string; id: string }>;
};

type RawLocationsResponse = {
  results: RawLocation[];
};

type RawMeasurement = {
  locationId: number;
  location: string;
  parameter: string;
  value: number;
  unit: string;
  date: { utc: string; local: string };
  coordinates: { latitude: number; longitude: number };
};

type RawMeasurementsResponse = {
  results: RawMeasurement[];
};

const tools: McpToolExport['tools'] = [
  {
    name: 'get_latest',
    description:
      'Get the latest air quality measurements from sensor stations. Optionally filter by country. Returns readings for pollutants like PM2.5, PM10, ozone, NO2, SO2, and CO.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of station results to return (default 10, max 100).',
        },
        country: {
          type: 'string',
          description: 'ISO 3166-1 alpha-2 country code to filter by (e.g. "US", "GB", "DE").',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_locations',
    description:
      'Search for air quality sensor locations. Filter by city and/or country to find monitoring stations near a place of interest.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of locations to return (default 10, max 100).',
        },
        city: {
          type: 'string',
          description: 'City name to filter locations by (e.g. "London", "Los Angeles").',
        },
        country: {
          type: 'string',
          description: 'ISO 3166-1 alpha-2 country code to filter by (e.g. "US", "GB").',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_measurements',
    description:
      'Get historical measurements for a specific sensor location. Optionally filter by parameter (pm25, pm10, o3, no2, so2, co).',
    inputSchema: {
      type: 'object',
      properties: {
        location_id: {
          type: 'number',
          description: 'Numeric location ID from get_locations (e.g. 2178).',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of measurement records to return (default 20, max 100).',
        },
        parameter: {
          type: 'string',
          description:
            'Pollutant parameter to filter by. One of: pm25, pm10, o3, no2, so2, co.',
          enum: ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'],
        },
      },
      required: ['location_id'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_latest':
      return getLatest(
        (args.limit as number | undefined) ?? 10,
        args.country as string | undefined,
      );
    case 'get_locations':
      return getLocations(
        (args.limit as number | undefined) ?? 10,
        args.city as string | undefined,
        args.country as string | undefined,
      );
    case 'get_measurements':
      return getMeasurements(
        args.location_id as number,
        (args.limit as number | undefined) ?? 20,
        args.parameter as string | undefined,
      );
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function getLatest(limit: number, country?: string) {
  const params = new URLSearchParams({ limit: String(Math.min(limit, 100)) });
  if (country) params.set('country_id', country);
  const res = await fetch(`${BASE_URL}/latest?${params}`);
  if (!res.ok) throw new Error(`OpenAQ API error: ${res.status}`);
  const data = (await res.json()) as RawLatestResponse;
  return {
    count: data.results.length,
    stations: data.results.map((r) => ({
      location: r.location,
      city: r.city,
      country: r.country,
      coordinates: r.coordinates,
      measurements: r.measurements,
    })),
  };
}

async function getLocations(limit: number, city?: string, country?: string) {
  const params = new URLSearchParams({ limit: String(Math.min(limit, 100)) });
  if (city) params.set('city', city);
  if (country) params.set('country_id', country);
  const res = await fetch(`${BASE_URL}/locations?${params}`);
  if (!res.ok) throw new Error(`OpenAQ API error: ${res.status}`);
  const data = (await res.json()) as RawLocationsResponse;
  return {
    count: data.results.length,
    locations: data.results.map((l) => ({
      id: l.id,
      name: l.name,
      city: l.city,
      country: l.country,
      coordinates: l.coordinates,
      parameters: l.parameters.map((p) => p.parameter),
      last_updated: l.lastUpdated,
      first_updated: l.firstUpdated,
      is_mobile: l.isMobile,
    })),
  };
}

async function getMeasurements(locationId: number, limit: number, parameter?: string) {
  const params = new URLSearchParams({
    location_id: String(locationId),
    limit: String(Math.min(limit, 100)),
  });
  if (parameter) params.set('parameter', parameter);
  const res = await fetch(`${BASE_URL}/measurements?${params}`);
  if (!res.ok) throw new Error(`OpenAQ API error: ${res.status}`);
  const data = (await res.json()) as RawMeasurementsResponse;
  return {
    count: data.results.length,
    measurements: data.results.map((m) => ({
      parameter: m.parameter,
      value: m.value,
      unit: m.unit,
      date_utc: m.date.utc,
      date_local: m.date.local,
      location: m.location,
      coordinates: m.coordinates,
    })),
  };
}

export default { tools, callTool, meter: { credits: 5 } } satisfies McpToolExport;
