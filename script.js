//
// Script Final.
// Versión 12: Se reintroducen los mensajes de diagnóstico y se cambian los iconos a SVG.
//
var App = {
    elements: {
        body: document.body,
        dashboard: document.getElementById('dashboard'),
        clock: document.getElementById('clock-time'),
        sunInfo: document.getElementById('sun-info'),
        calendarHeader: document.getElementById('calendar-header'),
        calendarGrid: document.getElementById('calendar-grid'),
        debugLog: document.getElementById('debug-log'),
        debugToggleSwitchInput: document.getElementById('debug-toggle-switch'),
        darkModeToggleSwitchInput: document.getElementById('dark-mode-toggle-switch'),
        fullscreenToggleSwitchInput: document.getElementById('fullscreen-toggle-switch'),
    },

    // Iconos SVG para sol y luna. Ahora se cargan desde archivos externos para optimizar el bundle JS.
    icons: {
        sun: 'svg/sun.svg',
        moon: 'svg/moon.svg'
    },

    // Nueva utilidad para cargar iconos SVG desde archivos externos, manteniendo 'currentColor'.
    loadSvgIcon: function(url, targetElement) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(svgText => {
                targetElement.innerHTML = svgText;
            })
            .catch(e => {
                if (App.elements.debugLog) {
                    var msg = document.createElement('p');
                    var timestamp = new Date().toLocaleTimeString();
                    msg.textContent = `[${timestamp}] ERROR al cargar SVG ${url}: ${e.message}`;
                    msg.style.color = 'white';
                    msg.style.fontWeight = 'bold';
                    App.elements.debugLog.appendChild(msg);
                    App.elements.debugLog.style.display = 'block';
                }
                targetElement.innerHTML = ''; // Clear icon on error
            });
    },

    state: {
        today: new Date(),
        displayedYear: new Date().getFullYear(),
        displayedMonth: new Date().getMonth(),
        sunriseMinutes: null,
        sunsetMinutes: null,
    },

    makeApiRequest: function(url, onSuccess, onErrorCallback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var json = JSON.parse(xhr.responseText);
                        App.trackEvent('api_request_success', { api_url: url });
                        onSuccess(json);
                    } catch (e) {
                        App.trackEvent('api_request_failure', { api_url: url, error_message: e.message });
                        onErrorCallback(e, url);
                    }
                } else {
                    App.trackEvent('api_request_failure', { api_url: url, error_message: 'HTTP Error: ' + xhr.status });
                    onErrorCallback(new Error('Error de red: ' + xhr.status), url);
                }
            }
        };
        xhr.onerror = function() {
            App.trackEvent('api_request_failure', { api_url: url, error_message: 'Network failed' });
            onErrorCallback(new Error('Fallo de red desconocido'), url);
        };
        xhr.send();
    },

    // New utility function for tracking events
    trackEvent: function(eventName, eventParams) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, eventParams);
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] GA4 Event: ${eventName} - ${JSON.stringify(eventParams)}`;
                App.elements.debugLog.appendChild(msg);
            }
        } else if (App.elements.debugLog) {
            var msg = document.createElement('p');
            var timestamp = new Date().toLocaleTimeString();
            msg.textContent = `[${timestamp}] GA4 Event Not Sent (gtag not available): ${eventName} - ${JSON.stringify(eventParams)}`;
            msg.style.color = 'orange';
            App.elements.debugLog.appendChild(msg);
        }
    },

    // New utility function for tracking page views (screen views in GA4)
    trackPageView: function(path, title) {
        if (typeof gtag === 'function') {
            gtag('event', 'screen_view', {
                'screen_name': title,
                'screen_path': path
            });
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] GA4 Screen View: ${title} (${path})`;
                App.elements.debugLog.appendChild(msg);
            }
        } else if (App.elements.debugLog) {
            var msg = document.createElement('p');
            var timestamp = new Date().toLocaleTimeString();
            msg.textContent = `[${timestamp}] GA4 Screen View Not Sent (gtag not available): ${title} (${path})`;
            msg.style.color = 'orange';
            App.elements.debugLog.appendChild(msg);
        }
    },

    clock: {
        start: function() {
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] App.clock.start() iniciado.`;
                App.elements.debugLog.appendChild(msg);
            }
            try {
                this.update();
                setInterval(this.update, 1000);
            } catch (e) {
                if (App.elements.debugLog) {
                    var msg = document.createElement('p');
                    var timestamp = new Date().toLocaleTimeString();
                    msg.textContent = `[${timestamp}] ERROR CRÍTICO en App.clock.start(): ${e.message || e.toString()}`;
                    msg.style.color = 'red';
                    App.elements.debugLog.appendChild(msg);
                    App.elements.debugLog.style.display = 'block'; // Ensure log is visible for critical errors
                }
            }
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] App.clock.start() finalizado.`;
                App.elements.debugLog.appendChild(msg);
            }
        },
        update: function() {
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, '0');
            var minutes = String(now.getMinutes()).padStart(2, '0');
            App.elements.clock.textContent = hours + ':' + minutes;
        },
    },

    calendar: {
        render: function() {
            App.trackPageView('/calendar', 'Calendar View');
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] App.calendar.render() iniciado.`;
                App.elements.debugLog.appendChild(msg);
            }
            try {
                App.elements.calendarHeader.innerHTML = '';
                App.elements.calendarGrid.innerHTML = '';
                App.elements.calendarGrid.classList.remove('fade-in');

                var year = App.state.displayedYear;
                var month = App.state.displayedMonth;
                var dateForHeader = new Date(year, month);
                var monthName = dateForHeader.toLocaleDateString('es-ES', { month: 'long' });
                var headerText = monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + year;
                var prevArrow = this.createEl('div', 'nav-arrow', '‹');
                var headerLabel = this.createEl('span', 'calendar-title', headerText);
                var nextArrow = this.createEl('div', 'nav-arrow', '›');
                prevArrow.addEventListener('click', function(e) { e.stopPropagation(); App.calendar.changeMonth(-1); });
                nextArrow.addEventListener('click', function(e) { e.stopPropagation(); App.calendar.changeMonth(1); });
                headerLabel.addEventListener('click', function(e) { e.stopPropagation(); App.calendar.returnToToday(); });
                App.elements.calendarHeader.appendChild(prevArrow);
                App.elements.calendarHeader.appendChild(headerLabel);
                App.elements.calendarHeader.appendChild(nextArrow);

                var daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                daysOfWeek.forEach(function(day) { App.elements.calendarGrid.appendChild(App.calendar.createCell(day, ['day-name'])); });
                
                var firstDayOfMonth = new Date(year, month, 1).getDay();
                for (var i = 0; i < firstDayOfMonth; i++) { this.createCell('', null, App.elements.calendarGrid); }
                var daysInMonth = new Date(year, month + 1, 0).getDate();
                for (var day = 1; day <= daysInMonth; day++) {
                    var classList = [];
                    var today = App.state.today;
                    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) { classList.push('today'); }
                    this.createCell(day, classList, App.elements.calendarGrid);
                }
                // Forzar reflow para que la animación se ejecute
                void App.elements.calendarGrid.offsetWidth;
                App.elements.calendarGrid.classList.add('fade-in');
            } catch (e) {
                if (App.elements.debugLog) {
                    var msg = document.createElement('p');
                    var timestamp = new Date().toLocaleTimeString();
                    msg.textContent = `[${timestamp}] ERROR CRÍTICO en App.calendar.render(): ${e.message || e.toString()}`;
                    msg.style.color = 'red';
                    App.elements.debugLog.appendChild(msg);
                    App.elements.debugLog.style.display = 'block'; // Ensure log is visible for critical errors
                }
            }
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] App.calendar.render() finalizado.`;
                App.elements.debugLog.appendChild(msg);
            }
        },
        createCell: function(text, classList, parent) {
            var cell = App.calendar.createEl('div', 'calendar-cell');
            if (classList) { classList.forEach(function(c) { cell.classList.add(c); }); }
            var content = App.calendar.createEl('div', 'content', text);
            cell.appendChild(content);
            if (parent) parent.appendChild(cell);
            return cell;
        },
        createEl: function(tag, className, text) {
            var el = document.createElement(tag);
            if (className) el.className = className;
            if (text) el.textContent = text;
            return el;
        },
        changeMonth: function(offset) {
            App.trackEvent('calendar_navigation', {
                navigation_type: 'change_month',
                direction: offset === 1 ? 'forward' : 'backward'
            });
            var d = new Date(App.state.displayedYear, App.state.displayedMonth + offset, 1);
            App.state.displayedYear = d.getFullYear();
            App.state.displayedMonth = d.getMonth();
            this.render();
        },
        returnToToday: function() {
            App.trackEvent('calendar_navigation', {
                navigation_type: 'return_to_today'
            });
            App.state.displayedYear = App.state.today.getFullYear();
            App.state.displayedMonth = App.state.today.getMonth();
            this.render();
        },
        scheduleDailyUpdate: function() {
            var now = new Date();
            var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
            var msUntilTomorrow = tomorrow.getTime() - now.getTime();
            setTimeout(function() {
                App.state.today = new Date();
                App.calendar.returnToToday();
                App.calendar.scheduleDailyUpdate();
            }, msUntilTomorrow);
        },
    },
    
    theme: {
        init: function() {
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] App.theme.init() iniciado.`;
                App.elements.debugLog.appendChild(msg);
            }
            try {
                // Initial loading state for geolocation
                App.elements.sunInfo.innerHTML = 'Obteniendo ubicación...';
                App.elements.sunInfo.style.opacity = 1; // Ensure it's visible

                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                                    App.trackEvent('geolocation_permission', { permission_status: 'granted' });
                                    var geo = {
                                        latitude: position.coords.latitude,
                                        longitude: position.coords.longitude
                                    };
                                    // Update loading state for API call
                                    App.elements.sunInfo.innerHTML = 'Obteniendo datos solares...';
                                    var apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + geo.latitude +
                                                 '&longitude=' + geo.longitude + '&daily=sunrise,sunset&timezone=auto';
                                    App.makeApiRequest(apiUrl, function(sunData) {
                                        function timeStringToMinutes(isoString) {
                                            var timePart = isoString.split('T')[1];
                                            var hours = parseInt(timePart.split(':')[0], 10);
                                            var minutes = parseInt(timePart.split(':')[1], 10);
                                            return (hours * 60) + minutes;
                                        }
                                        App.state.sunriseMinutes = timeStringToMinutes(sunData.daily.sunrise[0]);
                                        App.state.sunsetMinutes = timeStringToMinutes(sunData.daily.sunset[0]);
                                        App.theme.update();
                                        setInterval(function() { App.theme.update(); }, 60000);
                                    }, function(error, url) {
                                        // API request failed, display user-friendly error
                                        App.elements.sunInfo.innerHTML = 'Error al obtener datos solares.';
                                        App.elements.sunInfo.style.opacity = 1;
                                        App.theme.onError(error, 'solares', url);
                                    });
                                                }, function(error) {
                                                    var errorMessage;
                                                    switch (error.code) {
                                                        case error.PERMISSION_DENIED:
                                                            errorMessage = 'Permiso de ubicación denegado. No se puede obtener información solar.';
                                                            break;
                                                        case error.POSITION_UNAVAILABLE:
                                                            errorMessage = 'Información de ubicación no disponible. No se puede obtener información solar.';
                                                            break;
                                                        case error.TIMEOUT:
                                                            errorMessage = 'La solicitud para obtener la ubicación ha caducado. No se puede obtener información solar.';
                                                            break;
                                                        default:
                                                            errorMessage = 'Error desconocido de Geolocation. No se puede obtener información solar.';
                                                            break;
                                                    }
                                                    App.trackEvent('geolocation_permission', { permission_status: 'denied', error_message: errorMessage });
                                                    App.elements.sunInfo.innerHTML = errorMessage;
                                                    App.elements.sunInfo.style.opacity = 1;
                                                    App.theme.onError(new Error(errorMessage), 'geolocation', 'navigator.geolocation');
                                                });
                                            } else {
                                                var errorMessage = 'Geolocalización no soportada por el navegador. No se puede obtener información solar.';
                                                App.trackEvent('geolocation_error', { error_message: errorMessage });
                                                App.elements.sunInfo.innerHTML = errorMessage;
                                                App.elements.sunInfo.style.opacity = 1;
                                                App.theme.onError(new Error(errorMessage), 'geolocation', 'navigator.geolocation');
                                            }
            } catch (e) {
                if (App.elements.debugLog) {
                    var msg = document.createElement('p');
                    var timestamp = new Date().toLocaleTimeString();
                    msg.textContent = `[${timestamp}] ERROR CRÍTICO en App.theme.init(): ${e.message || e.toString()}`;
                    msg.style.color = 'white';
                    msg.style.fontWeight = 'bold';
                    App.elements.debugLog.appendChild(msg);
                    App.elements.debugLog.style.display = 'block'; // Ensure log is visible for critical errors
                }
                App.elements.sunInfo.innerHTML = 'Error de inicialización.';
                App.elements.sunInfo.style.opacity = 1;
            }
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] App.theme.init() finalizado.`;
                App.elements.debugLog.appendChild(msg);
            }
        },
        update: function() {
            if (App.state.sunriseMinutes === null || App.state.sunsetMinutes === null) return;
            var now = new Date();
            var nowMinutes = now.getHours() * 60 + now.getMinutes();
            var isNight = nowMinutes < App.state.sunriseMinutes || nowMinutes > App.state.sunsetMinutes;
            this.set(isNight);
            var targetMinutes = isNight ? App.state.sunriseMinutes : App.state.sunsetMinutes;
            var iconUrl = isNight ? App.icons.sun : App.icons.moon;
            var hours = String(Math.floor(targetMinutes / 60)).padStart(2, '0');
            var minutes = String(targetMinutes % 60).padStart(2, '0');

            // Clear previous content
            App.elements.sunInfo.innerHTML = '';

            // Create a container for the SVG icon
            var iconContainer = document.createElement('span');
            iconContainer.className = 'sun-moon-icon';
            App.elements.sunInfo.appendChild(iconContainer);

            // Load SVG icon into the container
            App.loadSvgIcon(iconUrl, iconContainer);
            
            // Add time text
            var timeSpan = document.createElement('span');
            timeSpan.textContent = hours + ':' + minutes;
            App.elements.sunInfo.appendChild(timeSpan);
            
            App.elements.sunInfo.style.opacity = 1;
        },
        set: function(isDark) {
            if (isDark) App.elements.body.classList.add('dark-mode');
            else App.elements.body.classList.remove('dark-mode');
            localStorage.setItem('darkModeOn', isDark); // Save state
        },
        onError: function(error, step, url) {
            console.error("Fallo en el paso '" + step + "' (" + url + "):", error);

            if (App.elements.debugLog) {
                // Log the technical error
                var debugMessage = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                debugMessage.textContent = `[${timestamp}] ERROR en '${step}' (${url}): ${error.message || error.toString()}`;
                debugMessage.style.color = 'white';
                debugMessage.style.fontWeight = 'bold';
                App.elements.debugLog.appendChild(debugMessage);

                // Limit debug log to prevent UI clutter
                while (App.elements.debugLog.children.length > 10) {
                    App.elements.debugLog.removeChild(App.elements.debugLog.firstChild);
                }
            }

            // Ensure sunInfo is hidden if there's an error and it's not showing actual data
            // (This might be overridden by calling functions if they want to display an error message)
            // App.elements.sunInfo.style.opacity = 0;
        }
    },

    fullscreen: {
        init: function() {
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] App.fullscreen.init() iniciado.`;
                App.elements.debugLog.appendChild(msg);
            }
            try {
                if (App.elements.fullscreenToggleSwitchInput) {
                    // Add fullscreen change listeners once at init
                    document.addEventListener('fullscreenchange', App.fullscreen.updateSwitchState);
                    document.addEventListener('webkitfullscreenchange', App.fullscreen.updateSwitchState);

                    // Load fullscreen state from localStorage
                    var isFullscreenOn = localStorage.getItem('fullscreenOn') === 'true';
                    App.elements.fullscreenToggleSwitchInput.checked = isFullscreenOn;

                    // Set up event listener for the switch
                    App.elements.fullscreenToggleSwitchInput.addEventListener('change', App.fullscreen.handleSwitchChange);
                }
            } catch (e) {
                if (App.elements.debugLog) {
                    var msg = document.createElement('p');
                    var timestamp = new Date().toLocaleTimeString();
                    msg.textContent = `[${timestamp}] ERROR CRÍTICO en App.fullscreen.init(): ${e.message || e.toString()}`;
                    msg.style.color = 'white';
                    msg.style.fontWeight = 'bold';
                    App.elements.debugLog.appendChild(msg);
                    App.elements.debugLog.style.display = 'block'; // Ensure log is visible for critical errors
                }
            }
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] App.fullscreen.init() finalizado.`;
                App.elements.debugLog.appendChild(msg);
            }
        },
        handleSwitchChange: function() {
            var isChecked = App.elements.fullscreenToggleSwitchInput.checked;
            if (isChecked) {
                App.fullscreen.enterFullscreen();
            } else {
                App.fullscreen.exitFullscreen();
            }
        },
        enterFullscreen: function() {
            var el = document.documentElement;
            if (el.requestFullscreen) el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();

            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] Intentando entrar en fullscreen.`;
                App.elements.debugLog.appendChild(msg);
            }
        },
        exitFullscreen: function() {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();

            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] Intentando salir de fullscreen.`;
                App.elements.debugLog.appendChild(msg);
            }
        },
        updateSwitchState: function() {
            if (App.elements.fullscreenToggleSwitchInput) {
                var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
                var isCurrentlyFullscreen = (fsEl !== null);

                // Update switch state only if it differs from current fullscreen state
                if (App.elements.fullscreenToggleSwitchInput.checked !== isCurrentlyFullscreen) {
                    App.elements.fullscreenToggleSwitchInput.checked = isCurrentlyFullscreen;
                }
                localStorage.setItem('fullscreenOn', isCurrentlyFullscreen);
            }
        }
    },

    antiBurnIn: {
        lastShiftX: 0,
        lastShiftY: 0,
        init: function() {
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] App.antiBurnIn.init() iniciado.`;
                App.elements.debugLog.appendChild(msg);
            }
            try {
                // Initial shift
                this.shiftElements();
                // Shift every 5 minutes (300000 ms)
                setInterval(this.shiftElements.bind(this), 300000);
            } catch (e) {
                if (App.elements.debugLog) {
                    var msg = document.createElement('p');
                    var timestamp = new Date().toLocaleTimeString();
                    msg.textContent = `[${timestamp}] ERROR CRÍTICO en App.antiBurnIn.init(): ${e.message || e.toString()}`;
                    msg.style.color = 'white';
                    msg.style.fontWeight = 'bold';
                    App.elements.debugLog.appendChild(msg);
                    App.elements.debugLog.style.display = 'block';
                }
            }
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] App.antiBurnIn.init() finalizado.`;
                App.elements.debugLog.appendChild(msg);
            }
        },
        shiftElements: function() {
            // Define max shift range (e.g., +/- 0.5% of viewport width/height)
            const maxShiftX = window.innerWidth * 0.005;
            const maxShiftY = window.innerHeight * 0.005;

            // Generate new shift values within the range, but different from current
            let newShiftX, newShiftY;
            do {
                newShiftX = (Math.random() * maxShiftX * 2) - maxShiftX; // Between -maxShiftX and +maxShiftX
                newShiftY = (Math.random() * maxShiftY * 2) - maxShiftY; // Between -maxShiftY and +maxShiftY
            } while (Math.abs(newShiftX - this.lastShiftX) < 1 && Math.abs(newShiftY - this.lastShiftY) < 1); // Ensure noticeable change

            this.lastShiftX = newShiftX;
            this.lastShiftY = newShiftY;

            if (App.elements.dashboard) {
                App.elements.dashboard.style.transform = `translate(${newShiftX}px, ${newShiftY}px)`;
                App.elements.dashboard.style.transition = 'transform 2s ease-out'; // Smooth transition
            }

            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] Anti-burn-in shift: X=${newShiftX.toFixed(2)}px, Y=${newShiftY.toFixed(2)}px`;
                App.elements.debugLog.appendChild(msg);
            }
        }
    },

    init: function() {
        if (App.elements.debugLog) {
            // Ensure debug log is hidden by default, before any other logic or messages
            App.elements.debugLog.style.display = 'none';
            var msg = document.createElement('p');
            var timestamp = new Date().toLocaleTimeString();
            msg.textContent = `[${timestamp}] App.init() iniciado.`;
            App.elements.debugLog.appendChild(msg);
        }
        try {
            this.clock.start();
            this.calendar.render();
            this.calendar.scheduleDailyUpdate();

            // Load theme state from localStorage on init, controlled by switch
            var isDarkModeOn = localStorage.getItem('darkModeOn');
            if (isDarkModeOn === null) { // If no saved state, use system preference
                isDarkModeOn = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            } else {
                isDarkModeOn = (isDarkModeOn === 'true');
            }
            App.theme.set(isDarkModeOn);

            if (App.elements.darkModeToggleSwitchInput) {
                App.elements.darkModeToggleSwitchInput.checked = isDarkModeOn; // Set switch state
                App.elements.darkModeToggleSwitchInput.addEventListener('change', function() {
                    var isChecked = App.elements.darkModeToggleSwitchInput.checked;
                    App.theme.set(isChecked);
                    localStorage.setItem('darkModeOn', isChecked); // Save state
                    App.trackEvent('option_toggled', {
                        option_name: 'dark_mode',
                        option_state: isChecked ? 'on' : 'off'
                    });
                });
            }
            
            this.theme.init(); // This now mainly calls APIs and updates sun info, not initial theme

            if (App.elements.debugToggleSwitchInput && App.elements.debugLog) {
                // Load debug log state from localStorage
                var isDebugLogOn = localStorage.getItem('debugLogOn') === 'true';
                App.elements.debugToggleSwitchInput.checked = isDebugLogOn;
                App.elements.debugLog.style.display = isDebugLogOn ? 'block' : 'none';

                App.elements.debugToggleSwitchInput.addEventListener('change', function() {
                    var isChecked = App.elements.debugToggleSwitchInput.checked;
                    localStorage.setItem('debugLogOn', isChecked);
                    App.elements.debugLog.style.display = isChecked ? 'block' : 'none';
                    App.trackEvent('option_toggled', {
                        option_name: 'debug',
                        option_state: isChecked ? 'on' : 'off'
                    });
                });
            }

            if (App.elements.fullscreenToggleSwitchInput) {
                App.fullscreen.init(); // Initialize fullscreen logic
                // Track fullscreen switch changes
                App.elements.fullscreenToggleSwitchInput.addEventListener('change', function() {
                    var isChecked = App.elements.fullscreenToggleSwitchInput.checked;
                    App.trackEvent('option_toggled', {
                        option_name: 'fullscreen',
                        option_state: isChecked ? 'on' : 'off'
                    });
                });
            }

            // Initialize anti-burn-in functionality
            App.antiBurnIn.init();

            // Register Service Worker for offline support
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./service-worker.js')
                        .then(registration => {
                            if (App.elements.debugLog) {
                                var msg = document.createElement('p');
                                var timestamp = new Date().toLocaleTimeString();
                                msg.textContent = `[${timestamp}] ServiceWorker registrado con éxito. Scope: ${registration.scope}`;
                                App.elements.debugLog.appendChild(msg);
                            }
                        })
                        .catch(error => {
                            if (App.elements.debugLog) {
                                var msg = document.createElement('p');
                                var timestamp = new Date().toLocaleTimeString();
                                msg.textContent = `[${timestamp}] Fallo el registro del ServiceWorker: ${error}`;
                                msg.style.color = 'white';
                                msg.style.fontWeight = 'bold';
                                App.elements.debugLog.appendChild(msg);
                                App.elements.debugLog.style.display = 'block';
                            }
                        });
                });
            } else {
                if (App.elements.debugLog) {
                    var msg = document.createElement('p');
                    var timestamp = new Date().toLocaleTimeString();
                    msg.textContent = `[${timestamp}] ServiceWorkers no soportados por este navegador.`;
                    msg.style.color = 'white'; // Informational, no bold
                    App.elements.debugLog.appendChild(msg);
                }
            }
        } catch (e) {
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                msg.textContent = `[${timestamp}] ERROR CRÍTICO en App.init(): ${e.message || e.toString()}`;
                msg.style.color = 'white';
                msg.style.fontWeight = 'bold';
                App.elements.debugLog.appendChild(msg);
                App.elements.debugLog.style.display = 'block'; // Ensure log is visible for critical errors
            }
        }
        if (App.elements.debugLog) {
            var msg = document.createElement('p');
            var timestamp = new Date().toLocaleTimeString();
            msg.textContent = `[${timestamp}] App.init() finalizado.`;
            App.elements.debugLog.appendChild(msg);
        }
    }
};

App.init();