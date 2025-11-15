/* ========================================
   GLOBAL VARIABLES & CONFIGURATION
   ======================================== */

// API Keys (You need to replace these with your own!)
const WEATHER_API_KEY = "WEATHER_API_KEY";
const GEODB_API_KEY = "GEODB_API_KEY"; // Optional: for city autocomplete

// Globe instance
let myGlobe;

// Store current location for reference
let currentLocation = null;

/* ========================================
   INITIALIZE GLOBE ON PAGE LOAD
   ======================================== */

window.addEventListener("DOMContentLoaded", () => {
  initializeGlobe();

  // Add day/night lighting after globe loads
  setTimeout(() => {
    updateSunPosition();
    setInterval(updateSunPosition, 60000);
  }, 1500);

  setupEventListeners();

  // Optional: Load a default city on startup
  searchCity("New Delhi");
});

/* ========================================
   GLOBE INITIALIZATION WITH DAY/NIGHT SHADER
   ======================================== */

/* ========================================
   GLOBE INITIALIZATION WITH IMPROVED DAY/NIGHT
   ======================================== */

function initializeGlobe() {
  const globeContainer = document.getElementById("globeContainer");

  myGlobe = Globe()(globeContainer)
    .globeImageUrl(
      "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
    )
    .bumpImageUrl(
      "https://unpkg.com/three-globe/example/img/earth-topology.png"
    )
    .backgroundImageUrl(
      "https://unpkg.com/three-globe/example/img/night-sky.png"
    )
    .showGraticules(false)
    .showAtmosphere(true)
    .atmosphereColor("lightskyblue")
    .atmosphereAltitude(0.15)
    .pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

  /* ========================================
       EXPANDED MAJOR CITY LABELS (30+ CITIES)
       ======================================== */
  const majorCities = [
    // Americas
    { lat: 40.7128, lng: -74.006, name: "New York" },
    { lat: 34.0522, lng: -118.2437, name: "Los Angeles" },
    { lat: 19.4326, lng: -99.1332, name: "Mexico City" },
    { lat: -23.5505, lng: -46.6333, name: "São Paulo" },
    { lat: -34.6037, lng: -58.3816, name: "Buenos Aires" },
    { lat: 43.6532, lng: -79.3832, name: "Toronto" },

    // Europe
    { lat: 51.5074, lng: -0.1278, name: "London" },
    { lat: 48.8566, lng: 2.3522, name: "Paris" },
    { lat: 52.52, lng: 13.405, name: "Berlin" },
    { lat: 41.9028, lng: 12.4964, name: "Rome" },
    { lat: 40.4168, lng: -3.7038, name: "Madrid" },
    { lat: 55.7558, lng: 37.6176, name: "Moscow" },
    { lat: 59.3293, lng: 18.0686, name: "Stockholm" },

    // Asia
    { lat: 28.6139, lng: 77.209, name: "New Delhi" },
    { lat: 19.076, lng: 72.8777, name: "Mumbai" },
    { lat: 35.6895, lng: 139.6917, name: "Tokyo" },
    { lat: 39.9042, lng: 116.4074, name: "Beijing" },
    { lat: 31.2304, lng: 121.4737, name: "Shanghai" },
    { lat: 22.3193, lng: 114.1694, name: "Hong Kong" },
    { lat: 1.3521, lng: 103.8198, name: "Singapore" },
    { lat: 13.7563, lng: 100.5018, name: "Bangkok" },
    { lat: 37.5665, lng: 126.978, name: "Seoul" },
    { lat: 25.2048, lng: 55.2708, name: "Dubai" },
    { lat: 33.8938, lng: 35.5018, name: "Beirut" },
    { lat: 41.0082, lng: 28.9784, name: "Istanbul" },

    // Africa
    { lat: 30.0444, lng: 31.2357, name: "Cairo" },
    { lat: -26.2041, lng: 28.0473, name: "Johannesburg" },
    { lat: 6.5244, lng: 3.3792, name: "Lagos" },
    { lat: -1.2921, lng: 36.8219, name: "Nairobi" },

    // Oceania
    { lat: -33.8688, lng: 151.2093, name: "Sydney" },
    { lat: -37.8136, lng: 144.9631, name: "Melbourne" },
    { lat: -41.2865, lng: 174.7762, name: "Wellington" },
  ];

  // Add labels with better styling
  /* ========================================
   BALANCED MAJOR CITY LABELS (PERFORMANCE + VISUALS)
   ======================================== */
  myGlobe
    .labelsData(majorCities)
    .labelText("name")
    .labelSize(1.2)
    .labelColor(() => "#FFD700")
    .labelResolution(4)
    .labelAltitude(0.02)
    .labelDotRadius(0.18);

  // IMPROVED: Better ambient light balance
  const ambientLight = myGlobe
    .scene()
    .children.find((obj) => obj.type === "AmbientLight");
  if (ambientLight) {
    ambientLight.intensity = 0.15; // Increased from 0.05 for better visibility
  }

  // Day/Night shader with better settings
  const globeMaterial = myGlobe.globeMaterial();
  globeMaterial.bumpScale = 8;
  globeMaterial.roughness = 0.8;
  globeMaterial.metalness = 0.05;
  globeMaterial.color = new THREE.Color(0xffffff);
  globeMaterial.shininess = 10;

  // Load night lights texture
  new THREE.TextureLoader().load(
    "https://unpkg.com/three-globe/example/img/earth-night.jpg",
    (nightTexture) => {
      globeMaterial.emissiveMap = nightTexture;
      globeMaterial.emissive = new THREE.Color(0xffaa33);
      globeMaterial.emissiveIntensity = 1.2; // Increased for better night visibility
      addCloudLayer();
    }
  );

  myGlobe.controls().autoRotate = true;
  myGlobe.controls().autoRotateSpeed = 0.5;
  myGlobe.controls().enableZoom = true;

  console.log("🌍 Globe initialized with 30+ city labels and day/night cycle!");
}

