import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "@xyflow/react/dist/style.css";
import { ProtectedRoute } from "./component/ProtectedRoute";
import { PriceTicker } from "./component/PriceTicker";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { WorkflowDetailsPage } from "./pages/WorkflowDetailsPage";
import { WorkflowExecutionsPage } from "./pages/WorkflowExecutionsPage";
import { ExecutionsPage } from "./pages/ExecutionsPage";

const CreateWorkflow = lazy(async () => {
  const module = await import("./component/CreateWorkflow");
  return { default: module.CreateWorkflow };
});

export default function App() {
  return (
    <BrowserRouter>
      <PriceTicker />
      <div className="app-with-ticker">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/executions" element={<ExecutionsPage />} />
            <Route
              path="/create-workflow"
              element={
                <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading workflow builder...</div>}>
                  <CreateWorkflow />
                </Suspense>
              }
            />
            <Route path="/workflows/:workflowId" element={<WorkflowDetailsPage />} />
            <Route path="/workflows/:workflowId/executions" element={<WorkflowExecutionsPage />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
 