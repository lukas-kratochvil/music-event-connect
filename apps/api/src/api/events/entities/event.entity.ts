import type { IEvent } from "@music-event-connect/shared/api";
import { ItemAvailability } from "@music-event-connect/shared/interfaces";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class EventAccount {
  @ApiProperty()
  name: string;

  @ApiProperty()
  url: string;
}

class EventArtist {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: "string", isArray: true })
  genres?: string[];

  @ApiPropertyOptional({ type: "string", isArray: true })
  urls?: string[];

  @ApiPropertyOptional({ type: () => EventAccount, isArray: true })
  accounts?: EventAccount[];

  @ApiPropertyOptional({ type: "string", isArray: true })
  images?: string[];
}

class EventAddress {
  @ApiPropertyOptional({ type: "string" })
  street: string | undefined;

  @ApiProperty()
  locality: string;

  @ApiProperty()
  country: string;
}

class EventVenue {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: "number" })
  latitude: number;

  @ApiProperty({ type: "number" })
  longitude: number;

  @ApiProperty({ type: () => EventAddress })
  address: EventAddress;
}

class EventOffer {
  @ApiProperty()
  url: string;

  @ApiProperty({ enum: ItemAvailability })
  availability: ItemAvailability;
}

export class Event implements IEvent {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: Date })
  doorTime: Date | undefined;

  @ApiProperty({ type: Date })
  startDate: Date;

  @ApiPropertyOptional({ type: Date })
  endDate: Date | undefined;

  @ApiPropertyOptional({ type: "string", isArray: true })
  images?: string[];

  @ApiPropertyOptional({ type: () => EventArtist, isArray: true })
  artists?: EventArtist[];

  @ApiProperty({ type: () => EventVenue, isArray: true })
  venues: EventVenue[];

  @ApiProperty({ type: () => EventOffer })
  offer: EventOffer;
}
