'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouteStore } from '@/store/useRouteStore';

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const complaintsLayerRef = useRef<any>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const { roadsGeoJson, complaints, selectSegment, selectedSegmentId } = useRouteStore();

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted || !mapRef.current || mapInstance.current) return;

    // Load Leaflet dynamically on client-side only
    const L = require('leaflet');

    // Fix marker default icons
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Initialize Map centering New York City (matches our seeded data coordinates)
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([40.752, -73.978], 13.5);

    // Apply CartoDB Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;
  }, [isMounted]);

  // Handle Roads GeoJSON drawing
  useEffect(() => {
    if (!mapInstance.current || !roadsGeoJson) return;

    const L = require('leaflet');

    // Remove old layer if exists
    if (geoJsonLayerRef.current) {
      mapInstance.current.removeLayer(geoJsonLayerRef.current);
    }

    // Custom Line styling matching risk index
    const styleFeature = (feature: any) => {
      const risk = feature.properties.risk;
      let color = '#39FF14'; // Green
      let weight = 4;

      if (risk === 'Critical') {
        color = '#FF3B30'; // Critical Red
        weight = 7;
      } else if (risk === 'High') {
        color = '#FF9100'; // Amber
        weight = 5;
      } else if (risk === 'Medium') {
        color = '#FFD60A'; // Yellow
        weight = 4;
      }

      // If this segment is selected, add active style
      if (feature.properties.id === selectedSegmentId) {
        color = '#00E5FF'; // Electric Blue override
        weight = 8;
      }

      return {
        color,
        weight,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      };
    };

    geoJsonLayerRef.current = L.geoJSON(roadsGeoJson, {
      style: styleFeature,
      onEachFeature: (feature: any, layer: any) => {
        layer.on({
          click: (e: any) => {
            L.DomEvent.stopPropagation(e);
            selectSegment(feature.properties.id);
          },
          mouseover: () => {
            layer.setStyle({ opacity: 1.0, weight: layer.options.weight + 2 });
          },
          mouseout: () => {
            geoJsonLayerRef.current.resetStyle(layer);
            // Reapply active styling if selected
            if (feature.properties.id === selectedSegmentId) {
              layer.setStyle({ color: '#00E5FF', weight: 8 });
            }
          }
        });

        layer.bindTooltip(
          `<div><strong>${feature.properties.roadName}</strong><br/>Health: ${feature.properties.health}% (${feature.properties.risk})</div>`,
          { sticky: true }
        );
      }
    }).addTo(mapInstance.current);

  }, [roadsGeoJson, selectedSegmentId]);

  // Handle citizen complaints drawing
  useEffect(() => {
    if (!mapInstance.current || !complaints) return;

    const L = require('leaflet');

    if (complaintsLayerRef.current) {
      mapInstance.current.removeLayer(complaintsLayerRef.current);
    }

    const complaintMarkers = complaints.map((complaint) => {
      const [lng, lat] = complaint.location.coordinates;
      const severity = complaint.severity;
      
      let color = '#FFD60A'; // Low/Medium -> Yellow
      if (severity === 'Critical') {
        color = '#FF3B30'; // Critical Red
      } else if (severity === 'High') {
        color = '#FF9100'; // High Orange
      }

      // Using CircleMarker for elegant GIS heat dots
      const marker = L.circleMarker([lat, lng], {
        radius: severity === 'Critical' ? 10 : 7,
        fillColor: color,
        color: '#FFFFFF',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.8,
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <h3 style="margin: 0 0 4px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px;">
            ${complaint.title}
          </h3>
          <p style="margin: 4px 0; font-size: 11px; color: #bbb;">${complaint.description}</p>
          <div style="display: flex; gap: 4px; margin-top: 6px;">
            <span style="font-size: 9px; padding: 2px 4px; background: ${color}20; color: ${color}; border: 1px solid ${color}; border-radius: 4px; text-transform: uppercase;">
              ${severity}
            </span>
            <span style="font-size: 9px; padding: 2px 4px; background: #333; color: #fff; border-radius: 4px;">
              ${complaint.category}
            </span>
          </div>
        </div>
      `);

      return marker;
    });

    complaintsLayerRef.current = L.layerGroup(complaintMarkers).addTo(mapInstance.current);

  }, [complaints]);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-background/80 border border-border flex items-center justify-center rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-t-electricBlue border-border rounded-full animate-spin"></div>
          <span className="text-sm font-mono text-textSecondary uppercase tracking-widest">Loading Live GIS layers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border glow-blue/20">
      <div ref={mapRef} className="w-full h-full" />
      {/* Small floating map legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur border border-border px-3 py-2.5 rounded-lg shadow-xl font-mono text-xs">
        <h4 className="font-bold text-white mb-2 uppercase tracking-wide text-[10px] text-electricBlue">Road Condition Risk</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-6 bg-[#39FF14] rounded-full"></span>
            <span>Low Risk (75-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-6 bg-[#FFD60A] rounded-full"></span>
            <span>Medium Risk (60-75)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-6 bg-[#FF9100] rounded-full"></span>
            <span>High Risk (40-60)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-6 bg-[#FF3B30] rounded-full"></span>
            <span>Critical Failure (&lt;40)</span>
          </div>
          <div className="h-px bg-border my-1.5" />
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-white bg-criticalRed"></span>
            <span>Citizen Complaint</span>
          </div>
        </div>
      </div>
    </div>
  );
}
