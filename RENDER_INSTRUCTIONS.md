# Guía de Despliegue en Render

Este proyecto está configurado para ser desplegado como un **Sitio Estático (Static Site)** en [Render](https://render.com).

## 1. Preparación

Asegúrate de tener tu código subido a un repositorio de GitHub o GitLab.

## 2. Preparación del Repositorio (Código)

Como tienes el código en local, necesitas subirlo a tu repositorio de GitHub: `https://github.com/infistelsac/atencioncliente`

Abre tu terminal (Git Bash o Command Prompt) en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Preparar para deploy en Render"
git branch -M main
git remote add origin https://github.com/infistelsac/atencioncliente.git
git push -u origin main
```

## 3. Configuración en Render

1.  Crea una cuenta en Render si no la tienes.
2.  En el Dashboard, haz clic en **New +** y selecciona **Static Site**.
3.  Conecta tu repositorio de GitHub/GitLab.
4.  Selecciona el repositorio de este proyecto.

## 3. Detalles de Configuración

Render detectará automáticamente la configuración si usas el archivo `render.yaml`, pero si lo haces manualmente:

*   **Name:** `infistel-atencion-cliente` (o el que prefieras)
*   **Build Command:** `npm install && npm run build`
*   **Publish Directory:** `dist`

## 4. Variables de Entorno (Environment Variables)

Es crucial configurar las siguientes variables en la sección "Environment" de tu servicio en Render para que la aplicación funcione correctamente:

### Obligatorias:
*   **`GEMINI_API_KEY`**: Tu clave API de Google Gemini.

### Opcionales (para Firebase):
Si deseas usar la persistencia de datos con Firebase en lugar del modo Demo (Mocks), debes configurar Firebase.
La aplicación está configurada para usar el modo Demo automáticamente si no detecta configuración.

Si deseas producción real:
1.  Necesitarás inyectar la configuración. Actualmente el código busca una configuración global.
2.  Para facilitar esto en Render, puedes agregar una variable `VITE_FIREBASE_CONFIG` con el JSON de tu config, pero requeriría una pequeña modificación en `vite.config.ts` para inyectarla.
    *   *Nota: Por defecto, el deploy usará Mocks y funcionará perfectamente para visualización.*

## 5. Finalizar

Haz clic en **Create Static Site**. Render descargará el código, instalará las dependencias, construirá la aplicación y la desplegará.
