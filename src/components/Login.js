import React, { useState } from "react";
import { Alert } from "react-bootstrap";
import { auth } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
// Importar el logo
import logoImg from "../assets/Logo.jpeg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (error) {
      let errorMessage = "Error al iniciar sesión";

      if (error.code === "auth/user-not-found") {
        errorMessage = "Por favor registrate.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Contraseña incorrecta.";
      } else {
        errorMessage = "Error al iniciar sesión: " + error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={logoImg} alt="Logo" className="login-logo" />
        <h2>Iniciar Sesión</h2>

        <form id="loginForm" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="user">Correo Electrónico</label>
            <input
              type="email"
              id="user"
              placeholder="Ingresa tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <Alert variant="danger" style={{ marginTop: "10px" }}>
              {error}
            </Alert>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="login-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          width: 100%;
          min-height: 100vh;
          padding: 20px;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #0b4bb0;
        }

        .login-box {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 15px;
          padding: 30px 25px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .login-logo {
          width: 80px;
          height: auto;
          margin: 0 auto 20px;
          display: block;
        }

        h2 {
          font-size: 1.5rem;
          margin-bottom: 20px;
          color: #333;
          text-align: center;
        }

        .input-group {
          margin-bottom: 20px;
          width: 100%;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #555;
        }

        .input-group input {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.3s;
        }

        .input-group input:focus {
          border-color: #4a6bff;
          outline: none;
          box-shadow: 0 0 0 3px rgba(74, 107, 255, 0.2);
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background-color: #4a6bff;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
          transition: background-color 0.3s;
        }

        .login-btn:hover:not(:disabled) {
          background-color: #3a5bef;
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 0.9rem;
        }

        .login-footer a {
          color: #4a6bff;
          text-decoration: none;
          font-weight: 500;
        }

        @media (max-width: 480px) {
          .login-box {
            padding: 25px 20px;
          }

          h2 {
            font-size: 1.3rem;
          }

          .input-group input {
            padding: 10px 12px;
          }

          .login-btn {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
