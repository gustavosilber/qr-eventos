# QR Eventos

Sistema completo para la gestión de eventos con códigos QR, incluyendo generación de entradas con formato de WhatsApp.

## 🚀 Características

- **Generación de QR**: Crea códigos QR personalizados para eventos
- **Entradas WhatsApp**: Genera entradas con formato de WhatsApp para eventos específicos
- **Gestión de Eventos**: Administra y organiza todos tus eventos
- **Escanear QR**: Verifica la validez de las entradas escaneando códigos QR
- **Diseño Responsivo**: Interfaz moderna y adaptable a todos los dispositivos

## 🎯 Funcionalidades Específicas

### Entrada WhatsApp - MERLO BAILA SILBER Edition
- Formulario para ingresar nombre, apellido y monto abonado
- Generación automática de entrada con formato de WhatsApp
- Código QR con información del evento y asistente
- Opciones para descargar y compartir la entrada

## 🛠️ Tecnologías Utilizadas

- **React 18**: Framework principal
- **Vite**: Build tool y servidor de desarrollo
- **React Router**: Navegación entre páginas
- **QRCode.react**: Generación de códigos QR
- **Lucide React**: Iconos modernos
- **CSS3**: Estilos personalizados con diseño responsivo

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd qr-eventos
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre tu navegador en `http://localhost:3000`

## 🚀 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza la build de producción
- `npm run lint`: Ejecuta el linter
- `npm run lint:fix`: Corrige automáticamente los errores del linter

## 📱 Páginas Disponibles

### 🏠 Inicio
- Vista general del sistema
- Características principales
- Enlaces rápidos a funcionalidades

### 📅 Eventos
- Lista de eventos creados
- Estados de eventos (Activo, Pendiente, Finalizado)
- Información detallada de cada evento

### 💬 Entrada WhatsApp
- Formulario para datos del asistente
- Generación de entrada con formato de WhatsApp
- Código QR con información del evento
- Opciones de descarga y compartir

### 🔧 Generar QR
- Formulario completo para crear códigos QR
- Información detallada del evento
- Descarga del código QR generado

### 📱 Escanear QR
- Simulación de escaneo de códigos QR
- Verificación de validez de entradas
- Información detallada del evento escaneado

## 🎨 Diseño

El proyecto utiliza un diseño moderno con:
- Colores inspirados en WhatsApp (#25d366)
- Gradientes y sombras para profundidad
- Diseño responsivo para móviles y desktop
- Animaciones suaves y transiciones

## 📁 Estructura del Proyecto

```
qr-eventos/
├── public/
├── src/
│   ├── components/
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Eventos.jsx
│   │   ├── GenerarQR.jsx
│   │   ├── EscanearQR.jsx
│   │   └── EntradaWhatsApp.jsx
│   ├── styles/
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── Navbar.css
│   │   ├── Home.css
│   │   ├── Eventos.css
│   │   ├── GenerarQR.css
│   │   ├── EscanearQR.css
│   │   └── EntradaWhatsApp.css
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Configuración

### Variables de Entorno
El proyecto está configurado para funcionar sin variables de entorno adicionales.

### Personalización
- Colores: Modifica las variables CSS en `src/styles/index.css`
- Eventos: Edita la información del evento en `src/pages/EntradaWhatsApp.jsx`

## 📄 Licencia

MIT License - ver archivo LICENSE para más detalles.

## 👨‍💻 Autor

Gustavo Silber

---

¡Disfruta usando QR Eventos! 🎉 