// src/components/EditProfile.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Accordion,
  Row,
  Col,
} from "react-bootstrap"; // Añadidos Row y Col
import { Link } from "react-router-dom";
import { auth, firestore } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

function EditProfile() {
  const [userData, setUserData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    empresa: "",
    cargo: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
          setUserData((prev) => ({ ...prev, ...userDoc.data() }));
        }
        // Siempre cargar email desde auth
        setUserData((prev) => ({ ...prev, email: user.email || "" }));
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No hay usuario autenticado");

      // Actualizar perfil en Firebase Auth
      if (userData.nombre && userData.nombre !== user.displayName) {
        await updateProfile(user, {
          displayName: userData.nombre,
        });
      }

      // Actualizar email si cambió
      if (userData.email && userData.email !== user.email) {
        await updateEmail(user, userData.email);
      }

      // Actualizar contraseña si se proporcionó
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("Las contraseñas no coinciden");
        }
        if (newPassword.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres");
        }
        if (!currentPassword) {
          throw new Error("Debe proporcionar la contraseña actual");
        }

        // Reautenticar
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
      }

      // Guardar datos adicionales en Firestore
      await setDoc(
        doc(firestore, "users", user.uid),
        {
          ...userData,
          fechaActualizacion: new Date(),
        },
        { merge: true }
      );

      setMessage("Perfil actualizado correctamente");

      // Limpiar campos de contraseña
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
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
          <h4 className="text-white mb-0">Editar Perfil</h4>
          <div></div> {/* Espaciador */}
        </div>

        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-person-gear"></i> Información del Perfil
            </h5>
          </Card.Header>
          <Card.Body>
            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre completo</Form.Label>
                    <Form.Control
                      type="text"
                      value={userData.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                      placeholder="Ingresa tu nombre completo"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Correo electrónico</Form.Label>
                    <Form.Control
                      type="email"
                      value={userData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="Ingresa tu correo electrónico"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control
                      type="tel"
                      value={userData.telefono}
                      onChange={(e) => handleChange("telefono", e.target.value)}
                      placeholder="Ingresa tu teléfono"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Empresa</Form.Label>
                    <Form.Control
                      type="text"
                      value={userData.empresa}
                      onChange={(e) => handleChange("empresa", e.target.value)}
                      placeholder="Nombre de tu empresa"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Dirección</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={userData.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  placeholder="Ingresa tu dirección"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Cargo/Posición</Form.Label>
                <Form.Control
                  type="text"
                  value={userData.cargo}
                  onChange={(e) => handleChange("cargo", e.target.value)}
                  placeholder="Tu cargo o posición en la empresa"
                />
              </Form.Group>

              {/* Cambio de contraseña */}
              <Accordion className="mb-4">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Cambiar contraseña</Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contraseña actual</Form.Label>
                          <Form.Control
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Ingresa tu contraseña actual"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nueva contraseña</Form.Label>
                          <Form.Control
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nueva contraseña"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Confirmar nueva contraseña</Form.Label>
                          <Form.Control
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirma tu nueva contraseña"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <small className="text-muted">
                      La contraseña debe tener al menos 6 caracteres.
                    </small>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              <div className="d-flex gap-2 justify-content-end">
                <Link to="/profile" className="btn btn-secondary">
                  Cancelar
                </Link>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default EditProfile;
