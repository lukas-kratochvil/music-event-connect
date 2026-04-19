import type { IEvent, IEventSearch, IEventSearchOptions, IGenre } from "@music-event-connect/shared/api";
import { mecApi } from "./mec-api";

export const searchEvents = async (options: IEventSearchOptions) => {
  const response = await mecApi.post<IEventSearch[]>("events/search", options);
  return response.data;
};

export const fetchEventDetail = async (id: string) => {
  const response = await mecApi.get<IEvent>(`events/${id}`);
  return response.data;
};

export const fetchGenres = async () => {
  const response = await mecApi.get<IGenre[]>("genres");
  return response.data;
};
