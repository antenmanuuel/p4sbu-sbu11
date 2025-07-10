/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create custom marker icons
const createParkingIcon = (availability, isSelected = false) => {
    let colorClass = 'bg-red-500'; // Default: full (low availability)

    if (availability > 75) {
        colorClass = 'bg-green-500'; // Lots of space
    } else if (availability > 25) {
        colorClass = 'bg-amber-500'; // Limited space
    }

    // For Leaflet markers, we need to create an HTML string with Tailwind classes
    const markerSize = isSelected ? 'w-7 h-7' : 'w-6 h-6';
    const iconSize = isSelected ? 'text-sm' : 'text-xs';
    const scaleClass = isSelected ? 'scale-110' : 'scale-100';

    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div class="${colorClass} ${markerSize} rounded-full flex items-center justify-center text-white font-bold ${iconSize} border-3 border-white shadow-lg ${scaleClass} transition-transform">
                <span class="text-white ${iconSize}">P</span>
            </div>
        `,
        iconSize: [isSelected ? 28 : 24, isSelected ? 28 : 24],
        iconAnchor: [isSelected ? 14 : 12, isSelected ? 14 : 12],
        popupAnchor: [0, -10]
    });
};

const ParkingMap = ({
    darkMode,
    mapCenter,
    markers,
    selectedLot,
    onMarkerClick,
    onMapClick
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const tileLayerRef = useRef(null);

    // Initialize map
    useEffect(() => {
        if (!mapInstanceRef.current && mapRef.current) {
            // Set up the map
            const map = L.map(mapRef.current, {
                center: mapCenter || [40.9144, -73.1235], // Default to SBU coordinates
                zoom: 15,
                zoomControl: false,
            });

            // Create a markers layer group
            markersLayerRef.current = L.layerGroup().addTo(map);

            // Store the map instance
            mapInstanceRef.current = map;

            // Add click handler to the map
            map.on('click', (e) => {
                if (onMapClick) {
                    onMapClick(e.latlng);
                }
            });

            // Add zoom control to top-right
            L.control.zoom({
                position: 'topright'
            }).addTo(map);
        }

        // Clean up on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Load map tiles (always using light theme)
    useEffect(() => {
        if (mapInstanceRef.current) {
            // Remove existing tile layer if it exists
            if (tileLayerRef.current) {
                mapInstanceRef.current.removeLayer(tileLayerRef.current);
            }

            // Always use light mode map tiles regardless of dark mode setting
            tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(mapInstanceRef.current);
        }
    }, [darkMode]); // Keep the dependency to ensure the effect runs when darkMode changes

    // Update map center when coordinates change
    useEffect(() => {
        if (mapInstanceRef.current && mapCenter) {
            mapInstanceRef.current.setView(mapCenter, 15, { animate: true });
        }
    }, [mapCenter]);

    // Update markers when they change
    useEffect(() => {
        if (mapInstanceRef.current && markersLayerRef.current && markers) {
            // Clear existing markers
            markersLayerRef.current.clearLayers();

            // Add new markers
            markers.forEach(marker => {
                const availability = Math.floor((marker.availableSpaces / marker.totalSpaces) * 100);
                const isSelected = selectedLot && selectedLot.id === marker.id;
                const icon = createParkingIcon(availability, isSelected);

                const markerObj = L.marker(marker.coordinates, { icon })
                    .addTo(markersLayerRef.current)
                    .bindPopup(`
            <div class="p-3">
              <div class="font-medium text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}">${marker.name}</div>
              <div class="text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1">${marker.availableSpaces}/${marker.totalSpaces} spots available</div>
              ${marker.distance ? `<div class="text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2">${marker.distance} from destination</div>` : ''}
              <button class="w-full py-1.5 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors mt-2">View Details</button>
            </div>
          `);

                // Add click handler
                markerObj.on('click', () => {
                    if (onMarkerClick) {
                        onMarkerClick(marker);
                    }
                });

                // Add popup content click handler for the button
                markerObj.getPopup().on('add', () => {
                    const btn = document.querySelector('.leaflet-popup-content button');
                    if (btn) {
                        btn.addEventListener('click', (event) => {
                            event.stopPropagation();
                            if (onMarkerClick) {
                                onMarkerClick(marker);
                            }
                            markerObj.closePopup();
                        });
                    }
                });

                // Highlight selected lot
                if (selectedLot && selectedLot.id === marker.id) {
                    markerObj.openPopup();
                }
            });
        }
    }, [markers, selectedLot, onMarkerClick, darkMode]);

    // Apply dark mode to map elements
    useEffect(() => {
        // Apply dark mode or light mode classes to the map container
        const mapContainer = mapRef.current;
        if (mapContainer) {
            mapContainer.classList.toggle('dark-map', darkMode);
        }
    }, [darkMode]);

    return (
        <div
            ref={mapRef}
            className="w-full h-full rounded-md overflow-hidden"
            aria-label="Interactive parking map"
        />
    );
};

export default ParkingMap; 