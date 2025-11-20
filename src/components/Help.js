// src/components/Help.js
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";

// Importar las imágenes - AGREGAR ESTOS IMPORTS
import usuarioImg from "../assets/usuario.png";
import logoImg from "../assets/Logo.jpeg";

function Help() {
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("uso");
  const navigate = useNavigate();

  const categories = [
    { id: "uso", name: "Uso de la App", icon: "bi-phone" },
    { id: "tecnico", name: "Problemas Técnicos", icon: "bi-tools" },
    { id: "cuenta", name: "Cuenta y Perfil", icon: "bi-person" },
  ];

  // Efecto para manejar clicks fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.matches(".btn-with-img") &&
        !event.target.matches(".btn-img") &&
        !event.target.matches(".dropdown-toggle")
      ) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
          const openDropdown = dropdowns[i];
          if (openDropdown.classList.contains("show")) {
            openDropdown.classList.remove("show");
          }
        }
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    const dropdown = document.getElementById("myDropdown");
    if (dropdown) {
      dropdown.classList.toggle("show");
    }
  };

  const closeDropdown = () => {
    const dropdown = document.getElementById("myDropdown");
    if (dropdown) {
      dropdown.classList.remove("show");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate("/profile");
    closeDropdown();
  };

  const handleHelpClick = (e) => {
    e.preventDefault();
    navigate("/help");
    closeDropdown();
  };

  const handleSearch = () => {
    if (searchTerm) {
      // Ocultar todas las secciones primero
      document.querySelectorAll(".accordion-collapse").forEach((collapse) => {
        collapse.classList.remove("show");
      });

      // Buscar en los textos de las preguntas y respuestas
      let found = false;
      document.querySelectorAll(".accordion-item").forEach((item) => {
        const question = item
          .querySelector(".accordion-button")
          .textContent.toLowerCase();
        const answer = item
          .querySelector(".accordion-body")
          .textContent.toLowerCase();

        if (
          question.includes(searchTerm.toLowerCase()) ||
          answer.includes(searchTerm.toLowerCase())
        ) {
          item.querySelector(".accordion-collapse").classList.add("show");
          item.scrollIntoView({ behavior: "smooth", block: "center" });
          found = true;
        }
      });

      if (!found) {
        alert("No se encontraron resultados para: " + searchTerm);
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el formulario
    setFormSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      style={{
        backgroundColor: "#0b4bb0",
        minHeight: "100vh",
        paddingBottom: "60px",
      }}
    >
      {/* Navbar - EXACTAMENTE igual al Home */}
      <nav className="navbar navbar-expand-lg navbar-light navbar-custom">
        <div className="container-fluid">
          <div className="navbar-brand">
            <img src={logoImg} alt="Logo" className="logo-img" />
          </div>
          <div className="navbar-title">Centro de Ayuda</div>

          <div className="dropdown">
            <button
              className="btn-with-img dropdown-toggle"
              type="button"
              onClick={toggleDropdown}
            >
              <img src={usuarioImg} alt="Usuario" className="btn-img" />
            </button>
            <div className="dropdown-content" id="myDropdown">
              <button
                className="dropdown-item"
                onClick={handleProfileClick}
                style={{
                  background: "none",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 16px",
                  textAlignLast: "center",
                }}
              >
                Perfil
              </button>
              <button
                className="dropdown-item"
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 16px",
                  textAlignLast: "center",
                }}
              >
                Cerrar Sesión
              </button>
              <button
                className="dropdown-item"
                onClick={handleHelpClick}
                style={{
                  background: "none",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 16px",
                  textAlignLast: "center",
                }}
              >
                Ayuda
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Resto del código de Help.js permanece igual */}
      {/* Back Button - Debajo de la navbar sin transparencia */}
      <div className="back-section">
        <Container>
          <Link to="/home" className="back-button">
            <i className="bi bi-arrow-left"></i> Volver a la aplicación
          </Link>
        </Container>
      </div>

      <Container className="help-container">
        {/* Header Section */}
        <div className="help-header text-center mb-5">
          <div className="help-icon">
            <i className="bi bi-question-circle"></i>
          </div>
          <h1 className="text-white fw-bold">¿Cómo podemos ayudarte?</h1>
          <p className="text-white-50 lead">
            Encuentra respuestas rápidas a tus preguntas o contacta con nuestro
            equipo de soporte
          </p>
        </div>

        {/* Search Section */}
        <div className="search-section mb-5">
          <div className="search-card">
            <div className="search-header">
              <i className="bi bi-search"></i>
              <h3>Buscar en la ayuda</h3>
            </div>
            <div className="search-input-group">
              <input
                type="text"
                className="search-input"
                placeholder="Escribe tu pregunta o palabra clave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <button className="search-btn" onClick={handleSearch}>
                <i className="bi bi-search"></i>
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Categories Navigation */}
        <div className="categories-nav mb-4">
          <div className="categories-container">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${
                  activeCategory === category.id ? "active" : ""
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <i className={`bi ${category.icon}`}></i>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Sections */}
        <Row className="g-4">
          <Col lg={8}>
            {/* Uso de la App */}
            {activeCategory === "uso" && (
              <div className="faq-section">
                <div className="section-header">
                  <i className="bi bi-phone"></i>
                  <h2>Uso de la Aplicación</h2>
                </div>
                <div className="accordion custom-accordion" id="accordionUsage">
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button className="accordion-button" type="button">
                        <i className="bi bi-geo-alt"></i>
                        ¿Cómo busco negocios cercanos?
                      </button>
                    </h2>
                    <div className="accordion-collapse collapse show">
                      <div className="accordion-body">
                        <p>Para buscar negocios cercanos, simplemente:</p>
                        <ul>
                          <li>
                            Escribe lo que necesitas en la barra de búsqueda
                            principal
                          </li>
                          <li>Selecciona una categoría si lo deseas</li>
                          <li>Presiona "Buscar" o Enter</li>
                        </ul>
                        <p>
                          La aplicación mostrará resultados basados en tu
                          ubicación actual dentro de un radio de 5km.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                      >
                        <i className="bi bi-map"></i>
                        ¿Cómo cambio mi ubicación manualmente?
                      </button>
                    </h2>
                    <div className="accordion-collapse collapse">
                      <div className="accordion-body">
                        <p>Puedes cambiar tu ubicación de varias formas:</p>
                        <ul>
                          <li>
                            <strong>Arrastrar el mapa:</strong> Toca y arrastra
                            el mapa para moverte
                          </li>
                          <li>
                            <strong>Búsqueda por dirección:</strong> Usa la
                            barra de búsqueda para encontrar lugares específicos
                          </li>
                          <li>
                            <strong>GPS:</strong> Usa el botón de ubicación para
                            centrar en tu posición actual
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                      >
                        <i className="bi bi-heart"></i>
                        ¿Cómo agrego un negocio a favoritos?
                      </button>
                    </h2>
                    <div className="accordion-collapse collapse">
                      <div className="accordion-body">
                        <p>Para guardar tus negocios favoritos:</p>
                        <ol>
                          <li>
                            Abre la ficha del negocio (haz clic en el marcador o
                            en la tarjeta)
                          </li>
                          <li>
                            Haz clic en el icono de corazón{" "}
                            <i className="bi bi-heart"></i>
                          </li>
                          <li>
                            El corazón se pondrá rojo indicando que está en
                            favoritos
                          </li>
                        </ol>
                        <p>
                          Accede a tus favoritos desde el botón flotante en la
                          esquina inferior derecha.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Problemas Técnicos */}
            {activeCategory === "tecnico" && (
              <div className="faq-section">
                <div className="section-header">
                  <i className="bi bi-tools"></i>
                  <h2>Problemas Técnicos</h2>
                </div>
                <div
                  className="accordion custom-accordion"
                  id="accordionTechnical"
                >
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button className="accordion-button" type="button">
                        <i className="bi bi-geo"></i>
                        La aplicación no detecta mi ubicación
                      </button>
                    </h2>
                    <div className="accordion-collapse collapse show">
                      <div className="accordion-body">
                        <p>Si tienes problemas con la ubicación:</p>
                        <div className="solution-steps">
                          <div className="step">
                            <span className="step-number">1</span>
                            <div>
                              <strong>Verifica permisos</strong>
                              <p>
                                Asegúrate de haber concedido permisos de
                                ubicación a la aplicación
                              </p>
                            </div>
                          </div>
                          <div className="step">
                            <span className="step-number">2</span>
                            <div>
                              <strong>Activa GPS</strong>
                              <p>
                                Comprueba que el GPS esté activado en tu
                                dispositivo
                              </p>
                            </div>
                          </div>
                          <div className="step">
                            <span className="step-number">3</span>
                            <div>
                              <strong>Conexión a Internet</strong>
                              <p>
                                Verifica que tengas conexión a Internet estable
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                      >
                        <i className="bi bi-wifi"></i>
                        Los resultados de búsqueda no aparecen
                      </button>
                    </h2>
                    <div className="accordion-collapse collapse">
                      <div className="accordion-body">
                        <p>Posibles soluciones:</p>
                        <ul>
                          <li>
                            <strong>Verifica tu conexión:</strong> Asegúrate de
                            tener Internet
                          </li>
                          <li>
                            <strong>Reinicia la búsqueda:</strong> Intenta con
                            términos diferentes
                          </li>
                          <li>
                            <strong>Actualiza la aplicación:</strong> Descarga
                            la última versión
                          </li>
                          <li>
                            <strong>Reinicia la app:</strong> Cierra y vuelve a
                            abrir la aplicación
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                      >
                        <i className="bi bi-x-circle"></i>
                        La aplicación se cierra inesperadamente
                      </button>
                    </h2>
                    <div className="accordion-collapse collapse">
                      <div className="accordion-body">
                        <p>Soluciones recomendadas:</p>
                        <ul>
                          <li>
                            <strong>Cierra y reabre:</strong> Cierra
                            completamente la aplicación y vuelve a abrirla
                          </li>
                          <li>
                            <strong>Reinicia el dispositivo:</strong> Apaga y
                            enciende tu teléfono
                          </li>
                          <li>
                            <strong>Actualiza la app:</strong> Verifica que
                            tengas la última versión
                          </li>
                          <li>
                            <strong>Limpia caché:</strong> Limpia el caché de la
                            aplicación en ajustes
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cuenta y Perfil */}
            {activeCategory === "cuenta" && (
              <div className="faq-section">
                <div className="section-header">
                  <i className="bi bi-person"></i>
                  <h2>Cuenta y Perfil</h2>
                </div>
                <div
                  className="accordion custom-accordion"
                  id="accordionAccount"
                >
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button className="accordion-button" type="button">
                        <i className="bi bi-person-circle"></i>
                        ¿Cómo cambio mi información de perfil?
                      </button>
                    </h2>
                    <div className="accordion-collapse collapse show">
                      <div className="accordion-body">
                        <p>Para actualizar tu perfil:</p>
                        <ol>
                          <li>
                            Haz clic en tu foto de perfil en la esquina superior
                            derecha
                          </li>
                          <li>Selecciona "Perfil" en el menú desplegable</li>
                          <li>Edita la información que desees cambiar</li>
                          <li>Guarda los cambios</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                      >
                        <i className="bi bi-shield-exclamation"></i>
                        ¿Cómo elimino mi cuenta?
                      </button>
                    </h2>
                    <div className="accordion-collapse collapse">
                      <div className="accordion-body">
                        <div className="warning-card">
                          <i className="bi bi-exclamation-triangle"></i>
                          <div>
                            <strong>Eliminación de cuenta</strong>
                            <p>
                              Para eliminar tu cuenta permanentemente, contacta
                              con nuestro equipo de soporte a través del
                              formulario de contacto. Procesaremos tu solicitud
                              en un plazo máximo de 48 horas.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Col>

          {/* Contact Section */}
          <Col lg={4}>
            <div className="contact-section">
              <div className="contact-card">
                <div className="contact-header">
                  <i className="bi bi-headset"></i>
                  <h3>¿Necesitas más ayuda?</h3>
                  <p>Estamos aquí para asistirte</p>
                </div>

                <div className="contact-methods">
                  <div className="contact-method">
                    <div className="method-icon email">
                      <i className="bi bi-envelope"></i>
                    </div>
                    <div className="method-info">
                      <strong>Correo electrónico</strong>
                      <p>soporte@ubicate.com</p>
                      <small>Respuesta en 24h</small>
                    </div>
                  </div>

                  <div className="contact-method">
                    <div className="method-icon phone">
                      <i className="bi bi-telephone"></i>
                    </div>
                    <div className="method-info">
                      <strong>Teléfono</strong>
                      <p>+123 456 7890</p>
                      <small>Lun-Vie 8:00-18:00</small>
                    </div>
                  </div>

                  <div className="contact-method">
                    <div className="method-icon chat">
                      <i className="bi bi-chat-dots"></i>
                    </div>
                    <div className="method-info">
                      <strong>Chat en vivo</strong>
                      <p>Disponible 24/7</p>
                      <small>Respuesta inmediata</small>
                    </div>
                  </div>
                </div>

                <div className="contact-form">
                  <h4>Envíanos un mensaje</h4>
                  {formSubmitted && (
                    <Alert variant="success" className="alert-custom">
                      <i className="bi bi-check-circle"></i>
                      ¡Gracias por tu mensaje! Te responderemos en breve.
                    </Alert>
                  )}
                  <form onSubmit={handleFormSubmit}>
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Tu nombre"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Correo electrónico"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <textarea
                        className="form-control"
                        placeholder="Describe tu problema o pregunta..."
                        rows="4"
                        value={formData.message}
                        onChange={(e) =>
                          handleInputChange("message", e.target.value)
                        }
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="submit-btn">
                      <i className="bi bi-send"></i>
                      Enviar mensaje
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <footer
        className="help-footer"
        style={{
          backgroundColor: "#0b4bb0",
        }}
      >
        <Container>
          <p>&copy; 2023 Ubicate - Todos los derechos reservados</p>
        </Container>
      </footer>

      <style jsx>{`
        /* Navbar Styles - EXACTAMENTE igual al Home */
        .navbar-custom {
          background-color: #4285f4;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .navbar-title {
          color: white;
          font-weight: 600;
          font-size: 1.2rem;
          flex-grow: 1;
          text-align: center;
        }

        .logo-img {
          height: 40px;
        }

        .btn-with-img {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }

        .btn-img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .dropdown {
          position: relative;
        }

        .dropdown-content {
          display: none;
          position: absolute;
          top: 50px;
          right: 0;
          background-color: #fff;
          width: 150px;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          z-index: 1000;
        }

        .dropdown-content button {
          display: block;
          width: 100%;
          padding: 15px;
          text-decoration: none;
          font-size: 16px;
          color: #333;
          text-align: center;
          border: none;
          background: none;
          cursor: pointer;
        }

        .dropdown-content button:hover {
          background-color: #f1f1f1;
        }

        .show {
          display: block;
        }

        /* Resto de estilos... */
        /* (Mantener todos los demás estilos existentes) */

        .back-section {
          background: #0b4bb0;
          padding: 15px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .back-button {
          color: white;
          text-decoration: none;
          font-weight: 500;
          padding: 10px 20px;
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.15);
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.25);
          color: white;
          text-decoration: none;
          transform: translateX(-5px);
        }

        .help-container {
          padding-top: 30px;
        }

        .help-header {
          padding: 20px 0;
        }

        .help-icon {
          font-size: 4rem;
          color: #34a853;
          margin-bottom: 20px;
        }

        .search-section {
          margin: 0 auto;
          max-width: 800px;
        }

        .search-card {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .search-header {
          margin-bottom: 25px;
        }

        .search-header i {
          font-size: 2.5rem;
          color: #4285f4;
          margin-bottom: 15px;
        }

        .search-header h3 {
          color: #333;
          margin: 0;
          font-size: 1.5rem;
        }

        .search-input-group {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .search-input {
          flex: 1;
          padding: 15px 20px;
          border: 2px solid #e0e0e0;
          border-radius: 50px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #4285f4;
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
        }

        .search-btn {
          background: #4285f4;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-btn:hover {
          background: #3367d6;
          transform: translateY(-2px);
        }

        .categories-nav {
          display: flex;
          justify-content: center;
        }

        .categories-container {
          display: flex;
          gap: 10px;
          background: rgba(255, 255, 255, 0.1);
          padding: 10px;
          border-radius: 50px;
        }

        .category-btn {
          background: transparent;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .category-btn.active {
          background: #4285f4;
          color: white;
        }

        .category-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.1);
        }

        .faq-section {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }

        .section-header i {
          font-size: 2rem;
          color: #4285f4;
        }

        .section-header h2 {
          color: #333;
          margin: 0;
          font-size: 1.5rem;
        }

        .custom-accordion .accordion-item {
          border: none;
          border-radius: 15px;
          margin-bottom: 15px;
          background: #f8f9fa;
          overflow: hidden;
        }

        .custom-accordion .accordion-button {
          background: #f8f9fa;
          border: none;
          padding: 20px;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .custom-accordion .accordion-button:not(.collapsed) {
          background: #4285f4;
          color: white;
        }

        .custom-accordion .accordion-button i {
          font-size: 1.2rem;
        }

        .custom-accordion .accordion-body {
          padding: 20px;
          background: white;
          border-top: 1px solid #e9ecef;
        }

        .solution-steps {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .step {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
        }

        .step-number {
          background: #4285f4;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .warning-card {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 15px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 10px;
          color: #856404;
        }

        .warning-card i {
          font-size: 1.5rem;
          color: #f39c12;
        }

        .contact-section {
          position: sticky;
          top: 100px;
        }

        .contact-card {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .contact-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
        }

        .contact-header i {
          font-size: 3rem;
          color: #34a853;
          margin-bottom: 15px;
        }

        .contact-header h3 {
          color: #333;
          margin-bottom: 10px;
        }

        .contact-header p {
          color: #666;
          margin: 0;
        }

        .contact-methods {
          margin-bottom: 30px;
        }

        .contact-method {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          margin-bottom: 15px;
          background: #f8f9fa;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .contact-method:hover {
          background: #e9ecef;
          transform: translateX(5px);
        }

        .method-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: white;
          flex-shrink: 0;
        }

        .method-icon.email {
          background: #ea4335;
        }
        .method-icon.phone {
          background: #4285f4;
        }
        .method-icon.chat {
          background: #34a853;
        }

        .method-info strong {
          display: block;
          color: #333;
          margin-bottom: 5px;
        }

        .method-info p {
          color: #666;
          margin: 0;
          font-weight: 500;
        }

        .method-info small {
          color: #999;
          font-size: 0.8rem;
        }

        .contact-form h4 {
          color: #333;
          margin-bottom: 20px;
          text-align: center;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-control {
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 15px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          border-color: #4285f4;
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
        }

        .submit-btn {
          width: 100%;
          background: #34a853;
          color: white;
          border: none;
          padding: 15px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-btn:hover {
          background: #2d9248;
          transform: translateY(-2px);
        }

        .alert-custom {
          border-radius: 12px;
          border: none;
          background: #d4edda;
          color: #155724;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .help-footer {
          background: rgba(255, 255, 255, 0.1);
          padding: 20px 0;
          margin-top: 50px;
          text-align: center;
          color: white;
        }

        @media (max-width: 768px) {
          .search-input-group {
            flex-direction: column;
          }

          .search-input {
            border-radius: 12px;
          }

          .search-btn {
            border-radius: 12px;
            width: 100%;
            justify-content: center;
          }

          .categories-container {
            flex-direction: column;
            border-radius: 12px;
          }

          .category-btn {
            border-radius: 12px;
            justify-content: center;
          }

          .contact-section {
            position: static;
            margin-top: 30px;
          }

          .back-button {
            width: 100%;
            text-align: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default Help;
