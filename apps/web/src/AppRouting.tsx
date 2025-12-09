import { lazy } from "react";
import { Route, Routes } from "react-router";
import { Layout } from "./layouts/Layout";
import { RoutingPath } from "./routing-paths";

const MainPage = lazy(() => import("./pages/MainPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const AppRouting = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route
        path={RoutingPath.MAIN}
        element={<MainPage />}
      />
      <Route
        path={RoutingPath.EVENT_DETAIL}
        element={<EventDetailPage />}
      />
      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Route>
  </Routes>
);

export default AppRouting;
