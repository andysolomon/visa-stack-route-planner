"use client";

import { useMemo } from "react";
import MapGL, { Marker, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { mapboxToken, mapStyle, defaultCenter, defaultZoom } from "@/lib/mapbox/config";
import countryCoords from "@/lib/data/country-coords.json";

interface Leg {
  id: string;
  countryCode: string;
  sortOrder: number;
  lat: number | null;
  lng: number | null;
}

interface RouteMapProps {
  legs: Leg[];
}

const coords = countryCoords as unknown as Record<string, [number, number]>;

function getLegCoords(leg: Leg): [number, number] | null {
  if (leg.lng != null && leg.lat != null) return [leg.lng, leg.lat];
  return coords[leg.countryCode] ?? null;
}

export function RouteMap({ legs }: RouteMapProps) {
  const routeGeoJSON = useMemo(() => {
    const points = legs
      .map(getLegCoords)
      .filter((c): c is [number, number] => c !== null);

    return {
      type: "FeatureCollection" as const,
      features:
        points.length >= 2
          ? [
              {
                type: "Feature" as const,
                properties: {},
                geometry: {
                  type: "LineString" as const,
                  coordinates: points,
                },
              },
            ]
          : [],
    };
  }, [legs]);

  return (
    <MapGL
      mapboxAccessToken={mapboxToken}
      mapStyle={mapStyle}
      initialViewState={{
        longitude: defaultCenter[0],
        latitude: defaultCenter[1],
        zoom: defaultZoom,
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <Source id="route" type="geojson" data={routeGeoJSON}>
        <Layer
          id="route-line"
          type="line"
          paint={{
            "line-color": "#3b82f6",
            "line-width": 2,
            "line-dasharray": [2, 2],
          }}
        />
      </Source>

      {legs.map((leg) => {
        const c = getLegCoords(leg);
        if (!c) return null;
        return (
          <Marker key={leg.id} longitude={c[0]} latitude={c[1]} anchor="center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
              {leg.sortOrder + 1}
            </div>
          </Marker>
        );
      })}
    </MapGL>
  );
}
