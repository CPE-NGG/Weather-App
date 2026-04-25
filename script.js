const state = {
    weatherMain: 'Clear',
    windSpeed: 0,
    timezoneOffset: 0, 
    mouse: new THREE.Vector2(0, 0),
    targetSkyColor: new THREE.Color(0x5ca0d3),
    targetGroundColor: new THREE.Color(0x2e4a22),
    targetFogDensity: 0.005,
    targetAmbient: 0.7,
    cinemaMode: false,
    isNight: false
};

const DOM = {
    searchForm: document.getElementById('search-form'),
    cityInput: document.getElementById('city-input'),
    errorMsg: document.getElementById('error-msg'),
    errorText: document.getElementById('error-text'),
    weatherCard: document.getElementById('weather-card'),
    uiCity: document.getElementById('ui-city'),
    uiLocationFull: document.getElementById('ui-location-full'),
    uiTemp: document.getElementById('ui-temp'),
    uiFeels: document.getElementById('ui-feels'),
    uiPressure: document.getElementById('ui-pressure'),
    uiDesc: document.getElementById('ui-desc'),
    uiWind: document.getElementById('ui-wind'),
    uiHumidity: document.getElementById('ui-humidity'),
    uiVisibility: document.getElementById('ui-visibility'),
    uiIcon: document.getElementById('ui-icon'),
    uiClock: document.getElementById('ui-clock'),
    uiCoords: document.getElementById('ui-coords'),
    terminalLog: document.getElementById('terminal-log'),
    cinemaBtn: document.getElementById('toggle-cinema'),
    uiDayProgress: document.getElementById('ui-day-progress'),
    uiPrecipRisk: document.getElementById('ui-precip-risk'),
    uiUV: document.getElementById('ui-uv'),
    uiWindCompass: document.getElementById('ui-wind-compass'),
    uiWindDir: document.getElementById('ui-wind-dir')
};

// For full country name conversion
const regionNames = new Intl.DisplayNames(['en'], {type: 'region'});

function logToTerminal(msg, type = 'info') {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const p = document.createElement('p');
    p.className = type === 'alert' ? 'text-orange-400' : 'text-white/60';
    p.innerHTML = `<span class="text-white/20">[${time}]</span> ${msg}`;
    DOM.terminalLog.prepend(p);
    if (DOM.terminalLog.children.length > 30) DOM.terminalLog.lastChild.remove();
}

function updateClock() {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cityTime = new Date(utcTime + (state.timezoneOffset * 1000));
    DOM.uiClock.textContent = cityTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const hour = cityTime.getHours();
    const wasNight = state.isNight;
    state.isNight = (hour < 6 || hour >= 18);
    
    if (wasNight !== state.isNight) {
        if (environmentSystem) environmentSystem.setMode(state.weatherMain, state.windSpeed);
    }
    requestAnimationFrame(updateClock);
}

DOM.cinemaBtn.addEventListener('click', () => {
    state.cinemaMode = !state.cinemaMode;
    
    // Select all elements marked as 'interactive'
    const targets = document.querySelectorAll('.interactive');
    
    targets.forEach(el => {
        if (state.cinemaMode) {
            el.classList.add('ui-hidden');
        } else {
            el.classList.remove('ui-hidden');
        }
    });

    logToTerminal(state.cinemaMode ? "[SYS] Entering Cinema Mode." : "[SYS] UI Restored.");
});

// ==========================================
// 3D ENVIRONMENT
// ==========================================
let scene, camera, renderer, environmentSystem;
let clock = new THREE.Clock();

function initThreeJS() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x5ca0d3);
    scene.fog = new THREE.FogExp2(0x5ca0d3, 0.005);
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 60);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    environmentSystem = new WeatherEnvironment(scene);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    animateLoop();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    state.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

class WeatherEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.cloudSprites = [];
        this.birds = [];
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
        this.scene.add(this.ambientLight);
        this.dirLight = new THREE.DirectionalLight(0xfff5b6, 1.2);
        this.dirLight.position.set(80, 100, 50);
        this.dirLight.castShadow = true;
        // High res shadows for the tiny flowers
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.far = 400;
        this.dirLight.shadow.camera.left = -150;
        this.dirLight.shadow.camera.right = 150;
        this.dirLight.shadow.camera.top = 150;
        this.dirLight.shadow.camera.bottom = -150;
        this.scene.add(this.dirLight);
        
        this.createGround();
        this.createNature();
        this.createClouds();
        this.createPrecipitation();
        this.createBirds();
        this.setMode('Clear', 0);
    }

    createGround() {
        const geometry = new THREE.PlaneGeometry(400, 400, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0x2e4a22, roughness: 0.9 });
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -5;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    createNature() {
        // Better Trees: Stacked cones for a lush look
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4d2926 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });

        for (let i = 0; i < 40; i++) {
            const treeGroup = new THREE.Group();
            const tx = (Math.random() - 0.5) * 240;
            const tz = (Math.random() - 0.5) * 240;
            
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 5, 6), trunkMat);
            trunk.position.y = 2.5;
            trunk.castShadow = true;
            treeGroup.add(trunk);

            // Three layers of leaves
            for(let j=0; j<3; j++) {
                const cone = new THREE.Mesh(new THREE.ConeGeometry(4 - j, 6, 6), leafMat);
                cone.position.y = 7 + (j * 3);
                cone.castShadow = true;
                treeGroup.add(cone);
            }

            treeGroup.position.set(tx, -5, tz);
            treeGroup.scale.setScalar(0.8 + Math.random() * 0.4);
            this.scene.add(treeGroup);
        }

        // Flowers with Shadows
        const colors = [0xff66bb, 0xffff66, 0x66ffff, 0xffffff, 0xffa500];
        const flowerGeo = new THREE.SphereGeometry(0.4, 4, 4);
        const stemGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 4);
        
        for (let i = 0; i < 180; i++) {
            const flowerGroup = new THREE.Group();
            const fx = (Math.random() - 0.5) * 260;
            const fz = (Math.random() - 0.5) * 260;
            
            const stem = new THREE.Mesh(stemGeo, leafMat);
            stem.position.y = 0.5;
            stem.castShadow = true;
            flowerGroup.add(stem);

            const bloom = new THREE.Mesh(flowerGeo, new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random()*colors.length)] }));
            bloom.position.y = 1;
            bloom.castShadow = true;
            flowerGroup.add(bloom);

            flowerGroup.position.set(fx, -5, fz);
            this.scene.add(flowerGroup);
        }
    }

    createBirds() {
        // Better Birds: Body + Wings
        for(let i=0; i<10; i++) {
            const birdGroup = new THREE.Group();
            
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x000000 }));
            birdGroup.add(body);

            const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 1.8), new THREE.MeshStandardMaterial({ color: 0x000000 }));
            wingL.position.x = 0;
            wingL.name = "wingL";
            birdGroup.add(wingL);

            const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 1.8), new THREE.MeshStandardMaterial({ color: 0x000000 }));
            wingR.position.x = 0;
            wingR.name = "wingR";
            birdGroup.add(wingR);

            birdGroup.position.set((Math.random()-0.5)*150, 20 + Math.random()*25, (Math.random()-0.5)*150);
            birdGroup.userData.speed = 0.4 + Math.random() * 0.6;
            birdGroup.userData.radius = 40 + Math.random() * 60;
            birdGroup.userData.angle = Math.random() * Math.PI * 2;
            birdGroup.userData.verticalOffset = Math.random() * 100;
            
            this.birds.push(birdGroup);
            this.scene.add(birdGroup);
        }
    }

    createClouds() {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(256, 256, 256, 0, Math.PI*2); ctx.fill();
        
        const cloudTexture = new THREE.CanvasTexture(canvas);
        const cloudMaterial = new THREE.SpriteMaterial({ map: cloudTexture, transparent: true, opacity: 0.4, depthWrite: false });

        for(let i = 0; i < 35; i++) {
            const sprite = new THREE.Sprite(cloudMaterial.clone());
            sprite.position.set((Math.random() - 0.5) * 300, 40 + Math.random() * 15, (Math.random() - 0.5) * 200);
            const scale = 60 + Math.random() * 100;
            sprite.scale.set(scale, scale * 0.35, 1);
            this.cloudSprites.push(sprite);
            this.scene.add(sprite);
        }
    }

    createPrecipitation() {
        this.particleCount = 3500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = Math.random() * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.precipMaterial = new THREE.PointsMaterial({ size: 0.4, color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false });
        this.precipitationPoints = new THREE.Points(geometry, this.precipMaterial);
        this.scene.add(this.precipitationPoints);
    }

    setMode(weatherMain, windSpeed) {
        let cloudColor = 0xffffff, cloudOpacity = 0.4, rainOpacity = 0.0, rainSpeed = 0;
        let skyColor = 0x5ca0d3, groundColor = 0x2e4a22, ambientVal = 0.35, dirInt = 1.2;

        if (state.isNight) {
            skyColor = 0x05081a; groundColor = 0x0a140a; ambientVal = 0.15; dirInt = 0.2;
        }

        if (['Rain', 'Drizzle'].includes(weatherMain)) {
            skyColor = state.isNight ? 0x02040d : 0x2a3544; groundColor = 0x151b22;
            ambientVal = 0.3; dirInt = 0.1; cloudColor = 0x4a5568; rainOpacity = 0.5; rainSpeed = 40;
        } else if (weatherMain === 'Thunderstorm') {
            skyColor = 0x050508; groundColor = 0x050508;
            ambientVal = 0.2; dirInt = 0.0; cloudColor = 0x111115; rainOpacity = 0.7; rainSpeed = 50;
        } else if (weatherMain === 'Snow') {
            skyColor = 0x8899aa; groundColor = 0xccd6e0;
            ambientVal = 0.5; dirInt = 0.2; cloudColor = 0xffffff; rainOpacity = 0.6; rainSpeed = 5;
        } else if (weatherMain === 'Clouds') {
            skyColor = state.isNight ? 0x080c14 : 0x5c6b7a; groundColor = 0x223026;
            ambientVal = 0.4; dirInt = 0.3; cloudColor = 0xaaaaaa;
        }

        state.targetSkyColor.setHex(skyColor);
        state.targetGroundColor.setHex(groundColor);
        state.targetAmbient = ambientVal;
        this.dirLight.intensity = dirInt;
        this.precipMaterial.opacity = rainOpacity;
        this.currentRainSpeed = rainSpeed;
        this.cloudSprites.forEach(s => { s.material.color.setHex(cloudColor); s.material.opacity = cloudOpacity; });
        
        const showBirds = !['Rain', 'Thunderstorm', 'Snow'].includes(weatherMain) && !state.isNight;
        this.birds.forEach(b => b.visible = showBirds);
    }

    update(dt, time, windSpeed, weatherMain) {
        const windEffect = windSpeed * 0.1;
        this.cloudSprites.forEach(s => {
            s.position.x += (windEffect + 2) * dt;
            if (s.position.x > 180) s.position.x = -180;
        });

        this.birds.forEach(b => {
            b.userData.angle += dt * b.userData.speed;
            const r = b.userData.radius;
            b.position.x = Math.cos(b.userData.angle) * r;
            b.position.z = Math.sin(b.userData.angle) * r;
            b.position.y += Math.sin(time + b.userData.verticalOffset) * 0.02;
            b.rotation.y = -b.userData.angle + Math.PI/2;
            
            // Animate Wings
            const wingL = b.getObjectByName("wingL");
            const wingR = b.getObjectByName("wingR");
            if(wingL && wingR) {
                const flap = Math.sin(time * 15) * 0.8;
                wingL.rotation.x = flap;
                wingR.rotation.x = -flap;
            }
        });

        if (this.precipMaterial.opacity > 0) {
            const pos = this.precipitationPoints.geometry.attributes.position.array;
            for (let i = 0; i < this.particleCount; i++) {
                pos[i * 3 + 1] -= this.currentRainSpeed * dt;
                if (pos[i * 3 + 1] < -5) pos[i * 3 + 1] = 80;
            }
            this.precipitationPoints.geometry.attributes.position.needsUpdate = true;
        }
    }
}

