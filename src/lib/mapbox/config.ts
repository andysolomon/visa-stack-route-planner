const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!token) {
  throw new Error(
    "NEXT_PUBLIC_MAPBOX_TOKEN is not set. Get a token at https://account.mapbox.com/access-tokens/ and add it to .env.local"
  );
}

export const mapboxToken: string = token;

export const mapStyle = "mapbox://styles/mapbox/dark-v11";

/** Default map center — Europe-centric world view */
export const defaultCenter: [number, number] = [10, 48];

export const defaultZoom = 3;
