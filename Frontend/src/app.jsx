import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import medixoLogo from "./assets/medixo logo .jpeg";
import { getDashboardPath, getStoredUser, normalizeRole } from "./utils/auth";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./components/Login"));
const DoctorLogin = lazy(() => import("./components/DoctorLogin"));
const StaffLogin = lazy(() => import("./components/StaffLogin"));
const LaboratoryLogin = lazy(() => import("./components/LaboratoryLogin"));
const Signup = lazy(() => import("./components/Signup"));
const DoctorsDirectory = lazy(() => import("./pages/DoctorsDirectory"));
const DoctorProfilePage = lazy(() => import("./pages/DoctorProfilePage"));
const GuestBookingPage = lazy(() => import("./pages/GuestBookingPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const LaboratoryDashboard = lazy(() => import("./pages/LaboratoryDashboard"));
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const AccountDeletionPage = lazy(() => import("./pages/AccountDeletionPage"));
const ResourceDetailsPage = lazy(() => import("./pages/ResourceDetailsPage"));
const LabBookingPage = lazy(() => import("./pages/LabBookingPage"));

function LoadingFallback() {
  return (
    <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      Loading...
    </div>
  );
}

function ProtectedDashboard({ allowedRole, children }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (normalizeRole(user.role) !== normalizeRole(allowedRole)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}

function RoleAwareHome() {
  const location = useLocation();
  const user = getStoredUser();

  const isPublicBrowse = new URLSearchParams(location.search).get("view") === "public";

  if (isPublicBrowse) {
    return <Home />;
  }

  const role = normalizeRole(user?.role);

  if (role === "doctor") {
    return <Navigate to="/doctor-dashboard" replace />;
  }

  if (role === "super_admin") {
    return <Navigate to="/admin-dashboard" replace />;
  }

  if (role === "laboratory") {
    return <Navigate to="/laboratory-dashboard" replace />;
  }

  if (role === "staff") {
    return <Navigate to="/staff-dashboard" replace />;
  }

  return <Home />;
}

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const element = document.getElementById(location.hash.slice(1));
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.pathname, location.hash]);

  return null;
}

function StartupScreen() {
  return (
    <div className="startup-screen" role="status" aria-label="Medixo">
      <img className="startup-screen__logo" src={medixoLogo} alt="Medixo" />
    </div>
  );
}

function App() {
  const [showStartup, setShowStartup] = useState(() => Capacitor.isNativePlatform());

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return undefined;
    }

    const startupTimer = window.setTimeout(() => setShowStartup(false), 1200);
    return () => window.clearTimeout(startupTimer);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return undefined;
    }

    let isMounted = true;
    let backButtonListener;

    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) {
        window.history.back();
        return;
      }

      CapacitorApp.exitApp();
    }).then((listener) => {
      if (isMounted) {
        backButtonListener = listener;
      } else {
        listener.remove();
      }
    });

    return () => {
      isMounted = false;
      backButtonListener?.remove();
    };
  }, []);

  return (
    <>
      {showStartup && <StartupScreen />}
      <ScrollToHash />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<RoleAwareHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/doctor-login" element={<DoctorLogin />} />
          <Route path="/staff-login" element={<StaffLogin />} />
          <Route path="/lab-login" element={<LaboratoryLogin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/doctors" element={<DoctorsDirectory />} />
          <Route path="/doctors/:doctorId" element={<DoctorProfilePage />} />
          <Route path="/my-booking" element={<GuestBookingPage />} />
          <Route path="/privacy-policy" element={<LegalPage type="privacy" />} />
          <Route path="/terms-conditions" element={<LegalPage type="terms" />} />
          <Route path="/delete-account" element={<AccountDeletionPage />} />
          <Route path="/hospitals/:resourceId" element={<ResourceDetailsPage resourceType="hospitals" />} />
          <Route path="/clinics/:resourceId" element={<ResourceDetailsPage resourceType="clinics" />} />
          <Route path="/labs/:resourceId" element={<ResourceDetailsPage resourceType="labs" />} />
          <Route path="/labs/:resourceId/book" element={<LabBookingPage />} />
          <Route
            path="/patient-dashboard"
            element={
              <ProtectedDashboard allowedRole="patient">
                <PatientDashboard />
              </ProtectedDashboard>
            }
          />
          <Route
            path="/doctor-dashboard"
            element={
              <ProtectedDashboard allowedRole="doctor">
                <DoctorDashboard />
              </ProtectedDashboard>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedDashboard allowedRole="super_admin">
                <AdminDashboard />
              </ProtectedDashboard>
            }
          />
          <Route
            path="/laboratory-dashboard"
            element={
              <ProtectedDashboard allowedRole="laboratory">
                <LaboratoryDashboard />
              </ProtectedDashboard>
            }
          />
          <Route
            path="/staff-dashboard"
            element={
              <ProtectedDashboard allowedRole="staff">
                <StaffDashboard />
              </ProtectedDashboard>
            }
          />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}

export default App;
