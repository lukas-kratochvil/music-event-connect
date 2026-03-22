import { compareAsc, endOfDay, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";

// TODO: fetch data from the API

type EventsFilters = {
  artistNames?: string[];
  startDate?: DateRange;
};

// TODO: fetch events, filter events by artist names, add pagination?
export const fetchEvents = async (filters?: EventsFilters) => {
  const events = [
    {
      id: "tm-1",
      name: "P/\\ST + Hentai Corporation + SEBE",
      offers: [
        {
          url: "https://ticketmaster.cz/dummy-event/buy",
          availability: "SoldOut",
        },
      ],
      startDate: new Date("2026-03-11T19:00:00Z"),
      endDate: new Date("2026-03-11T22:00:00Z"),
      artists: [{ name: "P/\\ST" }, { name: "Hentai Corporation" }, { name: "SEBE" }],
      venues: [
        {
          name: "Lucerna Music Bar",
          address: {
            locality: "Prague",
          },
        },
      ],
      images: ["https://goout.net/cdn-cgi/image/format=auto,width=383/i/137/1376340-383.jpg"],
    },
    {
      id: "go-32",
      name: "Vinyla Night: Gufrau + post-hudba + matyášovi kamarádi + Miss Petty + Rivermoans + teige + další",
      offers: [
        {
          url: "https://goout.net/cs/listky/vinyla-night-gufrau+post-hudba+matyasovi-kamaradi+miss-petty+/rvhjb/",
          availability: "InStock",
        },
      ],
      startDate: new Date("2026-04-13T19:00:00Z"),
      endDate: undefined,
      artists: [
        { name: "post-hudba" },
        { name: "Gufrau" },
        { name: "matyášovi kamarádi" },
        { name: "teige" },
        { name: "Rivermoans" },
        { name: "Miss Petty" },
      ],
      venues: [
        {
          name: "ARCHA+",
          address: {
            locality: "Prague",
          },
        },
      ],
      images: ["https://goout.net/cdn-cgi/image/format=auto,width=383/i/133/1332707-383.jpg"],
    },
  ] as const;
  return [...events, ...events, ...events]
    .map((event, i) => ({
      ...event,
      id: event.id + i,
    }))
    .filter((event) => {
      if (!filters) {
        return true;
      }
      const startDate = {
        from: filters.startDate?.from ? startOfDay(filters.startDate.from) : undefined,
        to: filters.startDate?.to ? endOfDay(filters.startDate.to) : undefined,
      };
      if (!startDate) {
        return true;
      }

      if (startDate.from && !startDate.to) {
        return compareAsc(startDate.from, event.startDate) <= 0;
      }

      if (startDate.from && startDate.to) {
        return compareAsc(startDate.from, event.startDate) <= 0 && compareAsc(event.startDate, startDate.to) <= 0;
      }

      return true;
    });
};

// TODO: fetch event detail
export const fetchEventDetail = async (_id: string) => {
  return {
    name: "Neon Nights: Prague Summer Soundwave",
    startDate: new Date("2026-07-15T21:00:00+02:00"),
    endDate: new Date("2026-07-16T04:00:00+02:00"),
    doorTime: new Date("2026-07-15T19:30:00+02:00"),
    images: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1605020420620-20c943cc4669?q=80&w=800&auto=format&fit=crop",
    ],
    offers: [
      {
        url: "https://ticketmaster.cz/dummy-event/buy",
        availability: "InStock",
      },
    ],
    venues: [
      {
        name: "Roxy Prague",
        latitude: 50.0906,
        longitude: 14.4258,
        address: {
          street: "Dlouhá 33",
          locality: "Prague",
          country: "CZ",
        },
      },
      {
        name: "Lucerna Music Bar",
        latitude: 50.081325,
        longitude: 14.425436,
        address: {
          street: "Vodičkova 36",
          locality: "Prague",
          country: "CZ",
        },
      },
      {
        name: "Roxy Prague",
        latitude: 50.0906,
        longitude: 14.4258,
        address: {
          street: "Dlouhá 33",
          locality: "Prague",
          country: "Czechia",
        },
      },
      {
        name: "Lucerna Music Bar aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        latitude: 50.081325,
        longitude: 14.425436,
        address: {
          street: "Vodičkova 36",
          locality: "Prague",
          country: "Czechia",
        },
      },
    ],
    artists: [
      {
        name: "The Midnight Echoes",
        genres: ["Synthwave", "Retrowave", "Electronic"],
        url: "https://themidnightechoes.dummy.com",
        images: [
          "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwallpapercosmos.com%2Fw%2Ffull%2F6%2Fc%2Fc%2F1173899-3000x2154-desktop-hd-music-band-background.jpg&f=1&nofb=1&ipt=5801e642db425f2d1c83749f59210f9fad91490ca337e82df60d72a32fe7d2dc",
          "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.mm.bing.net%2Fth%2Fid%2FOIP.dPk984Jw3S9H8i0BA09CpAHaE0%3Fpid%3DApi&f=1&ipt=26e67514233215d1d32bf46a8e9dff2d9db721a21567b361376e23bd7ffd007b",
        ],
        accounts: [
          {
            accountServiceHomepage: "https://spotify.com",
            accountName: "Spotify",
            url: "https://open.spotify.com/artist/dummy1",
          },
          {
            accountServiceHomepage: "https://youtube.com",
            accountName: "YouTube",
            url: "https://youtube.com/c/dummy1",
          },
        ],
      },
      {
        name: "DJ Lumina",
        genres: ["Techno", "Cyberpunk", "Dark Clubbing"],
        url: "https://lumina-music.dummy.cz",
        images: [
          "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Flookaside.fbsbx.com%2Flookaside%2Fcrawler%2Fmedia%2F%3Fmedia_id%3D1263439365789534&f=1&nofb=1&ipt=9657b6ceec9dbb8c879636b50ff6719812c982616d414c665309defa0e8c91a9",
        ],
        accounts: [
          {
            accountServiceHomepage: "https://soundcloud.com",
            accountName: "SoundCloud",
            url: "https://soundcloud.com/djlumina-dummy",
          },
          {
            accountServiceHomepage: "https://instagram.com",
            accountName: "Instagram",
            url: "https://instagram.com/djlumina",
          },
        ],
      },
    ],
  };
};
