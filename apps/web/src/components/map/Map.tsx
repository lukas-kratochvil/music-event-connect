import type { SpotNearby } from "@music-event-connect/shared/api";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import { createSpotMarkerIcon } from "./icons";

type Marker = {
  name: string;
  position: [number, number];
};

type MapProps = {
  venues: Marker[];
  spotsNearby: (Marker & { type: SpotNearby })[];
};

export const Map = ({ venues, spotsNearby }: MapProps) => {
  if (venues.length === 0) {
    return null;
  }

  const center = venues[0]!.position;
  const coords = [...venues, ...spotsNearby];
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
        {venues.map(({ name, position }) => (
          <Marker
            key={name + "_" + position.toString()}
            position={position}
            icon={createSpotMarkerIcon("venue")}
            riseOnHover
          >
            <Popup>{name}</Popup>
          </Marker>
        ))}
        <MarkerClusterGroup chunkedLoading>
          {spotsNearby.map(({ name, position, type }) => (
            <Marker
              key={name + "_" + position.toString()}
              position={position}
              icon={createSpotMarkerIcon(type)}
            >
              <Popup>
                {name} ({type.split("_").join(" ")})
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};
