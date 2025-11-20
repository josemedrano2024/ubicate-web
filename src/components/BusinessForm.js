// src/components/BusinessForm.js
import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { auth, firestore } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import L from "leaflet";

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function BusinessForm() {
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    categoria: "",
    horario: "",
    descripcion: "",
  });
  const [location, setLocation] = useState([13.6929, -89.2182]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const mapRef = useRef();

  const categories = [
    { value: "", label: "Seleccione una categoría" },
    { value: "restaurante", label: "Restaurante" },
    { value: "tienda", label: "Tienda" },
    { value: "servicio", label: "Servicio" },
    { value: "hotel", label: "Hotel" },
    { value: "entretenimiento", label: "Entretenimiento" },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation([latitude, longitude]);
        },
        (error) => {
          console.warn("Error obteniendo ubicación:", error);
        }
      );
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setLocation([e.latlng.lat, e.latlng.lng]);
      },
    });

    return location ? (
      <Marker
        position={location}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            setLocation([position.lat, position.lng]);
          },
        }}
      >
        <Popup>
          <strong>Ubicación del negocio</strong>
          <br />
          {location[0].toFixed(6)}, {location[1].toFixed(6)}
        </Popup>
      </Marker>
    ) : null;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Validaciones
    if (!formData.nombre.trim()) {
      setError("El nombre del negocio es requerido");
      setLoading(false);
      return;
    }

    if (!formData.categoria) {
      setError("La categoría es requerida");
      setLoading(false);
      return;
    }

    if (!formData.telefono.trim()) {
      setError("El teléfono es requerido");
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user)
        throw new Error("Debes iniciar sesión para registrar un negocio");

      const businessData = {
        ...formData,
        ubicacion: {
          latitude: location[0],
          longitude: location[1],
        },
        usuarioId: user.uid,
        fechaRegistro: serverTimestamp(),
        estado: "activo",
      };

      await addDoc(
        collection(firestore, "ubicate", "negocios", "registros"),
        businessData
      );

      setMessage("¡Negocio registrado con éxito!");
      setFormData({
        nombre: "",
        telefono: "",
        categoria: "",
        horario: "",
        descripcion: "",
      });
    } catch (error) {
      console.error("Error registrando negocio:", error);
      setError("Error al registrar el negocio: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#0b4bb0",
        minHeight: "100vh",
        paddingTop: "20px",
      }}
    >
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Link to="/profile" className="btn btn-outline-light">
            <i className="bi bi-arrow-left"></i> Volver al Perfil
          </Link>
          <h4 className="text-white mb-0">Registrar Negocio</h4>
          <div></div>
        </div>

        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-shop"></i> Información del Negocio
            </h5>
          </Card.Header>
          <Card.Body>
            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre del Negocio *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                      placeholder="Ingresa el nombre de tu negocio"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Teléfono *</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => handleChange("telefono", e.target.value)}
                      placeholder="Número de teléfono"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Categoría *</Form.Label>
                    <Form.Select
                      value={formData.categoria}
                      onChange={(e) =>
                        handleChange("categoria", e.target.value)
                      }
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Horario</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.horario}
                      onChange={(e) => handleChange("horario", e.target.value)}
                      placeholder="Ej: Lunes a Viernes 9:00 AM - 6:00 PM"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => handleChange("descripcion", e.target.value)}
                  placeholder="Describe tu negocio, servicios, productos, etc."
                />
              </Form.Group>

              {/* Mapa para seleccionar ubicación */}
              <Form.Group className="mb-4">
                <Form.Label>Ubicación del Negocio *</Form.Label>
                <div className="alert alert-info mb-2">
                  <i className="bi bi-info-circle"></i> Haz clic en el mapa o
                  arrastra el marcador para establecer la ubicación exacta
                </div>
                <div
                  style={{
                    height: "300px",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <MapContainer
                    center={location}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    ref={mapRef}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <LocationMarker />
                  </MapContainer>
                </div>
                <div className="mt-2 text-muted">
                  <small>
                    Coordenadas: {location[0].toFixed(6)},{" "}
                    {location[1].toFixed(6)}
                  </small>
                </div>
              </Form.Group>

              <div className="d-flex gap-2 justify-content-end">
                <Link to="/profile" className="btn btn-secondary">
                  Cancelar
                </Link>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Registrando..." : "Registrar Negocio"}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default BusinessForm;