/* ========================================
   REAL-TIME SUN POSITION (CREATES DAY/NIGHT)
   ======================================== */

function updateSunPosition() {
  const now = new Date();

  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const sunLongitude = hours * 15 + minutes * 0.25 - 180;
  const dayOfYear = Math.floor(
    (now - new Date(now.getFullYear(), 0, 0)) / 86400000
  );
  const sunLatitude = -23.44 * Math.cos((2 * Math.PI * (dayOfYear + 10)) / 365);

  // Remove previous sun lights
  const oldSun = myGlobe.scene().children.filter((o) => o.name === "SunLight");
  oldSun.forEach((o) => myGlobe.scene().remove(o));

  // Directional sunlight
  const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
  sunLight.name = "SunLight";

  const phi = ((90 - sunLatitude) * Math.PI) / 180;
  const theta = ((sunLongitude + 180) * Math.PI) / 180;
  const distance = 300;

  sunLight.position.set(
    distance * Math.sin(phi) * Math.cos(theta),
    distance * Math.cos(phi),
    distance * Math.sin(phi) * Math.sin(theta)
  );

  sunLight.castShadow = false;
  myGlobe.scene().add(sunLight);

  // Adjust ambient light to darken night side
  const ambient = myGlobe
    .scene()
    .children.find((obj) => obj.type === "AmbientLight");
  if (ambient) ambient.intensity = 0.05; // darker nights

  console.log(
    `☀️ Sun updated: lat ${sunLatitude.toFixed(1)}°, lon ${sunLongitude.toFixed(
      1
    )}°`
  );
}

/* ========================================
   CLOUD LAYER
   ======================================== */
