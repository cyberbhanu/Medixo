import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import { getDashboardPath, getStoredUser, normalizeRole } from "./utils/auth";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./components/Login"));
const DoctorLogin = lazy(() => import("./components/DoctorLogin"));
const Signup = lazy(() => import("./components/Signup"));
const DoctorsDirectory = lazy(() => import("./pages/DoctorsDirectory"));
const DoctorProfilePage = lazy(() => import("./pages/DoctorProfilePage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const LaboratoryDashboard = lazy(() => import("./pages/LaboratoryDashboard"));

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
  const user = getStoredUser();

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

  return <Home />;
}

function App() {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<RoleAwareHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/doctor-login" element={<DoctorLogin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/doctors" element={<DoctorsDirectory />} />
          <Route path="/doctors/:doctorId" element={<DoctorProfilePage />} />
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
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}

export default App;
