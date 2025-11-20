// src/components/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Componentes
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import Favorites from "./Favorites";
import BusinessForm from "./BusinessForm";
import Help from "./Help";
import EditProfile from "./EditProfile";

// Firebase
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-primary">
        <div className="spinner-border text-white" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/home" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/home" />}
          />
          <Route
            path="/home"
            element={user ? <Home /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={user ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/favorites"
            element={user ? <Favorites /> : <Navigate to="/login" />}
          />
          <Route
            path="/business-form"
            element={user ? <BusinessForm /> : <Navigate to="/login" />}
          />
          <Route path="/help" element={<Help />} />
          <Route
            path="/edit-profile"
            element={user ? <EditProfile /> : <Navigate to="/login" />}
          />
          <Route
            path="/"
            element={<Navigate to={user ? "/home" : "/login"} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
