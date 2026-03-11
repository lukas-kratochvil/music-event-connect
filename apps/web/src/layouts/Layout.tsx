import { Suspense } from "react";
import { Outlet } from "react-router";
import Header from "../components/Header";
import SuspensePage from "../pages/SuspensePage";

export const Layout = () => (
  <>
    <Header />
    <div className="min-h-screen bg-muted/20">
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<SuspensePage />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  </>
);