function animateLoop() {
    requestAnimationFrame(animateLoop);
    const dt = Math.min(clock.getDelta(), 0.1), time = clock.getElapsedTime();
    
    camera.position.x += (state.mouse.x * 8 - camera.position.x) * 0.05;
    camera.position.y += (-state.mouse.y * 4 + 12 - camera.position.y) * 0.05;
    camera.lookAt(0, 10, 0);

    scene.background.lerp(state.targetSkyColor, 0.02);
    scene.fog.color.copy(scene.background);
    if (environmentSystem) {
        environmentSystem.ambientLight.intensity += (state.targetAmbient - environmentSystem.ambientLight.intensity) * 0.05;
        environmentSystem.ground.material.color.lerp(state.targetGroundColor, 0.02);
        environmentSystem.update(dt, time, state.windSpeed, state.weatherMain);
    }
    
    renderer.render(scene, camera);
}

// ==========================================
// API & UI LOGIC
// ==========================================

async function fetchWeather(queryUrl) {
    logToTerminal(`[SCAN] Requesting data...`);
    try {
        DOM.errorMsg.classList.add('hidden');
        const response = await fetch(queryUrl);
        if (!response.ok) throw new Error('Location not found.');
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        logToTerminal(`[ERR] ${error.message}`, 'alert');
        DOM.errorMsg.classList.remove('hidden');
        DOM.errorText.textContent = `ERR: ${error.message.toUpperCase()}`;
    }
}

