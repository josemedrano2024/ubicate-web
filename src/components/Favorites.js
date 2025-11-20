// src/components/Favorites.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { auth, firestore } from "../services/firebase";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [businessToRemove, setBusinessToRemove] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Debes iniciar sesión para ver tus favoritos");
        setLoading(false);
        return;
      }

      const favDoc = await getDoc(
        doc(firestore, "ubicate", "usuarios", "favoritos", user.uid)
      );

      if (favDoc.exists() && favDoc.data().negocios) {
        const favoriteIds = favDoc.data().negocios;
        await loadFavoriteDetails(favoriteIds);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error cargando favoritos:", error);
      setError("Error al cargar los favoritos");
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteDetails = async (favoriteIds) => {
    try {
      const businesses = [];

      for (const businessId of favoriteIds) {
        const businessDoc = await getDoc(
          doc(firestore, "ubicate", "negocios", "registros", businessId)
        );
        if (businessDoc.exists()) {
          businesses.push({
            id: businessDoc.id,
            ...businessDoc.data(),
          });
        }
      }

      setFavorites(businesses);
    } catch (error) {
      console.error("Error cargando detalles:", error);
      setError("Error al cargar los detalles de los negocios");
    }
  };

  const showRemoveConfirmation = (businessId) => {
    setBusinessToRemove(businessId);
    setShowConfirmModal(true);
  };

  const hideRemoveConfirmation = () => {
    setShowConfirmModal(false);
    setBusinessToRemove(null);
  };

  const removeFavorite = async () => {
    if (!businessToRemove) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const favDoc = await getDoc(
        doc(firestore, "ubicate", "usuarios", "favoritos", user.uid)
      );
      const currentFavorites = favDoc.exists()
        ? favDoc.data().negocios || []
        : [];

      const newFavorites = currentFavorites.filter(
        (id) => id !== businessToRemove
      );

      await setDoc(
        doc(firestore, "ubicate", "usuarios", "favoritos", user.uid),
        {
          negocios: newFavorites,
          ultimaActualizacion: new Date(),
        }
      );

      setFavorites((prev) =>
        prev.filter((business) => business.id !== businessToRemove)
      );
      hideRemoveConfirmation();
    } catch (error) {
      console.error("Error eliminando favorito:", error);
      setError("Error al eliminar de favoritos");
    }
  };

  const viewInMap = (businessId) => {
    localStorage.setItem("negocioParaMostrar", businessId);
    navigate("/home");
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
        <div className="text-center">
          <div className="spinner-border text-white" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2 text-white">Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#0b4bb0", minHeight: "100vh" }}>
      {/* Botón Volver */}
      <div className="btn-volver-container">
        <Link to="/home" className="btn-volver">
          <i className="bi bi-arrow-left"></i> Volver al Mapa Principal
        </Link>
      </div>

      {/* Contenido Principal */}
      <div className="favoritos-container">
        <h2 className="mb-4">
          <i className="bi bi-heart-fill text-danger"></i> Mis Negocios
          Favoritos
        </h2>
        <p className="text-muted mb-4">
          Aquí encontrarás todos los negocios que has marcado como favoritos.
        </p>

        {error && <Alert variant="danger">{error}</Alert>}

        <div id="favoritos-list">
          {favorites.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-heart"></i>
              <h4>No tienes favoritos aún</h4>
              <p>
                Marca algunos negocios como favoritos en el mapa principal para
                verlos aquí.
              </p>
              <Link to="/home" className="btn btn-primary mt-3">
                <i className="bi bi-map"></i> Explorar Negocios
              </Link>
            </div>
          ) : (
            favorites.map((business) => (
              <div key={business.id} className="business-card">
                <h5>{business.nombre || "Negocio sin nombre"}</h5>

                <div className="business-info">
                  <p>
                    <i className="bi bi-tag"></i> <strong>Categoría:</strong>{" "}
                    {business.categoria || "No especificado"}
                  </p>
                  <p>
                    <i className="bi bi-telephone"></i>{" "}
                    <strong>Teléfono:</strong>{" "}
                    {business.telefono || "No especificado"}
                  </p>
                  <p>
                    <i className="bi bi-clock"></i> <strong>Horario:</strong>{" "}
                    {business.horario || "No especificado"}
                  </p>
                  {business.descripcion && (
                    <p>
                      <i className="bi bi-info-circle"></i>{" "}
                      <strong>Descripción:</strong> {business.descripcion}
                    </p>
                  )}
                </div>

                <div className="action-buttons">
                  <button
                    onClick={() => viewInMap(business.id)}
                    className="btn-view-map"
                  >
                    <i className="bi bi-geo-alt"></i> Ver en Mapa
                  </button>
                  <button
                    onClick={() => showRemoveConfirmation(business.id)}
                    className="btn-remove"
                  >
                    <i className="bi bi-trash"></i> Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Confirmación */}
      <Modal show={showConfirmModal} onHide={hideRemoveConfirmation}>
        <Modal.Header closeButton>
          <Modal.Title>Eliminar Favorito</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que quieres eliminar este negocio de tus favoritos?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={hideRemoveConfirmation}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={removeFavorite}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      <footer>
        <div
          className="container"
          style={{
            backgroundColor: "#0b4bb0",
            color: "white",
          }}
        >
          <center>
            <p>&copy; 2023 Ubicate - Todos los derechos reservados</p>
          </center>
        </div>
      </footer>

      <style jsx>{`
        .btn-volver-container {
          padding: 15px 20px;
        }

        .btn-volver {
          background: #4285f4;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-volver:hover {
          background: #3367d6;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .favoritos-container {
          max-width: 800px;
          margin: 20px auto;
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }

        .business-card {
          margin-bottom: 20px;
          padding: 20px;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #4285f4;
          transition: transform 0.2s;
        }

        .business-card:hover {
          transform: translateY(-2px);
        }

        .business-card h5 {
          color: #4285f4;
          margin-bottom: 10px;
        }

        .empty-state {
          text-align: center;
          padding: 50px 20px;
          color: #6c757d;
        }

        .empty-state i {
          font-size: 48px;
          margin-bottom: 20px;
          color: #dee2e6;
        }

        .btn-remove {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 5px;
          cursor: pointer;
          margin-left: 10px;
          transition: all 0.3s ease;
        }

        .btn-remove:hover {
          background: #c82333;
          transform: translateY(-1px);
        }

        .btn-view-map {
          background: #4285f4;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-view-map:hover {
          background: #3367d6;
          transform: translateY(-1px);
        }

        .action-buttons {
          margin-top: 15px;
        }

        .business-info {
          margin-bottom: 10px;
        }

        .business-info i {
          width: 20px;
          color: #4285f4;
        }

        @media (max-width: 768px) {
          .favoritos-container {
            padding: 20px;
            margin: 10px;
          }

          .action-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .btn-remove {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default Favorites;
