// components/UserAbsencesLayout.jsx

import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import NavbarWithMenu from "./Navbar";
import UserAbsencesPage from "./UserAbsencesPage";
import AcceptedAbsencesDurationChart from "./rhChart";
import PendingRequests from "./PendingRequests";
import { useNavigate } from "react-router-dom";
export default function UserAbsencesLayout() {
  const { user } = useSelector((state) => state.auth);
  const { userId, view: urlView } = useParams();
  const navigate = useNavigate();

  const view = urlView || "userAbsences"; // default if no :view in URL

  const handleViewChange = (newView) => {
    navigate(`/absences/user/${userId}/${newView}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f6f8fb" }}>
      <NavbarWithMenu view={view} setView={handleViewChange} />

      <main style={{ padding: 18 }}>
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 8px 24px rgba(8,15,30,0.04)",
            minHeight: "70vh",
          }}
        >
          {view === "userAbsences" && <UserAbsencesPage key={userId} />}
          {view === "rhChart" && user?.role === "RH" && (
            <AcceptedAbsencesDurationChart />
          )}
          {view === "Pending" && user?.role === "RH" && <PendingRequests />}
        </div>
      </main>
    </div>
  );
}
