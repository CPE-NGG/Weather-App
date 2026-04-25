module.exports = async (req, res) => {
    const { city, lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    // Strict check to ensure Vercel sees your environment variable
    if (!apiKey) {
        return res.status(500).json({ message: "Vercel cannot find the OPENWEATHER_API_KEY environment variable." });
    }

    let url = "";
    if (city) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    } else if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    } else {
        return res.status(400).json({ message: "Please provide a city or coordinates." });
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Return exactly what OpenWeatherMap returns
        return res.status(response.ok ? 200 : response.status).json(data);
    } catch (error) {
        return res.status(500).json({ message: "Internal server crash when fetching data." });
    }
};