import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
           <Route path="/register" element={<Register />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
