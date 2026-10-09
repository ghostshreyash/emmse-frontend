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
    children: [{ index: true, element: <ComingSoonPage title="Enterprise Dashboard" /> }],
  },
])
