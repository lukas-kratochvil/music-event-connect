import { Suspense } from "react";
import { Outlet } from "react-router";
import Header from "../components/Header";
import SuspensePage from "../pages/SuspensePage";

export const Layout = () => (
  <>
    <Header />
    <main>
      <Suspense fallback={<SuspensePage />}>
        <Outlet />
      </Suspense>
    </main>
  </>
);
