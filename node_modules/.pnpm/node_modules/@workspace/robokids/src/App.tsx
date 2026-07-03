import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";

import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

import Dashboard from "@/pages/student/dashboard";
import Chapters from "@/pages/student/chapters";
import Play from "@/pages/student/play";
import Leaderboard from "@/pages/student/leaderboard";
import Shop from "@/pages/student/shop";
import ArenaStudio from "@/pages/student/arena-studio";
import Inventory from "@/pages/student/inventory";

import AdminStats from "@/pages/admin/stats";
import AdminStudents from "@/pages/admin/students";
import AdminStudentDetail from "@/pages/admin/student-detail";
import AdminStudentForm from "@/pages/admin/student-form";

import { EquipmentProvider } from "@/lib/equipment";
import { useGetMe } from "@workspace/api-client-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

function EquipmentWrapper({ children }: { children: React.ReactNode }) {
  const { data: me } = useGetMe();
  return (
    <EquipmentProvider userId={me?.id}>
      {children}
    </EquipmentProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <Redirect to="/login" />
      </Route>
      <Route>
        {() => (
          <EquipmentWrapper>
            <Layout>
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/chapters" component={Chapters} />
                <Route path="/play/:levelId" component={Play} />
                <Route path="/leaderboard" component={Leaderboard} />
                <Route path="/shop" component={Shop} />
                <Route path="/inventory" component={Inventory} />
                <Route path="/arena-studio" component={ArenaStudio} />
                <Route path="/admin/students/new" component={AdminStudentForm} />
                <Route path="/admin/students/:id" component={AdminStudentDetail} />
                <Route path="/admin/students" component={AdminStudents} />
                <Route path="/admin" component={AdminStats} />
                <Route component={NotFound} />
              </Switch>
            </Layout>
          </EquipmentWrapper>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
