export type MusicEventDTO = {
  id: string;
  name: string;
  doorTime: Date | undefined;
  startDate: Date;
  endDate: Date | undefined;
  images: string[];
  artists: {
    name: string;
    genres: string[];
    url: string | undefined;
    accounts: {
      name: string;
      url: string;
    }[];
    images: string[];
  }[];
  venues: {
    name: string;
    latitude: number;
    longitude: number;
    address: {
      street: string | undefined;
      locality: string;
      country: string;
    };
  }[];
  offers: {
    url: string;
    availability: "InStock" | "SoldOut";
  }[];
};
