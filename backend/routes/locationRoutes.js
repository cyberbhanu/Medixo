const express = require("express");

const router = express.Router();

router.get("/reverse", async (req, res) => {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ error: "Valid latitude and longitude are required." });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: "Coordinates are outside the valid range." });
  }

  try {
    const query = new URLSearchParams({
      format: "jsonv2",
      lat: String(latitude),
      lon: String(longitude),
      zoom: "10",
      addressdetails: "1",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Medixo Healthcare location lookup",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Location service is temporarily unavailable." });
    }

    const data = await response.json();
    const address = data.address || {};
    const city = address.city || address.town || address.village || address.municipality || address.county || "";

    return res.json({
      city,
      state: address.state || "",
      country: address.country || "",
      displayName: data.display_name || "",
    });
  } catch (error) {
    console.error("Reverse geocoding failed:", error.message);
    return res.status(502).json({ error: "Unable to determine the current city." });
  }
});

module.exports = router;
