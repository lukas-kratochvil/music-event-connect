import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const EventMap = () => {
  // TODO: create component
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Events Map</h2>
        <p className="text-muted-foreground mt-2">Find your event on the map.</p>
      </div>
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: 500, height: 500 }} // size must be specified to display the map in the UI
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[51.505, -0.09]}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default EventMap;
