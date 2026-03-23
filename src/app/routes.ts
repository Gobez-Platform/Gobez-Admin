import { createBrowserRouter } from "react-router";
import { LoginPage } from "./components/LoginPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { AccountSettings } from "./components/AccountSettings";
import { CatalogManagement } from "./components/CatalogManagement";
import { UserManagement } from "./components/UserManagement";
import { FinancialOverview } from "./components/FinancialOverview";
import { ReportsManagement } from "./components/ReportsManagement";
import { VerificationAppointments } from "./components/VerificationAppointments";
import { CustomerSupport } from "./components/CustomerSupport";
import { BookingsManagement } from "./components/BookingsManagement";
import { PayoutHistory } from "./components/PayoutHistory";
import { DisputesManagement } from "./components/DisputesManagement";
import { RedirectToDashboard } from "./components/RedirectToDashboard";

export const router = createBrowserRouter([
  { path: "/", Component: LoginPage },
  { path: "/forgot-password", Component: ForgotPasswordPage },
  {
    Component: Layout,
    children: [
      { path: "/dashboard",        Component: Dashboard               },
      { path: "/bookings",         Component: BookingsManagement      },
      { path: "/users",            Component: UserManagement          },
      { path: "/catalog",          Component: CatalogManagement       },
      { path: "/appointments",     Component: VerificationAppointments },
      { path: "/support",          Component: CustomerSupport         },
      { path: "/reports",          Component: ReportsManagement       },
      { path: "/disputes",         Component: DisputesManagement      },
      { path: "/financials",       Component: FinancialOverview       },
      { path: "/payouts",          Component: PayoutHistory           },
      { path: "/account-settings", Component: AccountSettings         },
      { path: "/map",              Component: RedirectToDashboard     },
      { path: "*",                 Component: RedirectToDashboard     },
    ],
  },
]);