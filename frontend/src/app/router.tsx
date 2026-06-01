import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/login-page";
import RegisterPage from "../pages/register-page";
import DashboardPage from "../pages/dashboard-page";
import ClientDashboardPage from "../pages/client-dashboard-page";
import ClientsPage from "../pages/clients-page";
import ProjectsPage from "../pages/projects-page";
import ProjectDetailsPage from "../pages/project-details-page";
import ChatPage from "../pages/chat-page";
import ClientProjectsPage from "../pages/client-projects-page";
import ClientProjectDetailsPage from "../pages/client-project-details-page";

import ClientNotificationPage from "../pages/client-notification-page";
import ClientFilePage from "../pages/client-file-page";
import VideoCallPage from "../pages/video-call-page";
import AppShell from "../components/layout/app-shell";
import ProtectedRoute from "../components/protected-route";
import NotFoundPage from "../pages/not-found-page";
import CreatePasswordPage from "../pages/create-password-page";
import ForgotPasswordPage from "../pages/forgot-password-page";
import VerifyEmailPage from "../pages/verify-email-page";
import LandingPage from "../pages/landing-page";
import DemoPage from "../pages/demo-page";
import MeetingsPage from "../pages/meetings-page";
import MockStripeCheckoutPage from "../pages/mock-stripe-checkout-page";
import PreviewPage from "../pages/preview-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/demo",
    element: <DemoPage />,
  },
  {
    path: "/mock-stripe-checkout",
    element: <MockStripeCheckoutPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/preview",
    element: <PreviewPage />,
  },
  {
    path: "/create-password",
    element: <CreatePasswordPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmailPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      
      {
        path: "/clients",
        element: <ClientsPage />,
      },
      {
        path: "/projects",
        element: <ProjectsPage />,
      },
      {
        path: "/projects/:id",
        element: <ProjectDetailsPage />,
      },
      {
        path: "/notifications",
        element: <ClientNotificationPage />,
      },
      {
        path: "/chat",
        element: <ChatPage />,
      },
      {
        path: "/calls",
        element: <VideoCallPage />,
      },
      {
        path: "/meetings",
        element: <MeetingsPage />,
      },
      {
        path: "/client-dashboard",
        element: <ClientDashboardPage />,
      },
      {
        path: "/client-projects",
        element: <ClientProjectsPage />,
      },

      {
        path: "/client-projects/:id",
        element: <ClientProjectDetailsPage />,
      },
      {
        path: "/client-files",
        element: <ClientFilePage />,
      },
      {
        path: "/client-notifications",
        element: <ClientNotificationPage />,
      },
    ],
   }, 
    {
      path: "*",
        element: <NotFoundPage />,
      
  },
]);