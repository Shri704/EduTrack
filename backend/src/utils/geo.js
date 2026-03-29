export const toRadians = (deg) => (deg * Math.PI) / 180;

// Haversine distance in meters
export const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const validateGeofence = ({
  campusLat,
  campusLng,
  radiusMeters,
  lat,
  lng,
  accuracy
}) => {
  if (
    campusLat === undefined ||
    campusLng === undefined ||
    radiusMeters === undefined
  ) {
    throw new Error("Campus geofence is not configured");
  }

  const d = distanceMeters(campusLat, campusLng, lat, lng);
  const within = d <= radiusMeters;

  return {
    within,
    distanceMeters: d,
    accuracy
  };
};