function addCloudLayer() {
  const CLOUDS_IMG_URL =
    "https://unpkg.com/three-globe/example/img/earth-clouds.png";
  new THREE.TextureLoader().load(CLOUDS_IMG_URL, (texture) => {
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(myGlobe.getGlobeRadius() * 1.01, 75, 75),
      new THREE.MeshPhongMaterial({
        map: texture,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
      })
    );
    myGlobe.scene().add(clouds);

    // Slow rotation animation
    (function rotateClouds() {
      clouds.rotation.y += 0.0003;
      requestAnimationFrame(rotateClouds);
    })();
  });
}

/* ========================================
   EVENT LISTENERS
   ======================================== */

function setupEventListeners() {
  const searchInput = document.getElementById("citySearch");
  const searchBtn = document.getElementById("searchBtn");

  searchBtn.addEventListener("click", handleSearch);

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
}

function handleSearch() {
  const cityInput = document.getElementById("citySearch");
  const cityName = cityInput.value.trim();

  if (cityName === "") {
    alert("⚠️ Please enter a city name");
    return;
  }

  searchCity(cityName);
}

/* ========================================
   CITY SEARCH & GEOCODING
   ======================================== */

async function searchCity(cityName) {
  showLoading();
  hideError();

  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
      cityName
    )}&limit=1&appid=${WEATHER_API_KEY}`;

    const geoResponse = await fetch(geoUrl);

    if (!geoResponse.ok) {
      throw new Error("City not found");
    }

    const geoData = await geoResponse.json();

    if (geoData.length === 0) {
      throw new Error("City not found. Please check spelling.");
    }

    const location = geoData[0];
    currentLocation = {
      name: location.name,
      country: location.country,
      lat: location.lat,
      lon: location.lon,
    };

    console.log("📍 Location found:", currentLocation);

    rotateGlobeToLocation(location.lat, location.lon);
    await fetchWeatherData(location.lat, location.lon);
    showInfoPanel();
  } catch (error) {
    console.error("❌ Search error:", error);
    showError(error.message);
  } finally {
    hideLoading();
  }
}

/* ========================================
   GLOBE ROTATION ANIMATION
   ======================================== */

function rotateGlobeToLocation(lat, lon) {
  myGlobe.controls().autoRotate = false;

  myGlobe.pointOfView({ lat, lng: lon, altitude: 2 }, 1500);

  setTimeout(() => {
    myGlobe.controls().autoRotate = true;
  }, 2000);

  // Add the beautiful pulsing marker (like your original!)
  addLocationMarker(lat, lon);
}

/* ========================================
   BEAUTIFUL PULSING RED MARKER (ORIGINAL STYLE)
   ======================================== */

let currentMarkerData = [];

function addLocationMarker(lat, lon) {
  currentMarkerData = [{ lat, lng: lon }];

  // Remove previous labels for searched city (keep only golden ones)
  const existingData = myGlobe.htmlElementsData();
  const filteredData = existingData.filter((d) => d.size === 1); // Keep only city labels

  // Add new marker for searched city
  myGlobe
    .htmlElementsData([...filteredData, ...currentMarkerData])
    .htmlElement((d) => {
      if (d.size === 1) {
        // Golden city label
        const el = document.createElement("div");
        el.innerHTML = `
          <div style="
            color: gold;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 0 0 4px black, 0 0 8px black;
            pointer-events: none;
            white-space: nowrap;
          ">${d.name}</div>
        `;
        return el;
      } else {
        // RED PULSING MARKER for searched city
        const el = document.createElement("div");
        el.innerHTML = `
          <style>
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.3); opacity: 0.7; }
            }
          </style>
          <div style="
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 32, 32, 1) 0%, rgba(255,68,68,0) 70%);
            box-shadow: 0 0 25px rgba(252, 0, 0, 0.8);
            animation: pulse 1.5s ease-in-out infinite;
          "></div>
        `;
        return el;
      }
    });
}

/* ========================================
   WEATHER API INTEGRATION
   ======================================== */

async function fetchWeatherData(lat, lon) {
  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;

    const response = await fetch(weatherUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const weatherData = await response.json();

    console.log("🌤️ Weather data:", weatherData);

    updateWeatherPanel(weatherData);
  } catch (error) {
    console.error("❌ Weather fetch error:", error);
    throw error;
  }
}

/* ========================================
   UPDATE UI WITH WEATHER DATA
   ======================================== */

function updateWeatherPanel(data) {
  document.getElementById("cityName").textContent = currentLocation.name;
  document.getElementById("countryName").textContent = currentLocation.country;

  document.getElementById("temperature").textContent = Math.round(
    data.main.temp
  );

  const iconCode = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  document.getElementById("weatherIcon").src = iconUrl;
  document.getElementById("weatherIcon").alt = data.weather[0].description;

  document.getElementById("weatherDescription").textContent =
    data.weather[0].description;

  document.getElementById(
    "coordinates"
  ).textContent = `${currentLocation.lat.toFixed(
    2
  )}°, ${currentLocation.lon.toFixed(2)}°`;

  document.getElementById("humidity").textContent = `${data.main.humidity}%`;
  document.getElementById("windSpeed").textContent = `${data.wind.speed} m/s`;
  document.getElementById("feelsLike").textContent = `${Math.round(
    data.main.feels_like
  )}°C`;

  const visibilityKm = (data.visibility / 1000).toFixed(1);
  document.getElementById("visibility").textContent = `${visibilityKm} km`;

  document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;
}

/* ========================================
   UI STATE MANAGEMENT
   ======================================== */

function showInfoPanel() {
  const panel = document.getElementById("infoPanel");
  panel.classList.remove("hidden");
}

function hideInfoPanel() {
  const panel = document.getElementById("infoPanel");
  panel.classList.add("hidden");
}

function showLoading() {
  const loader = document.getElementById("loadingIndicator");
  loader.classList.remove("hidden");

  const details = document.querySelector(".weather-details");
  const weatherMain = document.querySelector(".weather-main");
  if (details) details.style.display = "none";
  if (weatherMain) weatherMain.style.display = "none";
}

function hideLoading() {
  const loader = document.getElementById("loadingIndicator");
  loader.classList.add("hidden");

  const details = document.querySelector(".weather-details");
  const weatherMain = document.querySelector(".weather-main");
  if (details) details.style.display = "grid";
  if (weatherMain) weatherMain.style.display = "block";
}

function showError(message) {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.querySelector("p").textContent = `⚠️ ${message}`;
  errorDiv.classList.remove("hidden");
}

function hideError() {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.classList.add("hidden");
}

/* ========================================
   AUTO-UPDATE SUN POSITION
   ======================================== */

setInterval(() => {
  if (myGlobe && myGlobe.scene()) {
    const lights = myGlobe
      .scene()
      .children.filter((child) => child instanceof THREE.DirectionalLight);
    lights.forEach((light) => myGlobe.scene().remove(light));

    updateSunPosition();
  }
}, 3600000); // Update every hour

/* ========================================
   INFO PANEL TOGGLE FEATURE
   ======================================== */
document.getElementById("togglePanelBtn").addEventListener("click", () => {
  const panel = document.getElementById("infoPanel");
  const btn = document.getElementById("togglePanelBtn");

  const isCollapsed = panel.classList.toggle("collapsed");

  // Move button with panel
  if (isCollapsed) {
    btn.classList.add("move-right");
    btn.textContent = "⬅️";
  } else {
    btn.classList.remove("move-right");
    btn.textContent = "➡️";
  }
});

/* ========================================
   CONSOLE WELCOME MESSAGE
   ======================================== */

console.log(`
🌍 3D Weather Globe Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Beautiful Blue Marble Earth
☀️ Real-Time Day/Night Effect
🏙️ Golden City Labels
🔴 Pulsing Search Marker
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ready! 🚀
`);

