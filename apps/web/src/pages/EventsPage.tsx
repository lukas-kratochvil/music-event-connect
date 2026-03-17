import EventsGrid from "@/components/EventsGrid";
import PersonalizedEvents from "@/components/PersonalizedEvents";
import { useAuth } from "@/hooks/auth/auth";

const EventsPage = () => {
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-16">
      {user && <PersonalizedEvents />}
      <EventsGrid />
    </div>
  );
};

export default EventsPage;
