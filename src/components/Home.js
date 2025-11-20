// src/components/Home.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Alert } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { auth, firestore } from "../services/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Importar las imágenes
import restauranteImg from "../assets/restaurante.png";
import tiendaImg from "../assets/tienda.png";
import servicioImg from "../assets/servicio.png";
import hotelImg from "../assets/hotel.png";
import entretenimientoImg from "../assets/entretenimiento.png";
import usuarioImg from "../assets/usuario.png";
import logoImg from "../assets/Logo.jpeg";

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

// Radio de búsqueda en kilómetros
const SEARCH_RADIUS_KM = 5;

// Función para calcular distancia entre dos puntos (fórmula Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en km
};

// Iconos personalizados con imágenes importadas
const createCustomIcon = (iconUrl) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-image: url('${iconUrl}'); 
      background-size: cover; 
      background-position: center;
      width: 32px; 
      height: 32px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

// Configuración de iconos por categoría con imágenes importadas
const categoryIcons = {
  restaurante: createCustomIcon(restauranteImg),
  tienda: createCustomIcon(tiendaImg),
  servicio: createCustomIcon(servicioImg),
  hotel: createCustomIcon(hotelImg),
  entretenimiento: createCustomIcon(entretenimientoImg),
  default: createCustomIcon(restauranteImg),
};

