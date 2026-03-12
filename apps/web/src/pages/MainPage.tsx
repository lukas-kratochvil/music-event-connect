import EventMap from "../components/EventMap";
import EventsGrid from "../components/EventsGrid";

const MainPage = () => (
  <>
    <div className="flex flex-col gap-16">
      <EventsGrid />
      <EventMap />
    </div>
  </>
);

export default MainPage;
