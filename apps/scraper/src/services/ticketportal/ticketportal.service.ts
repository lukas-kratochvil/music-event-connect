import {
  type MusicEventsQueueDataType,
  type MusicEventsQueueNameType,
  MusicEventsQueue,
} from "@music-event-connect/core/queue";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";
import { addDays, set } from "date-fns";
import type { BrowserContext, Page } from "puppeteer";
import type { ConfigSchema } from "../../config/schema";
import type { ICronJobService } from "../../cron/cron-job-service.interface";
import { SharedBrowserService } from "../../puppeteer/shared-browser.service";
import { CZ_TIMEZONE, getLocalizedDate } from "../../utils/date";

@Injectable()
export class TicketportalService implements ICronJobService {
  readonly #logger = new Logger(TicketportalService.name);
  readonly #baseUrl: string;
  readonly #scheduledTime: NonNullable<ConfigSchema["services"]["ticketportal"]>["scheduledTime"];

  #isInProcess = false;
  #runDate = new Date();

  readonly jobName = "ticketportal";
  readonly jobType = "timeout";

  constructor(
    @InjectQueue(MusicEventsQueue.name)
    private readonly musicEventsQueue: Queue<
      MusicEventsQueueDataType,
      MusicEventsQueueDataType,
      MusicEventsQueueNameType
    >,
    private readonly sharedBrowser: SharedBrowserService,
    config: ConfigService<ConfigSchema, true>
  ) {
    const ticketportalConfig = config.get("services.ticketportal", { infer: true });
    if (!ticketportalConfig) {
      throw new Error("Config not present!");
    }
    this.#baseUrl = ticketportalConfig.url;
    this.#scheduledTime = ticketportalConfig.scheduledTime;
  }

  getRunDate(): Date {
    return this.#runDate;
  }

  isInProcess() {
    return this.#isInProcess;
  }

