// Basic interactivity for the Echo app
const form = document.getElementById('briefing');
const note = document.getElementById('formNote');
const cityInput = document.getElementById('city');
const playBtn = document.getElementById('playBtn');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatLog = document.getElementById('chatLog');

// Weather card elements
const weatherCard = document.querySelector('.card.weather');
const tempEl = weatherCard.querySelector('.temp');
const weatherDesc = weatherCard.querySelector('.muted');
const metrics = weatherCard.querySelectorAll('.metrics .v');
// 🎵 Weather → Playlist mapping
const playlists = {
  Clear: "https://open.spotify.com/playlist/37i9dQZF1EIhkGftn1D0Mh?si=657ca0b3fc82458b", // sunny vibes
  Clouds: "https://open.spotify.com/playlist/37i9dQZF1EIUwbIgPllxFl?si=3dfa442cb2c94893", // cloudy chill
  Rain: "https://open.spotify.com/playlist/37i9dQZF1EIh5QTm0PNBlW?si=40ad14ce5e574204",   // rainy day lo-fi
  Storm: "https://open.spotify.com/playlist/37i9dQZF1EIWxBaqV6UQsQ?si=ebacb8f7629d4e85",  // stormy
  Gloomy: "https://open.spotify.com/playlist/37i9dQZF1EIgxHuuVqSn9D?si=5a10f1e3fa0842ff", // gloomy
  Default: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M"               // fallback
};
// fake player state
let playing = false;
function updatePlaylist(condition) {
  const player = document.getElementById('player');
  const url = playlists[condition] || playlists.Default;
  player.innerHTML = `<iframe style="border-radius:12px"
    src="${url}" width="100%" height="152" frameBorder="0"
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    loading="lazy"></iframe>`;
}

// Weather form handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    note.textContent = 'Please enter a city.';
    return;
  }

  note.textContent = 'Fetching weather…';

  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error("Failed to fetch weather");
    const data = await res.json();

    // Update weather card with temp, desc, wind, humidity
    tempEl.textContent = `${Math.round(data.main.temp)}°C`;
    weatherDesc.textContent = data.weather[0].description;
    metrics[1].textContent = `${data.wind.speed} km/h`;
    metrics[2].textContent = `${data.main.humidity}%`;

    const condition = data.weather[0].main; // e.g. "Clear", "Rain", "Clouds"
    updatePlaylist(condition);

    // Fetch AQI separately using lat/lon
    const aqiRes = await fetch(`/api/air?lat=${data.coord.lat}&lon=${data.coord.lon}`);
    if (aqiRes.ok) {
      const aqiData = await aqiRes.json();
      const aqi = aqiData.list[0].main.aqi; // 1–5
      const labels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
      metrics[0].textContent = `${labels[aqi - 1]} (${aqi})`;
    } else {
      metrics[0].textContent = "N/A";
    }

    note.textContent = `Weather updated for ${city}`;
  } catch (err) {
    console.error(err);
    note.textContent = 'Could not fetch weather. Try again.';
  }
  setTimeout(() => note.textContent = '', 4000);
});

// Music play/pause demo
playBtn.addEventListener('click', () => {
  playing = !playing;
  playBtn.classList.toggle('primary', playing);
  playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  playBtn.innerHTML = playing
    ? '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
});

// Chat handler → backend GPT
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  chatInput.value = '';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    addMessage(data.reply, 'ai');
  } catch (err) {
    console.error(err);
    addMessage('Sorry, something went wrong.', 'ai');
  }
});

function addMessage(text, role='user'){
  const el = document.createElement('div');
  el.className = 'msg ' + (role === 'ai' ? 'ai' : '');
  el.textContent = text;
  chatLog.appendChild(el);
  chatLog.scrollTop = chatLog.scrollHeight;
}
