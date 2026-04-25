# ***AetherWeather Dashboard*** 🌤️

---

### ***Overview***
***AetherWeather*** is a high-fidelity, interactive weather dashboard that merges ***real-time data*** with a dynamic ***3D environment***. Built using ***Three.js*** and ***Tailwind CSS***, it provides an aesthetic where the UI itself reacts to the atmospheric conditions of the searched location.

---

## ***✨ Key Features***

---

### ***1. Reactive 3D Environment***
* ***Weather States***: Custom visualizations for ***Clear***, ***Clouds***, ***Rain***, ***Snow***, ***Thunderstorm***, and ***Mist/Fog***.
* ***Day/Night Cycle***: The ***skybox***, ***lighting***, and ***ground colors*** transition based on the ***local time*** of the selected city.
* ***Dynamic Clouds***: Multi-layered, ***high-contrast*** cloud sprites that react to ***wind speed***.
* ***Fauna & Flora***: Procedural ***birds*** with animated wing-flaps and ***3D trees*** that populate the terrain.

---

### ***2. Atmospheric UI Dynamics***
* ***Visibility Blur***: A unique feature where ***low visibility*** (mist/fog) in the target city triggers a physical ***CSS blur effect*** on the ***UI layer***, simulating real-world atmospheric interference.
* ***Cinema Mode***: A ***"UI-Hide"*** toggle that focuses entirely on the ***3D weather simulation***.
* ***Terminal Feed***: A live ***scrolling log*** that displays system pings, ***API status***, and ***geographic coordinates***.

---

## ***🛠️ Technical Stack***

---

* ***Engine***: [***Three.js***](https://threejs.org/) (WebGL Rendering)
* ***Styling***: [***Tailwind CSS***](https://tailwindcss.com/)
* ***Icons***: [***Phosphor Icons***](https://phosphoricons.com/)
* ***Typography***: ***Space Mono*** (Google Fonts)
* ***Data Source***: ***Weather API*** (Real-time Meteorological Data)

---

## ***🚀 Core Logic***

---

### ***Atmospheric Physics***
The ***`WeatherEnvironment`*** class manages the ***WebGL scene***. It utilizes ***`FogExp2`*** for depth and ***`SpriteMaterial`*** for volumetric-style clouds. ***Precipitation*** is handled via a ***`Points`*** buffer geometry for ***high-performance*** particle rendering.

---

### ***Smart UI Layer***
* ***Visibility Logic***: If the API returns visibility ***below 5km***, the dashboard applies a ***dynamic blur*** via the ***`--ui-blur`*** CSS variable.
* ***Time Synchronization***: The system calculates the ***local city time*** via ***`timezoneOffset`*** to determine if the 3D scene should be in ***Day*** or ***Night*** mode.

---

## ***📂 Modular Project Structure***

---

* ***`index.html`***: The core skeleton and UI layout.
* ***`style.css`***: Custom animations, glassmorphism, and ***visibility blur*** logic.
* ***`script.js`***: Handles the ***API lifecycle*** and UI state updates.

---

## ***📝 License***
This project is ***open-source*** and provided for ***creative experimentation***.