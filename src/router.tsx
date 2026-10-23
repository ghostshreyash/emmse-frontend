import { createBrowserRouter } from "react-router"

import { EnterpriseOnly, PublicOnly, RequireAuth } from "@/components/auth/require-auth"
import { LoginPage } from "@/pages/auth/login"
import { VerifyOtpPage } from "@/pages/auth/verify-otp"
import { ForgotPasswordPage } from "@/pages/auth/forgot-password"
import { VerifyResetPage } from "@/pages/auth/verify-reset"
import { ResetPasswordPage } from "@/pages/auth/reset-password"
import { RegisterPage } from "@/pages/auth/register"
import { AccountRecoveryPage } from "@/pages/auth/account-recovery"
import { ComingSoonPage } from "@/pages/coming-soon"
import { DashboardPage } from "@/pages/dashboard"
import { PlantsPanelPage } from "@/pages/plants-panel"
import { PlantsListPage } from "@/pages/plants-list"
import { PlantDetailsPage } from "@/pages/plant-details"
import { AddPlantPage } from "@/pages/plant-onboarding/add-plant"
import { AppLayout } from "@/layouts/app-layout"
import { sections } from "@/config/navigation"
import { ProfilePage } from "@/pages/profile"
import { TaskDetailsPage } from "@/pages/task-details"
import { TasksPage } from "@/pages/tasks"
import { AssetsPage } from "@/pages/assets/assets"
import { AssetOnboardingPage } from "@/pages/assets/asset-onboarding"
import { AssetDetailPage } from "@/pages/assets/asset-detail"
import { AddTaskPage } from "@/pages/add-task"
import { InspectionsPage } from "@/pages/inspections"
import { ReportsPage } from "@/pages/reports"
import { ReportDetailsPage } from "@/pages/report-details"
import { SupportTicketsPage } from "@/pages/support-tickets"
import { SupportTicketDetailsPage } from "@/pages/support-ticket-details"
import { InspectionDetailsPage } from "@/pages/inspection-details"
import { AddInspectionPage } from "@/pages/add-inspection"

/** Sections with a real screen; every other section gets a placeholder page */
const built = new Set(["/", "/plants-list", "/assets", "/tasks", "/inspection-activities", "/reports", "/support-tickets", "/support"])

export const router = createBrowserRouter([
  { path: "/login", element: <PublicOnly><LoginPage /></PublicOnly> },
  { path: "/login/verify", element: <PublicOnly><VerifyOtpPage /></PublicOnly> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/forgot-password/verify", element: <VerifyResetPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  // "Request Access" for an enterprise that is not onboarded yet
  { path: "/register", element: <RegisterPage /> },
  { path: "/account-recovery", element: <AccountRecoveryPage /> },

  // The portal itself, behind sign-in
  {
    element: <RequireAuth />,
    children: [
      // A plant-level user's first screen after sign-in: full page, outside the app shell
      { path: "plants", element: <PlantsPanelPage /> },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "profile", element: <ProfilePage /> },
          {
            // The Plants register is the enterprise's; an EMMSE-0 user only sees their picked plant
            element: <EnterpriseOnly />,
            children: [
              { path: "plants-list", element: <PlantsListPage /> },
              /* "add" sits above ":id" so it is never read as a plant code */
              { path: "plants-list/add", element: <AddPlantPage /> },
              { path: "plants-list/:id", element: <PlantDetailsPage /> },
            ],
          },
          { path: "assets", element: <AssetsPage /> },
          /* Asset Onboarding (ported from EVITA); "add" sits above ":id" so it is never read as an Asset ID */
          { path: "assets/add", element: <AssetOnboardingPage /> },
          { path: "assets/:id", element: <AssetDetailPage /> },
          /* The same wizard, filled in with what the asset holds */
          { path: "assets/:id/edit", element: <AssetOnboardingPage /> },
          { path: "tasks", element: <TasksPage /> },
          { path: "tasks/add", element: <AddTaskPage /> },
          { path: "tasks/:id", element: <TaskDetailsPage /> },
          { path: "inspection-activities", element: <InspectionsPage /> },
          { path: "inspection-activities/add", element: <AddInspectionPage /> },
          { path: "inspection-activities/:id", element: <InspectionDetailsPage /> },
          { path: "reports", element: <ReportsPage /> },
          // One asset's record: its detail and the three documents against it
          { path: "reports/:assetId", element: <ReportDetailsPage /> },
          { path: "support-tickets", element: <SupportTicketsPage /> },
          { path: "support-tickets/:id", element: <SupportTicketDetailsPage /> },
          /*
           * Split out of the bundle, as EVITA splits its Contact screen: this is
           * the only screen that reads the whole FAQ, and importing it here put
           * all 99 answers into the entry chunk - which also took them out of
           * the help bubble's own lazy chunk, since they were already loaded.
           */
          { path: "support", lazy: async () => ({ Component: (await import("@/pages/support")).SupportPage }) },
          // Remaining sections show a placeholder until their screens are built
          ...Object.values(sections)
            .filter((item) => !built.has(item.path))
            .map((item) => ({ path: item.path.slice(1), element: <ComingSoonPage title={item.title} /> })),
          { path: "*", element: <ComingSoonPage title="Page not found" /> },
        ],
      },
    ],
  },
])
