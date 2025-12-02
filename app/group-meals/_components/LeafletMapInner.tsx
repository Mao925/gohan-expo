'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export type MeetingPlaceMapProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
};

const defaultIcon = L.icon({
  iconUrl: (markerIcon as any).src ?? (markerIcon as any),
  iconRetinaUrl: (markerIcon2x as any).src ?? (markerIcon2x as any),
  shadowUrl: (markerShadow as any).src ?? (markerShadow as any),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

function ClickHandler(props: { onChange: MeetingPlaceMapProps['onChange'] }) {
  useMapEvents({
    click(e) {
      props.onChange({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    },
  });
  return null;
}

export default function LeafletMapInner({ latitude, longitude, onChange }: MeetingPlaceMapProps) {
  const [center] = useState<[number, number]>([
    latitude ?? 35.710057,
    longitude ?? 139.810718,
  ]);

  const position: [number, number] | null =
    latitude != null && longitude != null ? [latitude, longitude] : null;

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border">
      <MapContainer center={center} zoom={14} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onChange={onChange} />
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  );
}
