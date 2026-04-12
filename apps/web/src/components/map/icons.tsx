import type { SpotNearby } from "@music-event-connect/shared/api";
import { divIcon } from "leaflet";
import { MapPin, type LucideProps } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

const ICON_SIZE = 36;

const COMMON_ICON_PROPS: LucideProps = {
  size: ICON_SIZE,
  fillOpacity: 0.2,
};

const getIcon = (type: SpotNearby) => {
  switch (type) {
    case "bus_stop":
    case "tram_stop":
    case "subway_station":
      return (
        <MapPin
          {...COMMON_ICON_PROPS}
          color="blue"
          fill="blue"
        />
      );
    case "bar":
    case "pub":
    case "restaurant":
      return (
        <MapPin
          {...COMMON_ICON_PROPS}
          color="orange"
          fill="orange"
        />
      );
  }
};

export const createSpotMarkerIcon = (type: SpotNearby) =>
  divIcon({
    html: renderToStaticMarkup(getIcon(type)),
    className: "custom-lucide-icon", // remove default leaflet CSS styles
    iconSize: [ICON_SIZE, ICON_SIZE / 2],
    iconAnchor: [ICON_SIZE / 2, ICON_SIZE],
  });
