import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import EventGrid from "../components/EventGrid";
import EventMap from "../components/EventMap";

const MainPage = () => (
  <>
    <ErrorBoundary fallback={<div>Something went wrong while loading events</div>}>
      <Suspense>
        <EventGrid />
      </Suspense>
    </ErrorBoundary>
    <EventMap />
  </>
);

export default MainPage;