window.searchCity = function(city) {
    DOM.cityInput.value = city;
    fetchWeather(`/api/weather?city=${encodeURIComponent(city)}`);
};

function updateDashboard(data) {
    state.weatherMain = data.weather[0].main;
    state.windSpeed = data.wind.speed;
    state.timezoneOffset = data.timezone;

    // Get Full Country Name
    let fullCountry = data.sys.country;
    try {
        fullCountry = regionNames.of(data.sys.country);
    } catch(e) {}

    logToTerminal(`[DATA] Found: ${data.name}, ${fullCountry}`);

    const iconMap = { 'Clear': 'ph-sun', 'Clouds': 'ph-cloud', 'Rain': 'ph-cloud-rain', 'Thunderstorm': 'ph-cloud-lightning', 'Snow': 'ph-snowflake', 'Mist': 'ph-cloud-fog' };
    const iconClass = iconMap[state.weatherMain] || 'ph-cloud';

    let themeClass = 'theme-clear'; 
    if (['Rain', 'Drizzle'].includes(state.weatherMain)) themeClass = 'theme-rain';
    else if (state.weatherMain === 'Thunderstorm') themeClass = 'theme-thunder';
    else if (state.weatherMain === 'Snow') themeClass = 'theme-snow';
    else if (state.weatherMain === 'Clouds') themeClass = 'theme-clouds';
    else if (['Mist', 'Fog', 'Haze', 'Dust', 'Smoke'].includes(state.weatherMain)) themeClass = 'theme-autumn';
    
    document.body.className = themeClass;
    
    DOM.uiCity.textContent = data.name.toUpperCase();
    DOM.uiLocationFull.textContent = `${data.name}, ${fullCountry}`;
    DOM.uiTemp.textContent = Math.round(data.main.temp);
    DOM.uiFeels.textContent = `${Math.round(data.main.feels_like)}°`;
    DOM.uiPressure.textContent = `${data.main.pressure} hPa`;
    DOM.uiHumidity.textContent = `${data.main.humidity}%`;
    DOM.uiVisibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    DOM.uiDesc.textContent = data.weather[0].description;
    DOM.uiWind.textContent = `${data.wind.speed.toFixed(1)} m/s`;
    DOM.uiCoords.textContent = `LOC: ${data.coord.lat.toFixed(3)}, ${data.coord.lon.toFixed(3)}`;
    DOM.uiIcon.innerHTML = `<i class="ph ${iconClass}"></i>`;

    const precipRisk = Math.min(100, Math.round((data.clouds.all * 0.7) + (data.main.humidity * 0.3)));
    DOM.uiPrecipRisk.textContent = `${precipRisk}%`;
    
    const hr = new Date().getHours();
    const baseUV = (hr > 10 && hr < 16) ? 7 : 2;
    const uv = Math.max(1, Math.round(baseUV * (state.weatherMain === 'Clear' ? 1.2 : 0.4)));
    DOM.uiUV.textContent = uv;

    const deg = data.wind.deg || 0;
    DOM.uiWindCompass.style.transform = `rotate(${deg}deg)`;
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    DOM.uiWindDir.textContent = dirs[Math.round(deg / 45) % 8];

    const now = Date.now() / 1000;
    const dayProgress = Math.max(0, Math.min(100, ((now - data.sys.sunrise) / (data.sys.sunset - data.sys.sunrise)) * 100));
    DOM.uiDayProgress.style.width = `${dayProgress}%`;

    DOM.weatherCard.classList.remove('opacity-0', 'scale-95');
    DOM.weatherCard.classList.add('opacity-100', 'scale-100');
    if(environmentSystem) environmentSystem.setMode(state.weatherMain, state.windSpeed);
}

DOM.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = DOM.cityInput.value.trim();
    if (city) searchCity(city);
});

function initApp() {
    if (!scene) initThreeJS();
    updateClock();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeather(`/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
            () => searchCity('London')
        );
    } else searchCity('London');
}

initApp();