import PersonalizedEvents from "@/components/PersonalizedEvents";
import EventsGrid from "../components/EventsGrid";

// TODO: delete
const spotifyAccount = {
  id: "1",
};

const MainPage = () => (
  <div className="flex flex-col gap-16">
    {spotifyAccount.id && <PersonalizedEvents />}
    <EventsGrid />
  </div>
);

export default MainPage;