  #getUniqueEnGenreNames(csGenreNames: string): string[] {
    return [
      ...new Set(
        csGenreNames
          .split("/")
          .map((genre) => genre.trim())
          .filter((genre) => genre !== "")
          // map genre names to MusicBrainz RDF genre names
          .map((genre) => {
            const g = genre.toLowerCase();
            switch (g) {
              case "alternativní":
                return "alternative music";
              case "elektronika":
                return "electronic";
              case "filmová hudba":
                return "cinematic classical";
              case "hip-hop":
                return "hip hop";
              case "klasická":
                return "classical";
              case "hudba pro děti":
                return "children's music";
              default:
                return g;
            }
          })
      ),
    ];
  }

  async #getVenueData(
    venueUrl: string,
    browserCtx: BrowserContext
  ): Promise<MusicEventsQueueDataType["event"]["venues"][number]> {
    if (!venueUrl) {
      throw new Error("Venue URL is undefined!");
    }

    const venuePage = await browserCtx.newPage();
    let venue: MusicEventsQueueDataType["event"]["venues"][number];

    try {
      if (!(await venuePage.goto(venueUrl))) {
        throw new Error("Cannot navigate to the URL: " + venueUrl);
      }

      const name = await venuePage.$eval(".detail-content > h1", (elem) => elem.innerText.trim());

      if (!name) {
        throw new Error("Missing venue name.");
      }

      const addressBlock = await venuePage.$(
        "::-p-xpath(//div[contains(@class, 'detail-content')]/section[@id='shortInfo']/descendant::td[2])"
      );

      if (!addressBlock) {
        throw new Error("Missing venue address data!");
      }

      const fullAddress = await addressBlock.evaluate((elem) => elem.firstChild?.textContent?.trim());

      if (!fullAddress) {
        throw new Error("Missing venue address data!");
      }

      const [addressToProcess, city] = fullAddress.split(",").map((e) => e.trim());
      const address = addressToProcess?.split("\n").at(0)?.trim();

      if (!city) {
        throw new Error("Missing venue city.");
      }
      if (!address) {
        throw new Error("Missing venue address.");
      }

      venue = {
        name,
        latitude: undefined,
        longitude: undefined,
        address: {
          country: "CZ",
          locality: city,
          street: address,
        },
      };

      const mapUrl = await addressBlock.$eval("a", (elem) => elem.href);
      const daddr = new URL(mapUrl).searchParams.get("daddr");

      if (daddr) {
        const [latitude, longitude] = daddr.split(",").map((coor) => +coor);

        if (latitude && longitude) {
          venue.latitude = latitude;
          venue.longitude = longitude;
        }
      }
    } finally {
      await venuePage.close();
    }

    return venue;
  }

  async #getUniqueEventImages(page: Page): Promise<string[]> {
    const images: string[] = [];

    try {
      const mainImage = await page.$eval("div.detail-header > img", (elem) => elem.src.trim());
      images.push(mainImage);
      const otherImages = await page.$$eval(
        "::-p-xpath(//section[@id = 'galeria']/div[contains(@class, 'grid')]/div[contains(@class, 'grid-item') and not(contains(@class, 'video'))]/a)",
        (elem) => (elem as HTMLAnchorElement[]).map((a) => a.href)
      );
      images.push(...otherImages);
    } catch (e) {
      /* event images not found */
      if (e instanceof Error) {
        this.#logger.error("[" + page.url() + "]: " + e.message, e.stack);
      } else {
        this.#logger.error("[" + page.url() + "]" + String(e));
      }
    }

    return [...new Set(images)];
  }

  async #getMusicEvents(
    page: Page,
    musicEventUrl: string,
    genreName: string,
    multipleEventDatesChecker: Set<string>
  ): Promise<MusicEventsQueueDataType[]> {
    if (!(await page.goto(musicEventUrl))) {
      throw new Error("Cannot navigate to the URL: " + musicEventUrl);
    }

    const tickets = await page.$$("::-p-xpath(.//section[@id='vstupenky']/div[contains(@id, 'vstupenka-')])");

    if (tickets.length > 1) {
      if (multipleEventDatesChecker.has(musicEventUrl)) {
        return [];
      }

      multipleEventDatesChecker.add(musicEventUrl);
    }

    const images = await this.#getUniqueEventImages(page);
    const musicEventData: Pick<MusicEventsQueueDataType, "event">["event"][] = [];

    for (const ticket of tickets) {
      try {
        const id = await ticket.evaluate((el) => el.getAttribute("performance"));

        if (!id) {
          throw new Error("[" + musicEventUrl + "] - Missing event id.");
        }

        const eventName = await ticket.$eval(".ticket-info > .detail > .event", (elem) =>
          (elem as HTMLElement).innerText.trim()
        );

        const startDateStr = await ticket.$eval(
          "::-p-xpath(.//div[contains(@class, 'ticket-date')]/div[@class='date']/div[@class='day'])",
          (elem) => elem.getAttribute("content")?.trim()
        );

        if (!startDateStr) {
          throw new Error("[" + musicEventUrl + "] - Missing event start date.");
        }

        const startDateTime = getLocalizedDate(startDateStr, "yyyy-MM-dd'T'HH:mm", CZ_TIMEZONE);

        let doorDatetime: Date | undefined;
        try {
          const doorTimeStr = await ticket.$eval(
            "::-p-xpath(.//div[contains(@class, 'ticket-info')]/div[@class='detail']/div[@itemprop='name']/div[contains(@class, 'popiska')])",
            (elem) => (elem as HTMLDivElement).innerText.match(/\b(?:doors|vstup)\s+(\d{1,2}:\d{2})/i)?.at(1)
          );

          if (doorTimeStr) {
            const datePart = startDateStr.split("T")[0];
            const [hours, minutes] = doorTimeStr.split(":").map((val) => val.padStart(2, "0"));
            doorDatetime = getLocalizedDate(`${datePart}T${hours}:${minutes}`, "yyyy-MM-dd'T'HH:mm", CZ_TIMEZONE);
          }
        } catch {
          /* door time not found */
        }

        const venueBlock = await ticket.$(
          "::-p-xpath(.//div[contains(@class, 'ticket-info')]/div[@class='detail']/div[@itemprop='location'])"
        );

        if (!venueBlock) {
          throw new Error("[" + musicEventUrl + "] - Missing venue info.");
        }

        const venueUrl = await venueBlock.$eval("a.building", (elem) => elem.href.trim());
        let venueData: MusicEventsQueueDataType["event"]["venues"][number];

        try {
          venueData = await this.#getVenueData(venueUrl, page.browserContext());
        } catch {
          const venueName = await venueBlock.$eval("a.building > span", (elem) => elem.innerText.trim());
          const venueCity = await venueBlock.$eval("::-p-xpath(./div[@itemprop='address']//span)", (elem) =>
            (elem as HTMLSpanElement).innerText.trim()
          );

          venueData = {
            name: venueName,
            latitude: undefined,
            longitude: undefined,
            address: {
              country: "CZ",
              locality: venueCity,
              street: undefined,
            },
          };
        }

        // TODO: extract artists (their name and country) from the event name or from the event description
        const artistNames: string[] = [];

        if (!["Vážná hudba", "Pro děti", "Párty", "Disco"].includes(genreName)) {
          artistNames.push(
            eventName
              .split(/[,:;(-]/)
              .at(0)
              ?.trim() as string
          );
        }

        const artists = artistNames.map((artistName): MusicEventsQueueDataType["event"]["artists"][number] => ({
          name: artistName,
          genres: this.#getUniqueEnGenreNames(genreName),
          webSites: [],
          images: [], // Ticketportal has event images only
        }));

        const soldOutBox = await ticket.$("div.ticket-info > div.status > div.status-content");

        musicEventData.push({
          id,
          name: eventName,
          url: musicEventUrl,
          doorTime: doorDatetime,
          startDate: startDateTime,
          endDate: undefined,
          artists,
          venues: [{ ...venueData }],
          ticket: {
            url: musicEventUrl,
            availability: soldOutBox === null ? "InStock" : "SoldOut",
          },
          images,
        });
      } catch (e) {
        if (e instanceof Error) {
          this.#logger.error("[" + musicEventUrl + "]: " + e.message, e.stack);
        } else {
          this.#logger.error("[" + musicEventUrl + "]" + String(e));
        }
      }
    }
    return musicEventData.map((event): MusicEventsQueueDataType => ({ event }));
  }

  async run() {
    const browserCtx = await this.sharedBrowser.acquireContext();

    try {
      this.#isInProcess = true;
      const page = await browserCtx.newPage();

      // load page and wait for a dynamic content (JS) to be loaded properly before continuing
      if (!(await page.goto(this.#baseUrl, { waitUntil: "networkidle2", timeout: 60000 }))) {
        throw new Error(`No response from the base url: ${this.#baseUrl}.`);
      }

      this.#logger.log("Loaded initial page: " + this.#baseUrl);
      await page
        .locator("::-p-xpath(//nav[contains(@class, 'tp-category-bar')]//ul/li/span[contains(text(), 'Koncerty')])")
        .click();
      this.#logger.log("Applied music event filter");

      // SETUP
      // 1) deny cookies
      try {
        await page.locator("button#didomi-notice-learn-more-button").click();
        await page.locator("button#btn-toggle-disagree").click();
        this.#logger.log("Denied cookies and closed the cookie dialog");
      } catch {
        /* cookies dialog not displayed */
      }

      // 2) get music genre filters
      const genreNames = await page.$$eval(
        "::-p-xpath(//ul[contains(@class, 'tp-subcategory-dropdown')]/li/button[not(contains(@class, 'tp-subcategory-pill--all'))])",
        (elems) => elems.map((elem) => (elem as HTMLButtonElement).innerText.trim())
      );

      // GET MUSIC EVENTS
      this.#logger.log("Music events scraping started");
      const multipleEventDatesChecker = new Set<string>();

      for (const genreName of genreNames) {
        try {
          await page
            .locator(
              `::-p-xpath(//ul[contains(@class, 'tp-subcategory-dropdown')]/li/button[contains(text(), '${genreName}')])`
            )
            .click();
          const panelBlocks = await page.$$(
            "::-p-xpath(//div[contains(@class, 'panel-blok') and not(contains(@class, 'super-nove-top') or contains(@class, 'donekonecna'))])"
          );

          for (const panelBlock of panelBlocks) {
            // show all music events in this panel block
            try {
              const nextButton = await panelBlock.$("button#btn-load");
              await nextButton?.click();
            } catch (e) {
              if (e instanceof Error) {
                this.#logger.error("[" + genreName + "] - Panel next button error: " + e.message, e.stack);
              } else {
                this.#logger.error("[" + genreName + "] - Panel next button error: " + String(e));
              }
            }

            // get all music event links from the panel block
            const newUrls = await panelBlock.$$eval("div.koncert > div.thumbnail > a", (elems) =>
              elems.map((elem) => elem.href)
            );

            // extract music event data and add it to the queue
            for (const url of newUrls) {
              const musicEventPage = await browserCtx.newPage();

              try {
                const musicEvents = await this.#getMusicEvents(
                  musicEventPage,
                  url,
                  genreName,
                  multipleEventDatesChecker
                );
                await this.musicEventsQueue.addBulk(
                  musicEvents.map((event) => ({ name: "ticketportal", data: event }))
                );
              } catch (e) {
                if (e instanceof Error) {
                  this.#logger.error("[" + url + "]: " + e.message, e.stack);
                } else {
                  this.#logger.error("[" + url + "]: " + String(e));
                }
              } finally {
                await musicEventPage.close();
              }
            }
          }
        } catch (e) {
          if (e instanceof Error) {
            this.#logger.error(e.message, e.stack);
          } else {
            this.#logger.error(String(e));
          }
        } finally {
          multipleEventDatesChecker.clear();
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        this.#logger.error(e.message, e.stack);
      } else {
        this.#logger.error(String(e));
      }
    } finally {
      await this.sharedBrowser.releaseContext(browserCtx);
      this.#isInProcess = false;
      this.#setNextRunDate();
      this.#logger.log("Music events scraping finished");
    }
  }

  #setNextRunDate() {
    const now = new Date();
    let runDate = set(now, {
      ...this.#scheduledTime,
      milliseconds: 0,
    });

    while (runDate.getTime() <= Date.now()) {
      runDate = addDays(runDate, 1);
    }

    this.#runDate = runDate;
  }
}