// Icono de usuario para ubicación actual
const userIcon = L.divIcon({
  className: "user-location-marker",
  html: `
    <div style="
      position: relative;
      width: 40px;
      height: 40px;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        background: #0b4bb0;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      "></div>
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 2px solid #0b4bb0;
        border-radius: 50%;
        animation: pulse 2s infinite;
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function Home() {
  const [userLocation, setUserLocation] = useState([13.6929, -89.2182]);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resultCount, setResultCount] = useState(0);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);
  const navigate = useNavigate();
  const mapRef = useRef();
  const locationWatchIdRef = useRef(null);

  const categories = [
    { value: "todos", label: "Todos" },
    { value: "restaurante", label: "Restaurante" },
    { value: "tienda", label: "Tienda" },
    { value: "servicio", label: "Servicio" },
    { value: "hotel", label: "Hotel" },
    { value: "entretenimiento", label: "Entretenimiento" },
  ];

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

  const filterBusinesses = useCallback(() => {
    let filtered = businesses;

    if (selectedCategory !== "todos") {
      filtered = filtered.filter(
        (business) =>
          business.categoria?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (business) =>
          business.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          business.descripcion
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBusinesses(filtered);
    setResultCount(filtered.length);
  }, [searchQuery, selectedCategory, businesses]);

  // Función para centrar el mapa en la ubicación del usuario
  const centerMapOnUser = useCallback(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView(userLocation, 16);
    }
  }, [userLocation]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    // Iniciar seguimiento de ubicación en tiempo real
    startLocationTracking();

    return () => {
      unsubscribe();
      stopLocationTracking();
    };
  }, []);

  // Centrar mapa cuando se obtiene la ubicación del usuario
  useEffect(() => {
    if (userLocation && mapRef.current) {
      centerMapOnUser();
    }
  }, [userLocation, centerMapOnUser]);

  useEffect(() => {
    filterBusinesses();
  }, [filterBusinesses]);

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

  // Iniciar seguimiento de ubicación en tiempo real
  const startLocationTracking = () => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      };

      setLoading(true);

      // Primero obtener ubicación actual
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const accuracy = position.coords.accuracy;
          console.log(
            `📍 Ubicación inicial obtenida: ${latitude}, ${longitude}`
          );

          setUserLocation([latitude, longitude]);
          setLocationAccuracy(accuracy);

          // Cargar negocios cercanos después de obtener la ubicación
          loadNearbyBusinesses(latitude, longitude);

          setLoading(false);

          // Iniciar seguimiento en tiempo real
          startWatchingLocation();
        },
        (error) => {
          console.warn("Error obteniendo ubicación inicial:", error);
          handleLocationError(error);
          setLoading(false);
        },
        options
      );
    } else {
      console.warn("Geolocalización no soportada");
      loadAllBusinesses();
      setLoading(false);
    }
  };

  // Iniciar seguimiento continuo de ubicación
  const startWatchingLocation = () => {
    if (navigator.geolocation && !locationWatchIdRef.current) {
      const options = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000,
      };

      locationWatchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const accuracy = position.coords.accuracy;

          console.log(`📍 Ubicación actualizada: ${latitude}, ${longitude}`);

          setUserLocation([latitude, longitude]);
          setLocationAccuracy(accuracy);
          setIsWatchingLocation(true);

          // Recargar negocios cercanos con la nueva ubicación
          loadNearbyBusinesses(latitude, longitude);
        },
        (error) => {
          console.warn("Error en seguimiento de ubicación:", error);
          setIsWatchingLocation(false);
        },
        options
      );
    }
  };

  // Detener seguimiento de ubicación
  const stopLocationTracking = () => {
    if (locationWatchIdRef.current) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
      setIsWatchingLocation(false);
    }
  };

  const handleLocationError = (error) => {
    let message = "";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message =
          "Permiso de ubicación denegado. Se usarán todos los negocios.";
        break;
      case error.POSITION_UNAVAILABLE:
        message = "Ubicación no disponible. Se usarán todos los negocios.";
        break;
      case error.TIMEOUT:
        message = "Tiempo de espera agotado. Se usarán todos los negocios.";
        break;
      default:
        message =
          "Error al obtener la ubicación. Se usarán todos los negocios.";
    }
    alert(`📍 ${message}`);

    // Cargar todos los negocios como fallback
    loadAllBusinesses();
  };

  const loadNearbyBusinesses = async (userLat, userLng) => {
    try {
      const q = collection(firestore, "ubicate", "negocios", "registros");
      const querySnapshot = await getDocs(q);
      const allBusinesses = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filtrar negocios dentro del radio especificado
      const nearbyBusinesses = allBusinesses.filter((business) => {
        if (
          !business.ubicacion ||
          !business.ubicacion.latitude ||
          !business.ubicacion.longitude
        ) {
          return false;
        }

        const businessLat = business.ubicacion.latitude;
        const businessLng = business.ubicacion.longitude;

        const distance = calculateDistance(
          userLat,
          userLng,
          businessLat,
          businessLng
        );

        return distance <= SEARCH_RADIUS_KM;
      });

      console.log(
        `📍 Encontrados ${nearbyBusinesses.length} negocios dentro de ${SEARCH_RADIUS_KM}km`
      );

      setBusinesses(nearbyBusinesses);
      setFilteredBusinesses(nearbyBusinesses);
      setResultCount(nearbyBusinesses.length);

      // Mostrar círculo de radio de búsqueda
      if (mapRef.current) {
        // Remover círculo anterior si existe
        mapRef.current.eachLayer((layer) => {
          if (
            layer instanceof L.Circle &&
            layer.options.radius === SEARCH_RADIUS_KM * 1000
          ) {
            mapRef.current.removeLayer(layer);
          }
        });

        // Agregar nuevo círculo de radio
        L.circle([userLat, userLng], {
          color: "#34a853",
          fillColor: "#34a853",
          fillOpacity: 0.1,
          radius: SEARCH_RADIUS_KM * 1000, // Convertir a metros
        }).addTo(mapRef.current);
      }
    } catch (error) {
      console.error("Error cargando negocios cercanos:", error);
      // Fallback: cargar todos los negocios
      loadAllBusinesses();
    }
  };

  const loadAllBusinesses = async () => {
    try {
      const q = collection(firestore, "ubicate", "negocios", "registros");
      const querySnapshot = await getDocs(q);
      const businessesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setBusinesses(businessesData);
      setFilteredBusinesses(businessesData);
      setResultCount(businessesData.length);
    } catch (error) {
      console.error("Error cargando todos los negocios:", error);
    }
  };

  const setupRealTimeListener = () => {
    const negociosRef = collection(
      firestore,
      "ubicate",
      "negocios",
      "registros"
    );

    return onSnapshot(negociosRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const business = {
            id: change.doc.id,
            ...change.doc.data(),
          };

          // Solo agregar si está cerca del usuario
          if (userLocation && business.ubicacion) {
            const distance = calculateDistance(
              userLocation[0],
              userLocation[1],
              business.ubicacion.latitude,
              business.ubicacion.longitude
            );

            if (distance <= SEARCH_RADIUS_KM) {
              setBusinesses((prev) => {
                if (!prev.find((b) => b.id === business.id)) {
                  return [...prev, business];
                }
                return prev;
              });
            }
          }
        }
      });
    });
  };

  const toggleFavorite = async (businessId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      const userFavRef = doc(
        firestore,
        "ubicate",
        "usuarios",
        "favoritos",
        user.uid
      );
      const favDoc = await getDoc(userFavRef);

      const currentFavorites = favDoc.exists()
        ? favDoc.data().negocios || []
        : [];

      if (currentFavorites.includes(businessId)) {
        const newFavorites = currentFavorites.filter((id) => id !== businessId);
        await setDoc(userFavRef, {
          negocios: newFavorites,
          ultimaActualizacion: new Date(),
        });
        updateFavoriteButton(businessId, false);
      } else {
        currentFavorites.push(businessId);
        await setDoc(userFavRef, {
          negocios: currentFavorites,
          ultimaActualizacion: new Date(),
        });
        updateFavoriteButton(businessId, true);
      }
    } catch (error) {
      console.error("Error gestionando favorito:", error);
    }
  };

  const updateFavoriteButton = (businessId, isFavorite) => {
    const button = document.getElementById(`btn-fav-${businessId}`);
    if (button) {
      if (isFavorite) {
        button.innerHTML = '<i class="bi bi-heart-fill"></i>';
        button.className = "btn-favorito favorito-activo";
      } else {
        button.innerHTML = '<i class="bi bi-heart"></i>';
        button.className = "btn-favorito favorito-inactivo";
      }
    }
  };

  const checkFavoriteStatus = async (businessId) => {
    if (!auth.currentUser) return;

    try {
      const userFavRef = doc(
        firestore,
        "ubicate",
        "usuarios",
        "favoritos",
        auth.currentUser.uid
      );
      const favDoc = await getDoc(userFavRef);

      if (favDoc.exists()) {
        const favorites = favDoc.data().negocios || [];
        const isFavorite = favorites.includes(businessId);
        updateFavoriteButton(businessId, isFavorite);
      }
    } catch (error) {
      console.error("Error verificando favorito:", error);
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

  const getCategoryIcon = (categoria) => {
    return categoryIcons[categoria] || categoryIcons.default;
  };

  const LocationMarker = () => {
    const map = useMap();

    useEffect(() => {
      if (userLocation && map) {
        // Remover marcador anterior si existe
        const existingMarker = document.querySelector(".user-location-marker");
        if (existingMarker) {
          map.eachLayer((layer) => {
            if (layer instanceof L.Marker && layer.getLatLng) {
              const latLng = layer.getLatLng();
              if (
                latLng.lat === userLocation[0] &&
                latLng.lng === userLocation[1]
              ) {
                map.removeLayer(layer);
              }
            }
          });
        }

        // Crear nuevo marcador
        const marker = L.marker(userLocation, {
          icon: userIcon,
          zIndexOffset: 1000,
        })
          .addTo(map)
          .bindPopup("<b>📍 Tu ubicación actual</b>");

        setTimeout(() => {
          marker.openPopup();
        }, 1000);
      }
    }, [userLocation, map]);

    return null;
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

  const focusBusiness = (business) => {
    if (mapRef.current) {
      const lat = business.ubicacion?.latitude || business.lat || 13.6929;
      const lng = business.ubicacion?.longitude || business.lng || -89.2182;
      mapRef.current.setView([lat, lng], 16);

      document.getElementById("map").scrollIntoView({ behavior: "smooth" });
    }
  };

  const buscarDireccion = async () => {
    if (!searchQuery.trim()) {
      filterBusinesses();
      return;
    }

    const btnBuscar = document.querySelector(".search-btn");
    const originalText = btnBuscar.innerHTML;
    btnBuscar.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span>';
    btnBuscar.disabled = true;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const lugar = data[0];
        const newLocation = [parseFloat(lugar.lat), parseFloat(lugar.lon)];
        setUserLocation(newLocation);

        if (mapRef.current) {
          mapRef.current.setView(newLocation, 15);
        }

        // Recargar negocios cercanos a la nueva ubicación
        loadNearbyBusinesses(newLocation[0], newLocation[1]);
      } else {
        alert("No se encontraron resultados para tu búsqueda.");
      }
    } catch (error) {
      console.error("Error en búsqueda:", error);
      alert("Error al buscar la dirección");
    } finally {
      btnBuscar.innerHTML = "Buscar";
      btnBuscar.disabled = false;
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      buscarDireccion();
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
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          className="spinner-border text-light"
          style={{ width: "3rem", height: "3rem" }}
          role="status"
        >
          <span className="visually-hidden">Cargando...</span>
        </div>
        <div className="text-light">Obteniendo tu ubicación...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#0b4bb0",
        minHeight: "100vh",
        paddingBottom: "80px",
      }}
    >
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light navbar-custom">
        <div className="container-fluid">
          <div className="navbar-brand">
            <img src={logoImg} alt="Logo" className="logo-img" />
          </div>
          <div className="navbar-title">Bienvenido</div>

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

      {/* Barra de búsqueda */}
      <div className="search-container">
        <input
          type="text"
          id="direccion"
          className="input-direccion"
          placeholder="¿Qué buscas hoy?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleSearchKeyPress}
        />
        <button onClick={buscarDireccion} className="search-btn">
          Buscar
        </button>
      </div>

      {/* Filtro por categoría */}
      <div className="search-container">
        <select
          id="categoriaFiltro"
          className="select-categoria"
          title="Filtrar por categoría"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        {/* Indicador de ubicación en tiempo real */}
        {isWatchingLocation && (
          <div className="location-status">
            <i className="bi bi-geo-alt-fill text-success"></i>
            <small className="text-white">
              Ubicación en tiempo real activa
            </small>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div id="map" style={{ height: "55vh", width: "100%", zIndex: 1 }}>
        <MapContainer
          center={userLocation}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <LocationMarker />

          {filteredBusinesses.map((business) => (
            <Marker
              key={business.id}
              position={[
                business.ubicacion?.latitude || business.lat || 13.6929,
                business.ubicacion?.longitude || business.lng || -89.2182,
              ]}
              icon={getCategoryIcon(business.categoria)}
            >
              <Popup onOpen={() => checkFavoriteStatus(business.id)}>
                <div
                  className="leaflet-popup-content"
                  style={{ minWidth: "200px" }}
                >
                  <div className="popup-title">{business.nombre}</div>
                  <div className="popup-info">
                    <i className="bi bi-tag"></i>{" "}
                    {business.categoria || "No especificado"}
                  </div>
                  <div className="popup-info">
                    <i className="bi bi-telephone"></i>{" "}
                    {business.telefono || "No especificado"}
                  </div>
                  <div className="popup-info">
                    <i className="bi bi-clock"></i>{" "}
                    {business.horario || "No especificado"}
                  </div>
                  {business.descripcion && (
                    <div className="popup-info">
                      <i className="bi bi-info-circle"></i>{" "}
                      {business.descripcion}
                    </div>
                  )}
                  <div className="popup-favorito">
                    <button
                      id={`btn-fav-${business.id}`}
                      className="btn-favorito favorito-inactivo"
                      onClick={() => toggleFavorite(business.id)}
                    >
                      <i className="bi bi-heart"></i>
                    </button>
                    <br />
                    <small>Agregar a favoritos</small>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Lista de negocios */}
      <div className="business-list-container">
        <h4
          style={{
            color: "white",
          }}
        >
          <i className="bi bi-geo-alt"></i> Negocios cercanos
        </h4>
        <div id="business-list">
          {filteredBusinesses.length === 0 ? (
            <div className="alert alert-info">
              No se encontraron negocios cercanos dentro de {SEARCH_RADIUS_KM}
              km.
            </div>
          ) : (
            filteredBusinesses.map((business) => (
              <div key={business.id} className="business-card">
                <h5>{business.nombre}</h5>
                <p>
                  <i className="bi bi-tag"></i> {business.categoria}
                </p>
                <p>
                  <i className="bi bi-telephone"></i> {business.telefono}
                </p>
                <p>
                  <i className="bi bi-clock"></i>{" "}
                  {business.horario || "No especificado"}
                </p>
                {business.descripcion && (
                  <p>
                    <i className="bi bi-info-circle"></i> {business.descripcion}
                  </p>
                )}
                <div className="d-flex gap-2 mt-2">
                  <button
                    onClick={() => focusBusiness(business)}
                    className="btn btn-sm btn-outline-primary"
                  >
                    <i className="bi bi-geo-alt"></i> Ver en mapa
                  </button>
                  <button
                    onClick={() => toggleFavorite(business.id)}
                    className="btn btn-sm btn-outline-danger"
                  >
                    <i className="bi bi-heart"></i> Favorito
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Botones flotantes*/}
      <div className="botones-flotantes">
        <button
          className="boton-accion"
          onClick={() => navigate("/favorites")}
          title="Mis Favoritos"
        >
          <i className="bi bi-heart-fill"></i>
        </button>
      </div>

      <footer className="mt-5 py-4">
        <div className="container text-center text-white">
          <p>&copy; 2023 Ubicate - Todos los derechos reservados</p>
        </div>
      </footer>

      {/* Estilos CSS */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

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

        .search-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          padding: 15px;
          background: #0b4bb0;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }

        .input-direccion {
          width: 200px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          margin-left: 25px;
        }

        .search-btn {
          width: 80px;
          margin-right: 10px;
          padding: 10px;
          background: #34a853;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }

        .search-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .select-categoria {
          padding: 10px 15px;
          border: 2px solid #0b4bb0;
          border-radius: 25px;
          background: white;
          color: #333;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          transition: all 0.3s ease;
          min-width: 150px;
        }

        .location-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }

        .business-list-container {
          padding: 20px;
          background-color: #0b4bb0;
          border-radius: 15px 15px 0 0;
          margin-top: -20px;
          position: relative;
          zindex: 2;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
        }

        .business-card {
          margin-bottom: 15px;
          padding: 15px;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          border-left: 4px solid #4285f4;
        }

        .business-card h5 {
          color: #4285f4;
          margin-bottom: 5px;
        }

        .leaflet-popup-content {
          min-width: 200px;
        }

        .popup-title {
          font-weight: bold;
          color: #4285f4;
          margin-bottom: 5px;
        }

        .popup-info {
          margin: 3px 0;
          font-size: 0.9rem;
        }

        .popup-info i {
          width: 15px;
          text-align: center;
          margin-right: 5px;
          color: #6c757d;
        }

        .popup-favorito {
          text-align: center;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }

        .btn-favorito {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          transition: transform 0.2s;
          padding: 5px;
        }

        .btn-favorito:hover {
          transform: scale(1.2);
        }

        .favorito-activo {
          color: #dc3545;
        }

        .favorito-inactivo {
          color: #6c757d;
        }

        .botones-flotantes {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 1000;
        }

        .boton-accion {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #4285f4;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
          cursor: pointer;
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

        .contador-resultados {
          margin-bottom: 15px;
          padding: 0 20px;
        }

        .contador-resultados .alert {
          margin: 0;
          padding: 10px 15px;
          border-radius: 8px;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .search-container {
            flex-direction: column;
            align-items: stretch;
          }

          .input-direccion {
            width: 100%;
            margin: 0 0 10px 0;
          }

          .search-btn {
            width: 100%;
            margin: 0 0 10px 0;
          }

          .select-categoria {
            width: 100%;
            margin-bottom: 10px;
          }

          .location-status {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default Home;
