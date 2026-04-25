module.exports = async function(req, res) {
    // 1. Get the query parameters sent by our frontend (index.html)
    const { city, lat, lon } = req.query;
    
    // 2. Safely grab the API key from Vercel's private environment variables
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ message: "Server configuration error: API key missing." });
    }

    // 3. Construct the real OpenWeatherMap URL securely on the backend
    let url = "";
    if (city) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    } else if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    } else {
        return res.status(400).json({ message: "Please provide a city or coordinates." });
    }

    // 4. Fetch the data and send it back to our frontend
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        // Send successful data back to the browser
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Failed to communicate with OpenWeatherMap." });
    }
};