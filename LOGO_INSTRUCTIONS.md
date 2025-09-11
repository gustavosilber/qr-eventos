# Instrucciones para agregar el logo

## 📁 Ubicación del logo

Para agregar el logo del evento "MERLO BAILA SILBER Edition", sigue estos pasos:

1. **Guarda el logo** en la siguiente ubicación:
   ```
   public/images/merlo-baila-silber-logo.png
   ```

2. **Formato recomendado**:
   - PNG con fondo transparente
   - Tamaño: 200x200 píxeles mínimo
   - Resolución: 72 DPI o superior

## 🎨 Características del logo

El logo que me mostraste tiene:
- **Estilo**: Vibrante y moderno con gradientes
- **Colores**: Rosa, púrpura, azul, naranja y amarillo
- **Texto**: "merlo", "Baila", "+Silber"
- **Fondo**: Círculo negro

## ✅ Funcionalidad

- El logo aparecerá en la esquina superior izquierda de la entrada
- Si el logo no se carga, se mostrará un ícono de WhatsApp como respaldo
- El logo se incluirá automáticamente en las entradas descargadas

## 🔧 Personalización

Si quieres cambiar el tamaño o posición del logo, edita estos estilos en `src/styles/EntradaWhatsApp.css`:

```css
.logo-container {
  width: 60px;  /* Cambia el tamaño aquí */
  height: 60px;
}

.event-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}
```

## 📱 Resultado

Una vez agregado el logo, las entradas tendrán:
- Logo del evento en la parte superior
- Información del asistente
- Código QR
- Diseño de WhatsApp mejorado

¡El logo le dará un toque profesional y único a las entradas! 🎉 