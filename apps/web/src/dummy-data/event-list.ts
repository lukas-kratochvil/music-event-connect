import type { EventListItem } from "../components/EventItem";

export const eventList: EventListItem[] = [
  {
    name: "Event",
    ticketUrl: "1",
    startDate: new Date(),
    endDate: new Date(),
    artists: ["Artist 1", "Artist 2", "Artist 3"],
    venues: [
      {
        name: "Fuchs2",
        city: "Prague",
      },
    ],
  },
  {
    name: "Event + support: XX",
    ticketUrl: "2",
    startDate: new Date(),
    endDate: undefined,
    artists: ["Artist 10", "Artist 20"],
    venues: [
      {
        name: "Bike Jesus",
        city: "Prague",
      },
    ],
  },
];
