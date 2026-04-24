import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Footer from "./components/Footer";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import { getDashboardPath, getStoredUser } from "./utils/auth";

function ProtectedDashboard({ allowedRole, children }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
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
      </Routes>
      <Footer />
    </>
  );
}

export default App;
