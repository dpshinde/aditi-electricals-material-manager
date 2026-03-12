import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import AppLayout from "./components/AppLayout";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Dashboard from "./pages/Dashboard";
import GodownDetail from "./pages/GodownDetail";
import Godowns from "./pages/Godowns";
import MaterialDetail from "./pages/MaterialDetail";
import Materials from "./pages/Materials";
import MaterialsOverview from "./pages/MaterialsOverview";
import Movements from "./pages/Movements";
import Notes from "./pages/Notes";
import SiteDetail from "./pages/SiteDetail";
import Sites from "./pages/Sites";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
});

const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});
const sitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sites",
  component: Sites,
});
const siteDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sites/$siteId",
  component: SiteDetail,
});
const godownsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/godowns",
  component: Godowns,
});
const godownDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/godowns/$godownId",
  component: GodownDetail,
});
const companiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/companies",
  component: Companies,
});
const companyDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/companies/$companyId",
  component: CompanyDetail,
});
const materialsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/materials",
  component: Materials,
});
const materialsOverviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/materials-overview",
  component: MaterialsOverview,
});
const materialDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/materials-overview/$materialId",
  component: MaterialDetail,
});
const movementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/movements",
  component: Movements,
});
const notesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notes",
  component: Notes,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  sitesRoute,
  siteDetailRoute,
  godownsRoute,
  godownDetailRoute,
  companiesRoute,
  companyDetailRoute,
  materialsRoute,
  materialsOverviewRoute,
  materialDetailRoute,
  movementsRoute,
  notesRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
