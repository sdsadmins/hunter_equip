import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
            <Login />
          </Layout>
        } />
        <Route path="/forgot-password" element={
          <Layout>
            <ForgotPassword />
          </Layout>
        } />
        <Route path="/reset-password" element={
          <Layout>
            <ResetPassword />
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
