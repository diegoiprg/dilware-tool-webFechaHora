# ⏳ Web Fecha y Hora

![Licencia](https://img.shields.io/badge/License-GPLv3-blue.svg)
<!-- ![GitHub Pages](https://github.com/<username>/<repo-name>/workflows/deploy/badge.svg)  -->
![Captura de Pantalla - Horizontal](screenshots/dashboard-horizontal.png)

## 📸 Capturas de Pantalla

### Diseño Horizontal

![Captura de Pantalla - Horizontal](screenshots/dashboard-horizontal.png)
_Vista del dashboard en orientación horizontal._

### Diseño Vertical

![Captura de Pantalla - Vertical](screenshots/dashboard-vertical.png)
_Vista del dashboard en orientación vertical._

Una aplicación web simple, elegante e instalable para mostrar la fecha y hora actuales, junto con un calendario interactivo y funcionalidades inteligentes como un modo oscuro/claro dinámico. Ideal para mantener a la vista la información horaria esencial con un diseño moderno.

## 🚀 Demo en Vivo

Puedes ver y probar la aplicación desplegada en GitHub Pages aquí:
[https://<USERNAME>.github.io/<REPOSITORY_NAME>/](https://<USERNAME>.github.io/<REPOSITORY_NAME>/)
*(Reemplaza `<USERNAME>` con tu nombre de usuario de GitHub y `<REPOSITORY_NAME>` con el nombre de tu repositorio, por ejemplo, `dilware-tool-webFechaHora`.)*

## ✨ Características Principales

*   **Reloj en Tiempo Real:** Muestra la hora y los minutos actuales con actualizaciones dinámicas.
*   **Calendario Interactivo:** Un calendario del mes actual con navegación intuitiva entre meses y resaltado del día de hoy.
*   **Modo Oscuro/Claro Inteligente:**
    *   Cambio automático entre temas oscuro y claro basado en los horarios de amanecer y atardecer de tu ubicación (requiere permiso de geolocalización).
    *   Si la geolocalización no está disponible o se deniega, el sistema utiliza horarios fijos de día/noche.
    *   Opción manual para alternar el tema y persistencia de la preferencia.
*   **Modo Pantalla Completa:** Permite expandir la aplicación a pantalla completa para una experiencia inmersiva.
*   **Protección Anti-Quemado de Pantalla:** Mueve sutilmente el contenido principal cada pocos minutos para prevenir el efecto "burn-in" en pantallas.
*   **Aplicación Web Progresiva (PWA):** Instalable en tu dispositivo y funciona sin conexión a internet.
*   **Iconos SVG Dinámicos:** Los iconos de la interfaz se cargan dinámicamente en formato SVG y se adaptan al tema actual.
*   **Diseño Responsivo:** Se adapta fluidamente a diferentes tamaños y orientaciones de pantalla (vertical/horizontal).
*   **Registro de Depuración:** Un panel de depuración integrado que muestra eventos y errores de la aplicación.
*   **Integración con Google Analytics:** Seguimiento anónimo de interacciones para entender el uso de la aplicación (configurable).

## 🛠️ Tecnologías Utilizadas

*   **HTML5:** Estructura del contenido.
*   **CSS3:** Estilos y diseño responsivo, incluyendo variables CSS para theming.
*   **JavaScript (Vanilla JS):** Toda la lógica de la aplicación, sin frameworks adicionales.
*   **Open-Meteo API:** Para obtener datos de amanecer y atardecer basados en la ubicación.

## 📦 Cómo Usar

1.  **Visita la Demo:** Accede a la aplicación a través del enlace de GitHub Pages.
2.  **Instala (Opcional):** Si tu navegador lo soporta, verás una opción para "Instalar aplicación" (normalmente en la barra de direcciones o menú del navegador). Esto la instalará como una aplicación nativa en tu dispositivo.
3.  **Explora las Funciones:** Utiliza los botones en la esquina superior derecha para alternar el modo oscuro, activar la pantalla completa o ver el log de depuración. Navega por el calendario haciendo clic en las flechas.

## ⚙️ Desarrollo Local

Si deseas contribuir o ejecutar el proyecto localmente:

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/<USERNAME>/dilware-tool-webFechaHora.git
    cd dilware-tool-webFechaHora
    ```
2.  **Abre `index.html`:** Simplemente abre el archivo `index.html` en tu navegador web preferido. No se necesita ningún servidor local ni proceso de compilación.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si tienes alguna idea para mejorar la aplicación, no dudes en abrir un *issue* o enviar un *pull request*.

## 📄 Licencia

Este proyecto está bajo la Licencia Pública General GNU v3 (GPLv3). Consulta el archivo [`LICENSE`](LICENSE) para más detalles.