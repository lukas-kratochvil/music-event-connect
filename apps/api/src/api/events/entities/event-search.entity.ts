import type { IEventSearch } from "@music-event-connect/shared/api";
import { ItemAvailability } from "@music-event-connect/shared/interfaces";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class EventSearchArtist {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: "string", isArray: true })
  images?: string[];
}

class EventSearchAddress {
  @ApiProperty()
  locality: string;

  @ApiProperty()
  country: string;
}

class EventSearchVenue {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: () => EventSearchAddress })
  address: EventSearchAddress;
}

class EventSearchOffer {
  @ApiProperty()
  url: string;

  @ApiProperty({ enum: ItemAvailability })
  availability: ItemAvailability;
}

export class EventSearch implements IEventSearch {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: Date })
  startDate: Date;

  @ApiPropertyOptional({ type: "string", isArray: true })
  images?: string[];

  @ApiPropertyOptional({ type: () => EventSearchArtist, isArray: true })
  artists?: EventSearchArtist[];

  @ApiProperty({ type: () => EventSearchVenue, isArray: true })
  venues: EventSearchVenue[];

  @ApiProperty({ type: () => EventSearchOffer, isArray: true })
  offers: EventSearchOffer[];
}
