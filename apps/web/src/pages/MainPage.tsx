import PersonalizedEvents from "@/components/PersonalizedEvents";
import EventMap from "../components/EventMap";
import EventsGrid from "../components/EventsGrid";

// TODO: delete
const spotifyAccount = {
  id: "1",
};

const MainPage = () => (
  <>
    <div className="flex flex-col gap-16">
      {spotifyAccount.id && <PersonalizedEvents />}
      <EventsGrid />
      <EventMap />
    </div>
  </>
);

export default MainPage;
