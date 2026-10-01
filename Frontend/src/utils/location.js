import { reverseGeocode } from "../api";

export const getCurrentCity = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error("Location is not supported by this browser."));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const location = await reverseGeocode({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        if (!location.city) {
          throw new Error("No city was found for the current location.");
        }
        resolve(location);
      } catch (error) {
        reject(error);
      }
    },
    (error) => reject(new Error(
      error.code === error.PERMISSION_DENIED
        ? "Location permission was denied."
        : "Unable to access your current location."
    )),
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
});

export const matchCityOption = (city, options) => {
  const normalizedCity = String(city || "").trim().toLowerCase();
  if (!normalizedCity) return "";

  return options.find((option) => {
    const normalizedOption = String(option || "").trim().toLowerCase();
    return normalizedOption === normalizedCity
      || normalizedOption.includes(normalizedCity)
      || normalizedCity.includes(normalizedOption);
  }) || "";
};
