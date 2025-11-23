// src/components/Profile.js
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { auth, firestore } from "../services/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

function Profile() {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        // Intentar obtener datos de la colección "users"
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          // Si no existe en "users", buscar en la colección de negocios
          const negociosQuery = query(
            collection(firestore, "ubicate", "negocios", "registros"),
            where("usuarioId", "==", user.uid)
          );

          const querySnapshot = await getDocs(negociosQuery);

          if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            setUserData(firstDoc.data());
          }
        }
      } catch (error) {
        console.error("Error obteniendo datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/login";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "#0b4bb0",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className="spinner-border text-white" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  const user = auth.currentUser;
  const isAnonymous = user?.isAnonymous;

  return (
    <div
      style={{
        backgroundColor: "#0b4bb0",
        minHeight: "100vh",
        padding: "20px 0",
      }}
    >
      <Container>
        {/* Botón Volver - Posicionado correctamente */}
        <div className="mb-4">
          <Link
            to="/home"
            className="btn btn-outline-light"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "500",
            }}
          >
            <i className="bi bi-arrow-left"></i> Volver a la aplicación
          </Link>
        </div>

        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="user-info-card">
              <Card.Body className="p-4">
                <img
                  id="user-avatar"
                  src={`https://ui-avatars.com/api/?name=${
                    user?.email || "Usuario"
                  }&size=100&background=007bff&color=fff`}
                  alt="Avatar"
                  className="user-avatar mb-3"
                />

                <h2 className="text-center mb-4">Información del Usuario</h2>

                <div className="user-details">
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <strong>Nombre:</strong>
                    <span>
                      {userData.nombre ||
                        user?.email?.split("@")[0] ||
                        "No proporcionado"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <strong>Email:</strong>
                    <span>{user?.email || "No proporcionado"}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <strong>Teléfono:</strong>
                    <span>
                      {userData.telefono ||
                        userData.phoneNumber ||
                        "No proporcionado"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <strong>Tipo de usuario:</strong>
                    <span>{isAnonymous ? "Invitado" : "Registrado"}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <strong>ID de usuario:</strong>
                    <span
                      className="text-truncate"
                      style={{ maxWidth: "150px" }}
                    >
                      {user?.uid}
                    </span>
                  </div>
                </div>

                {isAnonymous && (
                  <div className="alert alert-info mt-3">
                    <i className="bi bi-info-circle"></i>
                    Eres un usuario invitado.{" "}
                    <Link to="/register" className="alert-link">
                      Regístrate
                    </Link>
                    para guardar tu información permanentemente.
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Action Buttons */}
            <div className="d-grid gap-2 mt-4">
              <Link to="/business-form" className="btn btn-primary">
                <i className="bi bi-plus-circle"></i> Registrar nuevo negocio
              </Link>
              <Link to="/edit-profile" className="btn btn-outline-secondary">
                <i className="bi bi-pencil"></i> Editar perfil
              </Link>
              <Button variant="outline-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
              </Button>
            </div>
          </Col>
        </Row>
      </Container>

      <footer className="mt-5 py-4">
        <div
          className="container text-center"
          style={{
            color: "white",
          }}
        >
          <p>&copy; 2023 Ubicate - Todos los derechos reservados</p>
        </div>
      </footer>

      <style jsx>{`
        .user-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 auto;
          display: block;
          border: 3px solid #0d6efd;
          box-shadow: 0 4px 10px rgba(13, 110, 253, 0.3);
        }

        .user-info-card {
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          border: none;
        }

        .user-details {
          font-size: 1rem;
        }

        .btn-outline-secondary {
          border-color: #6c757d;
          color: #6c757d;
        }

        .btn-outline-secondary:hover {
          background-color: #6c757d;
          color: white;
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 15px;
          }

          .user-details {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Profile;
