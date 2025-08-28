import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";
import Layout from "./components/Layout";
import AddCranePage from "./pages/AddCranePage";
import EditCranePage from "./pages/EditCranePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout>
            <HomePage />
          </Layout>
        } />
        <Route path="/register" element={
          <Layout>
            <Register />
          </Layout>
        } />
        <Route path="/login" element={
          <Layout>
            <LoginPage />
          </Layout>
        } />
        <Route path="/supervisor-dashboard" element={
          <Layout>
            <SupervisorDashboard />
          </Layout>
        } />
        <Route path="/add-crane" element={
          <Layout>
            <AddCranePage />
          </Layout>
        } />
        <Route path="/edit-crane" element={
          <Layout>
            <EditCranePage />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
