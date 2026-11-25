// SafeSignal Web Application Engine
document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "safesignal_emergency_contacts";

  // Application State
  let contacts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let currentPosition = null;
  let countdownTimer = null;
  let countdownSeconds = 5; // 5-second emergency countdown requirement

  // DOM Elements
  const sosBtn = document.getElementById("sos-btn");
  const countdownCard = document.getElementById("countdown-card");
  const countdownTimerEl = document.getElementById("countdown-timer");
  const cancelSosBtn = document.getElementById("cancel-sos-btn");
  const refreshLocationBtn = document.getElementById("refresh-location-btn");
  const locationDisplay = document.getElementById("location-display");
  const contactsList = document.getElementById("contacts-list");
  const alertBanner = document.getElementById("alert-banner");
  const gpsBadge = document.getElementById("gps-badge");

  // Modal Elements
  const contactModal = document.getElementById("contact-modal");
  const openAddModalBtn = document.getElementById("open-add-modal-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const contactForm = document.getElementById("contact-form");
  const contactIdInput = document.getElementById("contact-id");
  const contactNameInput = document.getElementById("contact-name");
  const contactPhoneInput = document.getElementById("contact-phone");

  init();

  function init() {
    renderContacts();
    registerServiceWorker();
    attachEventListeners();
  }

  function attachEventListeners() {
    sosBtn.addEventListener("click", handleSosButtonClick);
    cancelSosBtn.addEventListener("click", cancelSosCountdown);
    refreshLocationBtn.addEventListener("click", () => fetchLocation(true));
    
    openAddModalBtn.addEventListener("click", () => openModal());
    closeModalBtn.addEventListener("click", closeModal);
    contactForm.addEventListener("submit", handleFormSubmit);
  }

  // --- On-Demand Geolocation Functionality ---
  function fetchLocation(showToast = false, callback = null) {
    if (!navigator.geolocation) {
      const errMsg = "Geolocation API is not supported by this browser.";
      updateGpsBadge("No GPS Support", "error");
      locationDisplay.innerHTML = `<p class="location-placeholder">${errMsg}</p>`;
      if (showToast) showAlert(errMsg, "error");
      if (callback) callback(null);
      return;
    }

    updateGpsBadge("Fetching GPS...", "fetching");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date()
        };

        const mapsUrl = `https://maps.google.com/?q=${currentPosition.lat},${currentPosition.lng}`;
        locationDisplay.innerHTML = `
          <div class="location-details">
            <p><strong>Latitude:</strong> ${currentPosition.lat.toFixed(6)}</p>
            <p><strong>Longitude:</strong> ${currentPosition.lng.toFixed(6)}</p>
            <p><strong>Google Maps Link:</strong> <a href="${mapsUrl}" target="_blank" rel="noopener">${mapsUrl}</a></p>
            <p style="font-size:0.75rem; color:#6E6E73; margin-top:4px;">Updated: ${currentPosition.timestamp.toLocaleTimeString()}</p>
          </div>
        `;

        updateGpsBadge("GPS Fix Acquired", "active");
        if (showToast) showAlert("Location successfully retrieved!", "success");
        if (callback) callback(currentPosition);
      },
      (error) => {
        let errMsg = "Unable to retrieve GPS location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errMsg = "Location permission denied. Please allow location access in browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errMsg = "Location information is unavailable. Check GPS hardware.";
            break;
          case error.TIMEOUT:
            errMsg = "Location request timed out.";
            break;
        }

        updateGpsBadge("GPS Error", "error");
        locationDisplay.innerHTML = `<p class="location-placeholder">${errMsg}</p>`;
        showAlert(errMsg, "error");
        if (callback) callback(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function updateGpsBadge(text, state) {
    gpsBadge.textContent = text;
    gpsBadge.className = `status-badge ${state}`;
  }

  // --- SOS 5-Second Countdown Logic ---
  function handleSosButtonClick() {
    if (contacts.length === 0) {
      showAlert("Please add at least one emergency contact before triggering SOS!", "error");
      openModal();
      return;
    }

    // Request location on demand upon SOS activation
    fetchLocation(false);

    countdownSeconds = 5;
    countdownTimerEl.textContent = countdownSeconds;
    countdownCard.classList.remove("hidden");
    sosBtn.disabled = true;

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    countdownTimer = setInterval(() => {
      countdownSeconds--;
      countdownTimerEl.textContent = countdownSeconds;

      if (countdownSeconds <= 0) {
        clearInterval(countdownTimer);
        countdownCard.classList.add("hidden");
        sosBtn.disabled = false;
        executeSosAlert();
      }
    }, 1000);
  }

  function cancelSosCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownCard.classList.add("hidden");
      sosBtn.disabled = false;
      showAlert("SOS emergency alert canceled.", "info");
    }
  }

  // --- Emergency Alert Dispatch Engine ---
  async function executeSosAlert() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    let locationSegment = "Location unavailable (GPS offline).";
    let mapsUrl = "";

    if (currentPosition) {
      mapsUrl = `https://maps.google.com/?q=${currentPosition.lat},${currentPosition.lng}`;
      locationSegment = `Map: ${mapsUrl} (Lat: ${currentPosition.lat.toFixed(5)}, Lng: ${currentPosition.lng.toFixed(5)})`;
    }

    const sosMessage = `🚨 EMERGENCY SOS ALERT! 🚨
I need urgent help.
Time: ${dateStr} ${timeStr}
${locationSegment}`;

    // Attempt Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: "EMERGENCY SOS ALERT",
          text: sosMessage,
          url: mapsUrl || undefined
        });
        showAlert("Emergency alert successfully shared via Web Share!", "success");
      } catch (err) {
        if (err.name !== "AbortError") {
          fallbackSmsDispatch(sosMessage);
        } else {
          showAlert("Emergency alert dispatch dismissed.", "info");
        }
      }
    } else {
      fallbackSmsDispatch(sosMessage);
    }
  }

  function fallbackSmsDispatch(message) {
    const phoneNumbers = contacts.map(c => c.phone).join(",");
    const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).then(() => {
        showAlert("Opening Messaging App. Message copied to clipboard!", "info");
      }).catch(() => {
        showAlert("Opening Messaging App...", "info");
      });
    } else {
      showAlert("Opening Messaging App...", "info");
    }

    setTimeout(() => {
      window.location.href = smsUrl;
    }, 500);
  }

  // --- LocalStorage Contact Management (CRUD) ---
  function renderContacts() {
    contactsList.innerHTML = "";

    if (contacts.length === 0) {
      contactsList.innerHTML = `<p class="location-placeholder">No emergency contacts saved. Tap "+ Add Contact" to set up your safety network.</p>`;
      return;
    }

    contacts.forEach((contact, index) => {
      const item = document.createElement("div");
      item.className = "contact-item";
      item.innerHTML = `
        <div class="contact-info">
          <h4>${escapeHtml(contact.name)}</h4>
          <p>${escapeHtml(contact.phone)}</p>
        </div>
        <div class="contact-actions">
          <a href="tel:${escapeHtml(contact.phone)}" class="btn-icon btn-call" aria-label="Call ${escapeHtml(contact.name)}">📞 Call</a>
          <button class="btn-icon btn-edit" onclick="editContact(${index})">Edit</button>
          <button class="btn-icon btn-delete" onclick="deleteContact(${index})">Delete</button>
        </div>
      `;
      contactsList.appendChild(item);
    });
  }

  function saveContacts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    renderContacts();
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const name = contactNameInput.value.trim();
    const phone = contactPhoneInput.value.trim();
    const id = contactIdInput.value;

    if (!name || !phone) {
      showAlert("Please enter both a name and a phone number.", "error");
      return;
    }

    if (id !== "") {
      contacts[id] = { name, phone };
      showAlert("Contact updated successfully!", "success");
    } else {
      contacts.push({ name, phone });
      showAlert("New contact added!", "success");
    }

    saveContacts();
    closeModal();
  }

  window.editContact = function(index) {
    const contact = contacts[index];
    openModal(index, contact.name, contact.phone);
  };

  window.deleteContact = function(index) {
    if (confirm(`Remove ${contacts[index].name} from emergency contacts?`)) {
      contacts.splice(index, 1);
      saveContacts();
      showAlert("Contact removed.", "info");
    }
  };

  // --- Modal Helpers ---
  function openModal(id = "", name = "", phone = "") {
    contactIdInput.value = id;
    contactNameInput.value = name;
    contactPhoneInput.value = phone;
    document.getElementById("modal-title").textContent = id !== "" ? "Edit Contact" : "Add Emergency Contact";
    contactModal.classList.remove("hidden");
    contactNameInput.focus();
  }

  function closeModal() {
    contactModal.classList.add("hidden");
    contactForm.reset();
  }

  // --- UI Alert Banner Helper ---
  function showAlert(msg, type = "info") {
    alertBanner.textContent = msg;
    alertBanner.className = `alert-banner ${type}`;
    setTimeout(() => {
      alertBanner.className = "alert-banner hidden";
    }, 4500);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  // --- Service Worker Registration for PWA ---
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js")
        .then(() => console.log("SafeSignal Service Worker registered successfully."))
        .catch((err) => console.warn("Service Worker registration failed:", err));
    }
  }
});
