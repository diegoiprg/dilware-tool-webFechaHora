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
        debugButton: document.getElementById('debug-button'),
        darkModeButton: document.getElementById('dark-mode-button'),
        fullscreenButton: document.getElementById('fullscreen-button'),
        infoBanner: document.getElementById('info-banner'),
        infoBannerText: document.getElementById('info-banner-text'),
        infoBannerClose: document.getElementById('info-banner-close'),
    },

    icons: {
        sun: 'svg/sun.svg',
        moon: 'svg/moon.svg',
        bug: 'svg/debug.svg', // Changed to debug.svg
        fullscreen: 'svg/fullscreen.svg',
        fullscreenExit: 'svg/fullscreen-exit.svg'
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
                    var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                    msg.textContent = `[${timestamp}] ERROR al cargar SVG ${url}: ${e.message}`;
                    msg.style.color = 'white';
                    msg.style.fontWeight = 'bold';
                    App.elements.debugLog.appendChild(msg);
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
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                msg.textContent = `[${timestamp}] GA4 Event: ${eventName} - ${JSON.stringify(eventParams)}`;
                App.elements.debugLog.appendChild(msg);
            }
        } else if (App.elements.debugLog) {
            var msg = document.createElement('p');
            var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
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
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                msg.textContent = `[${timestamp}] GA4 Screen View: ${title} (${path})`;
                App.elements.debugLog.appendChild(msg);
            }
        } else if (App.elements.debugLog) {
            var msg = document.createElement('p');
            var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
            msg.textContent = `[${timestamp}] GA4 Screen View Not Sent (gtag not available): ${title} (${path})`;
            msg.style.color = 'orange';
            App.elements.debugLog.appendChild(msg);
        }
    },

    clock: {
        start: function() {
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                msg.textContent = `[${timestamp}] App.clock.start() iniciado.`;
                App.elements.debugLog.appendChild(msg);
            }
            try {
                this.update();
                setInterval(this.update, 1000);
            } catch (e) {
                if (App.elements.debugLog) {
                    var msg = document.createElement('p');
                    var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                    msg.textContent = `[${timestamp}] ERROR CRÍTICO en App.clock.start(): ${e.message || e.toString()}`;
                    msg.style.color = 'red';
                    App.elements.debugLog.appendChild(msg);
                }
            }
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
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
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
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
                // Asegurar que siempre haya 6 filas (42 celdas) para mantener la altura constante
                var totalCellsRendered = firstDayOfMonth + daysInMonth;
                var remainingCells = 42 - totalCellsRendered; // Máximo 6 semanas * 7 días
                for (var i = 0; i < remainingCells; i++) {
                    this.createCell('', null, App.elements.calendarGrid);
                }
                // Forzar reflow para que la animación se ejecute
                void App.elements.calendarGrid.offsetWidth;
                App.elements.calendarGrid.classList.add('fade-in');
            } catch (e) {
                if (App.elements.debugLog) {
                    var msg = document.createElement('p');
                    var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                    msg.textContent = `[${timestamp}] ERROR CRÍTICO en App.calendar.render(): ${e.message || e.toString()}`;
                    msg.style.color = 'red';
                    App.elements.debugLog.appendChild(msg);
                }
            }
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
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
        isPrimerNeeded: function() {
            // Check if we've asked for permission before.
            // This is a simple check; a more robust solution might use localStorage.
            return !('geolocation' in navigator && 'permissions' in navigator);
        },
        applyInitialTheme: function() {
            var isDarkModeOn = localStorage.getItem('darkModeOn');
            if (isDarkModeOn === null) { // If no saved state, use system preference
                isDarkModeOn = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            } else {
                isDarkModeOn = (isDarkModeOn === 'true');
            }
            this.set(isDarkModeOn); // Apply initial theme to body
            return isDarkModeOn; // Return the initial state
        },
        init: function() {
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                msg.textContent = `[${timestamp}] App.theme.init() iniciado.`;
                App.elements.debugLog.appendChild(msg);
            }

            const startGeo = () => {
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        // ... (el resto de la lógica de éxito)
                        App.trackEvent('geolocation_permission', { permission_status: 'granted' });
                        var geo = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
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
                            App.theme.onError(error, 'solares', url);
                            App.theme.setFallback(true); // Fallback por fallo de API
                        });
                    }, function(error) {
                        // ... (el resto de la lógica de error)
                        var errorMessage;
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = 'Permiso de ubicación denegado.';
                                break;
                            // ... otros casos
                        }
                        App.trackEvent('geolocation_permission', { permission_status: 'denied', error_message: errorMessage });
                        App.theme.onError(new Error(errorMessage), 'geolocation', 'navigator.geolocation');
                        App.theme.setFallback(true); // Fallback por permiso denegado
                    });
                } else {
                    App.theme.setFallback(true); // Fallback por no soportar geolocalización
                }
            };

            // Geolocation Primer
            if (localStorage.getItem('geoPrimerShown') !== 'true') {
                 App.showInfoBanner(
                    'Para el cambio automático de tema (día/noche) según tu ubicación, necesitamos acceso a la geolocalización. Se usará un horario fijo en caso contrario.',
                    () => {
                        localStorage.setItem('geoPrimerShown', 'true');
                        startGeo();
                    }
                );
            } else {
                startGeo();
            }
        },
        update: function() {
            if (App.state.sunriseMinutes === null || App.state.sunsetMinutes === null) {
                App.elements.sunInfo.style.opacity = 0; // Oculta si no hay datos.
                return;
            }
            var now = new Date();
            var nowMinutes = now.getHours() * 60 + now.getMinutes();
            var isNight = nowMinutes < App.state.sunriseMinutes || nowMinutes > App.state.sunsetMinutes;
            this.set(isNight);
            var targetMinutes = isNight ? App.state.sunriseMinutes : App.state.sunsetMinutes;
            var iconUrl = isNight ? App.icons.sun : App.icons.moon;
            var hours = String(Math.floor(targetMinutes / 60)).padStart(2, '0');
            var minutes = String(targetMinutes % 60).padStart(2, '0');

            // Limpia el contenido previo.
            App.elements.sunInfo.innerHTML = '';

            // Crea un contenedor para el ícono SVG.
            var iconContainer = document.createElement('span');
            iconContainer.className = 'sun-moon-icon';
            App.elements.sunInfo.appendChild(iconContainer);

            // Carga el ícono SVG en el contenedor.
            App.loadSvgIcon(iconUrl, iconContainer);
            
            // Agrega el texto de la hora.
            var timeSpan = document.createElement('span');
            timeSpan.textContent = hours + ':' + minutes;
            App.elements.sunInfo.appendChild(timeSpan);
            
            App.elements.sunInfo.style.opacity = 1;
        },
        set: function(isDark) {
            if (isDark) App.elements.body.classList.add('dark-mode');
            else App.elements.body.classList.remove('dark-mode');
            localStorage.setItem('darkModeOn', isDark); // Guarda el estado.
        },
        setFallback: function(showBanner = false) {
            if (showBanner && localStorage.getItem('fallbackBannerShown') !== 'true') {
                App.showInfoBanner(
                    'No se pudo obtener la información solar. Se usará un horario fijo (7am/7pm) para el modo oscuro/claro.',
                    () => {
                        localStorage.setItem('fallbackBannerShown', 'true');
                    }
                );
            }
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                msg.textContent = `[${timestamp}] App.theme.setFallback() iniciado. No hay datos solares, usando horarios fijos (7am/7pm).`;
                App.elements.debugLog.appendChild(msg);
            }
            // Horarios fijos: amanecer a las 7:00, atardecer a las 19:00.
            App.state.sunriseMinutes = 7 * 60;
            App.state.sunsetMinutes = 19 * 60;
            App.theme.update();
            setInterval(function() { App.theme.update(); }, 60000);
        },
        onError: function(error, step, url) {
            console.error("Fallo en el paso '" + step + "' (" + url + "):", error);

            if (App.elements.debugLog) {
                // Loguea el error técnico.
                var debugMessage = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                debugMessage.textContent = `[${timestamp}] ERROR en '${step}' (${url}): ${error.message || error.toString()}`;
                debugMessage.style.color = 'white';
                debugMessage.style.fontWeight = 'bold';
                App.elements.debugLog.appendChild(debugMessage);

                // Limita el log de depuración para evitar sobrecargar la UI.
                while (App.elements.debugLog.children.length > 10) {
                    App.elements.debugLog.removeChild(App.elements.debugLog.firstChild);
                }
            }

            // Asegura que sunInfo esté oculto si hay un error.
            App.elements.sunInfo.style.opacity = 0;
            App.elements.sunInfo.innerHTML = ''; // Limpia cualquier mensaje de error previo.
        }
    },

    fullscreen: {
        init: function() {
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                msg.textContent = `[${timestamp}] App.fullscreen.init() iniciado.`;
                App.elements.debugLog.appendChild(msg);
            }
            try {
                if (App.elements.fullscreenButton) {
                    document.addEventListener('fullscreenchange', App.fullscreen.updateButtonIcon);
                    document.addEventListener('webkitfullscreenchange', App.fullscreen.updateButtonIcon);
                    App.elements.fullscreenButton.addEventListener('click', App.fullscreen.toggle);
                    App.fullscreen.updateButtonIcon(); // Set initial icon
                }
            } catch (e) {
                // ... (manejo de errores)
            }
        },
        toggle: function() {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                App.fullscreen.exitFullscreen();
            } else {
                App.fullscreen.enterFullscreen();
            }
        },
        enterFullscreen: function() {
            var el = document.documentElement;
            if (el.requestFullscreen) el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        },
        exitFullscreen: function() {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        },
        updateButtonIcon: function() {
            if (App.elements.fullscreenButton) {
                var isCurrentlyFullscreen = (document.fullscreenElement || document.webkitFullscreenElement) !== null;
                var iconUrl = isCurrentlyFullscreen ? App.icons.fullscreenExit : App.icons.fullscreen;
                App.loadSvgIcon(iconUrl, App.elements.fullscreenButton);
            }
        }
    },

    antiBurnIn: {
        lastShiftX: 0,
        lastShiftY: 0,
        init: function() {
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
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
                    var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                    msg.textContent = `[${timestamp}] ERROR CRÍTICO en App.antiBurnIn.init(): ${e.message || e.toString()}`;
                    msg.style.color = 'white';
                    msg.fontWeight = 'bold';
                    App.elements.debugLog.appendChild(msg);
                }
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
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                msg.textContent = `[${timestamp}] Anti-burn-in shift: X=${newShiftX.toFixed(2)}px, Y=${newShiftY.toFixed(2)}px`;
                App.elements.debugLog.appendChild(msg);
            }
        }
    },
    
    showInfoBanner: function(text, onAccept) {
        const { infoBanner, infoBannerText, infoBannerClose } = App.elements;
        infoBannerText.textContent = text;
        infoBanner.style.display = 'flex';

        function closeHandler() {
            infoBanner.style.display = 'none';
            if (onAccept) {
                onAccept();
            }
            infoBannerClose.removeEventListener('click', closeHandler);
        }
        infoBannerClose.addEventListener('click', closeHandler);
    },

    init: function() {
        if (App.elements.debugLog) {
            // Ensure debug log is hidden by default, before any other logic or messages
            App.elements.debugLog.style.display = 'none'; // Added this line
            var msg = document.createElement('p');
            var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
            msg.textContent = `[${timestamp}] App.init() iniciado.`;
            App.elements.debugLog.appendChild(msg);
        }
        try {
            this.clock.start();
            this.calendar.render();
                        this.calendar.scheduleDailyUpdate();
            
                        var initialDarkModeState = App.theme.applyInitialTheme(); // Apply initial theme and get state
                        if (App.elements.darkModeButton) {
                            App.loadSvgIcon(initialDarkModeState ? App.icons.moon : App.icons.sun, App.elements.darkModeButton);
            
                            App.elements.darkModeButton.addEventListener('click', () => {
                                var isDarkModeOn = App.elements.body.classList.contains('dark-mode');
                                isDarkModeOn = !isDarkModeOn; // Flip the state
                                App.theme.set(isDarkModeOn); // Apply new theme (adds/removes 'dark-mode' class)
                                localStorage.setItem('darkModeOn', isDarkModeOn); // Store new state
                                App.trackEvent('option_toggled', {
                                    option_name: 'dark_mode',
                                    option_state: isDarkModeOn ? 'on' : 'off'
                                });
                                // Load icon representing the current theme state
                                App.loadSvgIcon(isDarkModeOn ? App.icons.moon : App.icons.sun, App.elements.darkModeButton);
                            });
                        }

            // Carga el icono de debug
            App.loadSvgIcon(App.icons.bug, App.elements.debugButton);

            // Lógica del botón de debug
            if (App.elements.debugButton) {
                App.elements.debugButton.addEventListener('click', () => {
                    var isDebugOn = App.elements.debugLog.style.display === 'block';
                    isDebugOn = !isDebugOn;
                    App.elements.debugLog.style.display = isDebugOn ? 'block' : 'none';
                    localStorage.setItem('debugLogOn', isDebugOn);
                    App.trackEvent('option_toggled', {
                        option_name: 'debug',
                        option_state: isDebugOn ? 'on' : 'off'
                    });
                });
            }

            // Inicializa la lógica de fullscreen
            App.fullscreen.init();
            
            this.theme.init(); // This now mainly calls APIs and updates sun info


            // Initialize anti-burn-in functionality
            App.antiBurnIn.init();

            // Register Service Worker for offline support
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./service-worker.js')
                        .then(registration => {
                            if (App.elements.debugLog) {
                                var msg = document.createElement('p');
                                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                                msg.textContent = `[${timestamp}] ServiceWorker registrado con éxito. Scope: ${registration.scope}`;
                                App.elements.debugLog.appendChild(msg);
                            }
                        })
                        .catch(error => {
                            if (App.elements.debugLog) {
                                var msg = document.createElement('p');
                                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
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
                    var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                    msg.textContent = `[${timestamp}] ServiceWorkers no soportados por este navegador.`;
                    msg.style.color = 'white'; // Informational, no bold
                    App.elements.debugLog.appendChild(msg);
                }
            }
        } catch (e) {
            if (App.elements.debugLog) {
                var msg = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
                msg.textContent = `[${timestamp}] ERROR CRÍTICO en App.init(): ${e.message || e.toString()}`;
                msg.style.color = 'white';
                msg.style.fontWeight = 'bold';
                App.elements.debugLog.appendChild(msg);
                App.elements.debugLog.style.display = 'block'; // Ensure log is visible for critical errors
            }
        }
        if (App.elements.debugLog) {
            var msg = document.createElement('p');
            var timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
            msg.textContent = `[${timestamp}] App.init() finalizado.`;
            App.elements.debugLog.appendChild(msg);
        }
    }
};

App.init();