import { createBrowserRouter } from "react-router"

import { PublicOnly, RequireAuth } from "@/components/auth/require-auth"
import { LoginPage } from "@/pages/auth/login"
import { VerifyOtpPage } from "@/pages/auth/verify-otp"
import { ForgotPasswordPage } from "@/pages/auth/forgot-password"
import { VerifyResetPage } from "@/pages/auth/verify-reset"
import { ResetPasswordPage } from "@/pages/auth/reset-password"
import { RegisterPage } from "@/pages/auth/register"
import { AccountRecoveryPage } from "@/pages/auth/account-recovery"
import { ComingSoonPage } from "@/pages/coming-soon"
import { DashboardPage } from "@/pages/dashboard"
import { AppLayout } from "@/layouts/app-layout"
import { sections } from "@/config/navigation"
import { ProfilePage } from "@/pages/profile"
import { TaskDetailsPage } from "@/pages/task-details"
import { TasksPage } from "@/pages/tasks"
import { AddTaskPage } from "@/pages/add-task"
import { InspectionsPage } from "@/pages/inspections"
import { ReportsPage } from "@/pages/reports"
import { ReportDetailsPage } from "@/pages/report-details"
import { SupportTicketsPage } from "@/pages/support-tickets"
import { SupportTicketDetailsPage } from "@/pages/support-ticket-details"
import { InspectionDetailsPage } from "@/pages/inspection-details"
import { AddInspectionPage } from "@/pages/add-inspection"

/** Sections with a real screen; every other section gets a placeholder page */
const built = new Set(["/", "/tasks", "/inspection-activities", "/reports", "/support-tickets"])

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
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "profile", element: <ProfilePage /> },
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
