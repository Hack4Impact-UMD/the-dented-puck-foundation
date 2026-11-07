import { Region } from "@/types";
import { getDistance } from "geolib";

// array of region objects representing a hardcoded mapping of region id's (array indices) onto
// region objects
export const regions: Region[] = [
  {
    regionId: 1,
    city: "Washington",
    state: "DC",
    country: "United States of America",
    lat: 38.907192,
    lon: -77.036873,
  },
  {
    regionId: 2,
    city: "New York",
    state: "NY",
    country: "United States of America",
    lat: 40.712776,
    lon: -74.005974,
  },
  {
    regionId: 3,
    city: "Baltimore",
    state: "MD",
    country: "United States of America",
    lat: 39.290386,
    lon: -76.61219,
  },
  {
    regionId: 4,
    city: "Los Angeles",
    state: "CA",
    country: "United States of America",
    lat: 34.052235,
    lon: -118.243683,
  },
];

// helper function to get the distance between two regions
// (when given two region id's) ronuded to the nearest mile
export function regionRegionDistance(regionId1: number, regionId2: number) {
  return Math.round(getDistance(
    {
      latitude: regions[regionId1 - 1].lat,
      longitude: regions[regionId1 - 1].lon,
    },
    {
      latitude: regions[regionId2 - 1].lat,
      longitude: regions[regionId2 - 1].lon,
    },
  ) / 1609.344);
}

// helper function to get the distance between a region and a location
// (when given a region id and latitude/longitude coordinates) rounded to the nearest mile
export function locationRegionDistance(regionId: number, lat: number, lon: number) {
  return Math.round(getDistance(
    {
      latitude: regions[regionId - 1].lat,
      longitude: regions[regionId - 1].lon,
    },
    {
      latitude: lat,
      longitude: lon,
    },
  ) / 1609.344);
}
