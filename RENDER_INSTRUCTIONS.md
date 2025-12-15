# Guía de Despliegue en Render (Web Service)

Este proyecto está configurado para ser desplegado como un **Web Service** en [Render](https://render.com).

## 1. Preparación

Asegúrate de tener tu código subido a un repositorio de GitHub o GitLab.

## 2. Preparación del Repositorio (Código)

Como tienes el código en local, necesitas subirlo a tu repositorio de GitHub: `https://github.com/infistelsac/atencioncliente`

Abre tu terminal (Git Bash o Command Prompt) en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Preparar para deploy como Web Service"
git branch -M main
git remote add origin https://github.com/infistelsac/atencioncliente.git
git push -u origin main
```

## 3. Configuración en Render

1.  Crea una cuenta en Render si no la tienes.
2.  En el Dashboard, haz clic en **New +** y selecciona **Web Service**.
3.  Conecta tu repositorio de GitHub.
4.  Render detectará automáticamente la configuración del archivo `render.yaml` si eliges "Deploy from render.yaml" (Blueprint).
5.  Si configuras manualmente:
    *   **Name:** `infistel-atencion-cliente`
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `npm start`

## 4. Variables de Entorno (Environment Variables)

Es crucial configurar las siguientes variables en la sección "Environment" de tu servicio en Render:

### Obligatorias:
*   **`GEMINI_API_KEY`**: Tu clave API de Google Gemini.
*   **`META_VERIFY_TOKEN`**: Token de verificación para el Webhook (por defecto es `infistel_token_secure`).

### Opcionales:
*   **`VITE_FIREBASE_CONFIG`**: JSON de configuración de Firebase si deseas persistencia real.

## 5. Finalizar

Haz clic en **Create Web Service**. Render descargará el código, instalará las dependencias, construirá la aplicación y la iniciará usando `serve`.
