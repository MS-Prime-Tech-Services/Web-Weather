// Initialize the map with better tiles
const map = L.map('map').setView([20.5937, 78.9629], 5); // Default center on India

// Use a better map style with more detail
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Weather API endpoints and configurations
const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid=${API_KEY}&units=metric&lang=en`;
const geocodingApiUrl = `https://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid=${API_KEY}`;

// Show loading state
function showLoading() {
    document.body.classList.add('loading');
    const controls = document.querySelector('.controls');
    if (controls) {
        controls.style.opacity = '0.5';
        controls.style.pointerEvents = 'none';
    }
}

// Hide loading state
function hideLoading() {
    document.body.classList.remove('loading');
    const controls = document.querySelector('.controls');
    if (controls) {
        controls.style.opacity = '1';
        controls.style.pointerEvents = 'auto';
    }
}

// Clear existing markers
function clearMarkers() {
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
}

// Display weather data for a location
async function displayWeatherData(lat, lon, locationName = '') {
    try {
        showLoading();
        const weatherData = await fetchWeather(lat, lon);
        clearMarkers();

        const temp = weatherData.main.temp.toFixed(1);
        const windSpeed = weatherData.wind.speed.toFixed(1);
        const humidity = weatherData.main.humidity;
        const description = weatherData.weather[0].description;
        const icon = weatherData.weather[0].icon;

        const popupContent = `
            <div class="weather-popup">
                <h3>${locationName || 'Current Location'}</h3>
                <img src="https://openweathermap.org/img/w/${icon}.png" alt="Weather icon">
                <p class="temp">${temp}°C</p>
                <p class="description">${description}</p>
                <div class="details">
                    <p>Wind: ${windSpeed} m/s</p>
                    <p>Humidity: ${humidity}%</p>
                </div>
            </div>
        `;

        // Add marker with custom icon
        const weatherIcon = L.divIcon({
            className: 'weather-icon',
            html: `<img src="https://openweathermap.org/img/w/${icon}.png" alt="Weather icon">`,
            iconSize: [50, 50]
        });

        L.marker([lat, lon], { icon: weatherIcon })
            .addTo(map)
            .bindPopup(popupContent)
            .openPopup();

        map.setView([lat, lon], 10);
    } catch (error) {
        console.error('Error displaying weather:', error);
        alert('Error loading weather data. Please try again.');
    } finally {
        hideLoading();
    }
}

// Get current location and display weather
function getCurrentLocation() {
    showLoading();
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await displayWeatherData(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error getting weather data. Please try searching for a city instead.');
                    hideLoading();
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Location access denied. Please search for a city instead.');
                hideLoading();
                map.setView([20.5937, 78.9629], 5); // Center on India
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Please search for a city instead.');
        hideLoading();
        map.setView([20.5937, 78.9629], 5);
    }
}

// API helper functions
async function fetchWeather(lat, lon) {
    try {
        const url = weatherApiUrl.replace('{lat}', lat).replace('{lon}', lon);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw new Error('Unable to fetch weather data. Please try again.');
    }
}

async function fetchCityCoordinates(city) {
    try {
        const url = geocodingApiUrl.replace('{city}', encodeURIComponent(city));
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('City search failed');
        }
        const data = await response.json();
        if (data.length === 0) {
            throw new Error('City not found');
        }
        return data[0];
    } catch (error) {
        console.error('Error fetching city:', error);
        throw new Error('Unable to find the specified city. Please try another city name.');
    }
}

// Search functionality
document.getElementById('searchButton').addEventListener('click', async () => {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput.value.trim();

    if (!city) {
        alert('Please enter a city name');
        return;
    }

    try {
        showLoading();
        const coordinates = await fetchCityCoordinates(city);
        await displayWeatherData(coordinates.lat, coordinates.lon, coordinates.name);
    } catch (error) {
        alert(error.message);
    } finally {
        hideLoading();
    }
});

// Add keyboard event listener for search
document.getElementById('cityInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('searchButton').click();
    }
});

// Initialize map with default view
map.setView([20.5937, 78.9629], 5);
getCurrentLocation();