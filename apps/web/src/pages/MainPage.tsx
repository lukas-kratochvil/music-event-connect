import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import EventList from "../components/EventList";
import EventMap from "../components/EventMap";

const MainPage = () => {
  // TODO: create page
  return (
    <>
      <ErrorBoundary fallback={<div>Something went wrong while loading events</div>}>
        <Suspense>
          <EventList />
        </Suspense>
      </ErrorBoundary>
      <EventMap />
    </>
  );
};

export default MainPage;
