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
import { Link, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
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

// Icono para el negocio
const createBusinessIcon = () =>
  L.divIcon({
    className: "business-location-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: #dc3545;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        N
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

function BusinessForm() {
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    categoria: "",
    horario: "",
    descripcion: "",
  });
  const [userLocation, setUserLocation] = useState([13.6929, -89.2182]);
  const [businessLocation, setBusinessLocation] = useState([13.6929, -89.2182]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef();
  const navigate = useNavigate();

  const categories = [
    { value: "", label: "Seleccione una categoría" },
    { value: "restaurante", label: "Restaurante" },
    { value: "tienda", label: "Tienda" },
    { value: "servicio", label: "Servicio" },
    { value: "hotel", label: "Hotel" },
    { value: "entretenimiento", label: "Entretenimiento" },
  ];

  // Componente para centrar el mapa en la ubicación del negocio
  const MapCenterHandler = () => {
    const map = useMap();

    useEffect(() => {
      if (businessLocation && map) {
        map.setView(businessLocation, 16);
      }
    }, [businessLocation, map]);

    return null;
  };

  // Componente para el marcador del negocio
  const BusinessLocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        setBusinessLocation([e.latlng.lat, e.latlng.lng]);
      },
    });

    return businessLocation ? (
      <Marker
        position={businessLocation}
        icon={createBusinessIcon()}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            setBusinessLocation([position.lat, position.lng]);
          },
        }}
      >
        <Popup>
          <strong>📍 Ubicación del negocio</strong>
          <br />
          {businessLocation[0].toFixed(6)}, {businessLocation[1].toFixed(6)}
          <br />
          <small>Arrastra para ajustar la ubicación</small>
        </Popup>
      </Marker>
    ) : null;
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const accuracy = position.coords.accuracy;

          console.log("📍 Ubicación obtenida:", latitude, longitude);
          setUserLocation([latitude, longitude]);
          setBusinessLocation([latitude, longitude]); // Colocar negocio en ubicación actual
          setLocationAccuracy(accuracy);
          setIsLocating(false);
        },
        (error) => {
          console.warn("Error obteniendo ubicación:", error);
          setIsLocating(false);

          let errorMessage = "No se pudo obtener tu ubicación. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Permiso de ubicación denegado.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Ubicación no disponible.";
              break;
            case error.TIMEOUT:
              errorMessage += "Tiempo de espera agotado.";
              break;
            default:
              errorMessage += "Error desconocido.";
          }

          setError(errorMessage);
        },
        options
      );
    } else {
      setError("La geolocalización no es soportada por este navegador.");
    }
  };

  const centerMapOnBusiness = () => {
    if (mapRef.current && businessLocation) {
      mapRef.current.setView(businessLocation, 16);
    }
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
          latitude: businessLocation[0],
          longitude: businessLocation[1],
        },
        usuarioId: user.uid,
        fechaRegistro: serverTimestamp(),
        estado: "activo",
      };

      await addDoc(
        collection(firestore, "ubicate", "negocios", "registros"),
        businessData
      );

      setMessage("¡Negocio registrado con éxito! Redirigiendo al Home...");

      // Redirigir al Home después de 2 segundos
      setTimeout(() => {
        navigate("/home");
      }, 2000);

      // Limpiar formulario
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
            {message && (
              <Alert variant="success">
                {message}
                <div className="mt-2">
                  <div
                    className="spinner-border spinner-border-sm"
                    role="status"
                  >
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <small className="ms-2">Redirigiendo...</small>
                </div>
              </Alert>
            )}
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
                <div className="d-flex gap-2 mb-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isLocating}
                  >
                    <i className="bi bi-geo-alt"></i>
                    {isLocating
                      ? "Obteniendo ubicación..."
                      : "Usar Mi Ubicación Actual"}
                  </Button>
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={centerMapOnBusiness}
                  >
                    <i className="bi bi-crosshair"></i> Centrar en Negocio
                  </Button>
                </div>

                <div className="alert alert-info mb-2">
                  <i className="bi bi-info-circle"></i>
                  <strong> Instrucciones:</strong>
                  <ul className="mb-0 mt-1">
                    <li>
                      <strong>Haz clic</strong> en cualquier lugar del mapa para
                      colocar el negocio
                    </li>
                    <li>
                      <strong>Arrastra</strong> el marcador rojo para ajustar la
                      ubicación exacta
                    </li>
                    <li>
                      Usa <strong>"Usar Mi Ubicación Actual"</strong> para
                      colocar el negocio donde estás
                    </li>
                  </ul>
                </div>

                <div
                  style={{
                    height: "400px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "2px solid #dee2e6",
                  }}
                >
                  <MapContainer
                    center={businessLocation}
                    zoom={16}
                    style={{ height: "100%", width: "100%" }}
                    ref={mapRef}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <MapCenterHandler />
                    <BusinessLocationMarker />
                  </MapContainer>
                </div>

                <div className="mt-2">
                  <small className="text-muted">
                    <i className="bi bi-shop" style={{ color: "#dc3545" }}></i>
                    <strong> Ubicación del negocio:</strong>{" "}
                    {businessLocation[0].toFixed(6)},{" "}
                    {businessLocation[1].toFixed(6)}
                  </small>
                  {locationAccuracy && (
                    <div className="mt-1">
                      <small className="text-info">
                        <i className="bi bi-bullseye"></i>
                        Precisión de ubicación: ±{locationAccuracy.toFixed(
                          0
                        )}{" "}
                        metros
                      </small>
                    </div>
                  )}
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
