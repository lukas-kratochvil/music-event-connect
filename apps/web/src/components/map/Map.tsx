import type { SpotNearby } from "@music-event-connect/shared/api";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export type MapProps = {
  coords: {
    text: string;
    type: "venue" | SpotNearby;
    position: [number, number];
  }[];
};

export const Map = ({ coords }: MapProps) => {
  if (coords.length === 0) {
    return null;
  }

  const venueCoords = coords.filter((coord) => coord.type === "venue");
  const center = venueCoords[0]!.position;
  const bounds =
    coords.length > 1
      ? ([
          [Math.min(...coords.map((c) => c.position[0])), Math.min(...coords.map((c) => c.position[1]))],
          [Math.max(...coords.map((c) => c.position[0])), Math.max(...coords.map((c) => c.position[1]))],
        ] satisfies [number, number][])
      : undefined;

  return (
    <div className="overflow-hidden rounded-xl border">
      <MapContainer
        center={bounds ? undefined : center}
        zoom={bounds ? undefined : 13}
        bounds={bounds}
        boundsOptions={{
          padding: [50, 50],
        }}
        scrollWheelZoom={false}
        style={{
          // size must be specified to display the map in the UI
          width: "100%",
          height: "400px",
          zIndex: 0,
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {coords.map(({ text, position }) => (
          <Marker
            key={text + "_" + position.toString()}
            position={position}
          >
            <Popup>{text}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
