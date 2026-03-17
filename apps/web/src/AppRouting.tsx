import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Layout } from "./layouts/Layout";
import { RoutingPath } from "./utils/routing-paths";

const EventsPage = lazy(() => import("./pages/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const OidcCallbackPage = lazy(() => import("./pages/OidcCallbackPage"));

const AppRouting = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <Navigate
              to={RoutingPath.EVENTS}
              replace
            />
          }
        />
        <Route
          path={RoutingPath.OIDC_LOGIN}
          element={<OidcCallbackPage />}
        />
        <Route
          path={RoutingPath.EVENTS}
          element={<EventsPage />}
        />
        <Route
          path={`${RoutingPath.EVENTS}/:id` as const}
          element={<EventDetailPage />}
        />
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRouting;
