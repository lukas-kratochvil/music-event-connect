// TODO: fetch data from the API
const events = [
  {
    id: "tm-1",
    name: "P/\\ST + Hentai Corporation + SEBE",
    ticketUrl: "1",
    isSoldOut: true,
    startDate: new Date("2026-03-11T19:00:00Z"),
    endDate: new Date("2026-03-11T22:00:00Z"),
    artists: ["P/\\ST", "Hentai Corporation", "SEBE"],
    venues: [
      {
        name: "Lucerna Music Bar",
        city: "Prague",
      },
    ],
    images: ["https://goout.net/cdn-cgi/image/format=auto,width=383/i/137/1376340-383.jpg"],
  },
  {
    id: "go-32",
    name: "Vinyla Night: Gufrau + post-hudba + matyášovi kamarádi + Miss Petty + Rivermoans + teige + další",
    ticketUrl: "https://goout.net/cs/listky/vinyla-night-gufrau+post-hudba+matyasovi-kamaradi+miss-petty+/rvhjb/",
    isSoldOut: false,
    startDate: new Date("2026-03-13T19:00:00Z"),
    endDate: undefined,
    artists: ["post-hudba", "Gufrau", "matyášovi kamarádi", "teige", "Rivermoans", "Miss Petty"],
    venues: [
      {
        name: "ARCHA+",
        city: "Prague",
      },
    ],
    images: ["https://goout.net/cdn-cgi/image/format=auto,width=383/i/133/1332707-383.jpg"],
  },
] as const;

// TODO: filter events by artist names
export const fetchEvents = async (_artistNames?: string[]) => [...events, ...events, ...events];
