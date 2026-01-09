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
        debugToggleButton: document.getElementById('debug-toggle-button'),
    },

    // Iconos SVG para sol y luna. Son limpios, escalables y heredan el color.
    icons: {
        sun: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
        moon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
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
                        onSuccess(json);
                    } catch (e) { onErrorCallback(e, url); }
                } else { onErrorCallback(new Error('Error de red: ' + xhr.status), url); }
            }
        };
        xhr.onerror = function() { onErrorCallback(new Error('Fallo de red desconocido'), url); };
        xhr.send();
    },

    clock: {
        start: function() {
            this.update();
            setInterval(this.update, 1000);
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
            var d = new Date(App.state.displayedYear, App.state.displayedMonth + offset, 1);
            App.state.displayedYear = d.getFullYear();
            App.state.displayedMonth = d.getMonth();
            this.render();
        },
        returnToToday: function() {
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
                                                App.elements.sunInfo.innerHTML = 'Obteniendo ubicación...';
                                                App.elements.sunInfo.style.opacity = 1;
                                    
                                                if ("geolocation" in navigator) {                            navigator.geolocation.getCurrentPosition(function(position) {
                                var geo = {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude
                                };
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
                                }, function(error, url) { App.theme.onError(error, 'solares', url); });
                                            }, function(error) {
                                                var errorMessage = 'Error desconocido de Geolocation.';
                                                switch (error.code) {
                                                    case error.PERMISSION_DENIED:
                                                        errorMessage = 'Permiso de ubicación denegado por el usuario.';
                                                        break;
                                                    case error.POSITION_UNAVAILABLE:
                                                        errorMessage = 'Información de ubicación no disponible.';
                                                        break;
                                                    case error.TIMEOUT:
                                                        errorMessage = 'La solicitud para obtener la ubicación ha caducado.';
                                                        break;
                                                }
                                                App.theme.onError(new Error(errorMessage), 'geolocation', 'navigator.geolocation');
                                            });
                                        } else {
                                            App.theme.onError(new Error('Geolocalización no soportada por el navegador.'), 'geolocation', 'navigator.geolocation');
                                        }        },
        update: function() {
            if (App.state.sunriseMinutes === null || App.state.sunsetMinutes === null) return;
            var now = new Date();
            var nowMinutes = now.getHours() * 60 + now.getMinutes();
            var isNight = nowMinutes < App.state.sunriseMinutes || nowMinutes > App.state.sunsetMinutes;
            this.set(isNight);
            var targetMinutes = isNight ? App.state.sunriseMinutes : App.state.sunsetMinutes;
            var icon = isNight ? App.icons.sun : App.icons.moon;
            var hours = String(Math.floor(targetMinutes / 60)).padStart(2, '0');
            var minutes = String(targetMinutes % 60).padStart(2, '0');
            App.elements.sunInfo.innerHTML = icon + '<span>' + hours + ':' + minutes + '</span>';
            App.elements.sunInfo.style.opacity = 1;
        },
        set: function(isDark) {
            if (isDark) App.elements.body.classList.add('dark-mode');
            else App.elements.body.classList.remove('dark-mode');
        },
        onError: function(error, step, url) {
            console.error("Fallo en el paso '" + step + "' (" + url + "):", error);

            if (App.elements.debugLog) {
                App.elements.debugLog.style.display = 'block'; // Make debug log visible

                var debugMessage = document.createElement('p');
                var timestamp = new Date().toLocaleTimeString();
                debugMessage.textContent = `[${timestamp}] ERROR en '${step}' (${url}): ${error.message || error.toString()}`;
                App.elements.debugLog.appendChild(debugMessage);

                // Limit debug log to prevent UI clutter
                while (App.elements.debugLog.children.length > 10) {
                    App.elements.debugLog.removeChild(App.elements.debugLog.firstChild);
                }
            }

            App.theme.set(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            App.elements.sunInfo.innerHTML = 'Servicio de hora no disponible.';
            if (App.elements.sunInfo) { // Ensure sunInfo exists before appending
                var themeToggleContainer = document.createElement('div');
                themeToggleContainer.style.display = 'flex';
                themeToggleContainer.style.alignItems = 'center';
                themeToggleContainer.style.marginTop = '10px';

                var labelText = document.createElement('span');
                labelText.textContent = 'Modo Oscuro';
                themeToggleContainer.appendChild(labelText);

                var switchLabel = document.createElement('label');
                switchLabel.className = 'switch';
                var switchInput = document.createElement('input');
                switchInput.type = 'checkbox';
                switchInput.id = 'theme-toggle-switch';
                switchInput.checked = App.elements.body.classList.contains('dark-mode'); // Reflect current theme
                var switchSlider = document.createElement('span');
                switchSlider.className = 'slider';

                switchLabel.appendChild(switchInput);
                switchLabel.appendChild(switchSlider);
                themeToggleContainer.appendChild(switchLabel);
                
                switchInput.addEventListener('change', function() {
                    App.theme.set(switchInput.checked);
                });
                App.elements.sunInfo.appendChild(themeToggleContainer);
            }
            App.elements.sunInfo.style.opacity = 1;
        }
    },

    fullscreen: {
        init: function() {
            App.elements.dashboard.addEventListener('click', function(e) {
                var el = e.target;
                while (el && el !== App.elements.dashboard) {
                    if (el.classList.contains('nav-arrow') || el.classList.contains('calendar-title')) {
                        return;
                    }
                    el = el.parentElement;
                }
                App.fullscreen.toggle();
            });
        },
        toggle: function() {
            var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
            if (!fsEl) {
                var el = document.documentElement;
                if (el.requestFullscreen) el.requestFullscreen();
                else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        }
    },

    init: function() {
        this.clock.start();
        this.calendar.render();
        this.calendar.scheduleDailyUpdate();
        this.theme.init();
        this.fullscreen.init();

        if (App.elements.debugToggleButton && App.elements.debugLog) {
            App.elements.debugToggleButton.style.display = 'block'; // Make button visible
            App.elements.debugToggleButton.addEventListener('click', function() {
                if (App.elements.debugLog.style.display === 'none') {
                    App.elements.debugLog.style.display = 'block';
                } else {
                    App.elements.debugLog.style.display = 'none';
                }
            });
        }
    }
};

App.init();