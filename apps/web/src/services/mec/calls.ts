import type { DateRange } from "react-day-picker";
import { mecApi } from "./mec-api";
import type { MusicEventDTO, MusicEventSearchDTO } from "./response-types";

type EventsFilters = {
  artistNames?: string[];
  startDate?: DateRange;
};

export const searchEvents = async (filters?: EventsFilters) => {
  const response = await mecApi.post<MusicEventSearchDTO[]>("events/search", {
    filters,
    sorters: [
      {
        propertyName: "startDate",
      },
    ],
  });
  return response.data;
};

export const fetchEventDetail = async (id: string) => {
  const response = await mecApi.get<MusicEventDTO>(`events/${id}`);
  return response.data;
};
