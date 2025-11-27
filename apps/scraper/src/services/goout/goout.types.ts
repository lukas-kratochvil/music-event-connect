/**
 * Published Linked Data for an event.
 */
export type GoOutEvent = {
  "@context": string;
  "@type": "Event";
  name: string;
  description: string;
  url: string;
  image: string;
  eventStatus: string;
  eventAttendanceMode: string;
  startDate: string;
  endDate: string;
  location: Location;
  offers: Offer[];
};

type Location = {
  "@type": "Place";
  name: string;
  address: Address;
};

type Address = {
  "@type": "PostalAddress";
  addressLocality: string;
  /**
   * Street address can be an empty string.
   */
  streetAddress: string;
};

type Offer = {
  "@type": "Offer";
  url: string;
  availability: "InStock" | "OutOfStock";
  /**
   * Price is either stringified number (`"10"`) or price range (`"10-20"`).
   */
  price: string;
  priceCurrency: string;
};
