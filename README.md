# Uber Move — Frontend Ionic + Angular

Aplicación móvil y web minimalista tipo Uber desarrollada en **Ionic 8 + Angular** y conectada a la API REST en **Laravel 12** (`http://20.20.2.171:8000/api`).

## 1. Configuración de Red y Servidor

- **URL Base configurada por defecto:** `http://20.20.2.171:8000/api` (definida en `src/environments/environment.ts` y `src/environments/environment.prod.ts`).
- También puedes cambiar o verificar la IP en tiempo real desde la interfaz haciendo clic en el indicador verde `http://20.20.2.171:8000/api` en la pantalla de Login o en la barra superior (`TopNavbarComponent`).

## 2. Estructura del Proyecto

```text
proyecto uber/
├── API_DOCUMENTATION.md
├── package.json
├── angular.json
├── ionic.config.json
├── capacitor.config.ts
└── src/
    ├── environments/
    │   ├── environment.ts              # IP del servidor: http://20.20.2.171:8000/api
    │   └── environment.prod.ts
    ├── theme/
    │   └── variables.scss              # Paleta minimalista Uber (Negro/Blanco/Esmeralda)
    ├── global.scss                     # Sistema de diseño, tarjetas, badges y pines de mapa
    └── app/
        ├── core/
        │   ├── models/api.models.ts    # Interfaces TypeScript de todos los endpoints
        │   ├── guards/auth.guard.ts    # Control de acceso por roles (RBAC: client, driver, admin)
        │   ├── interceptors/
        │   │   └── auth.interceptor.ts # Inyección automática de JWT Bearer Token y manejo de 401
        │   └── services/
        │       ├── api-config.service.ts
        │       ├── auth.service.ts     # /api/auth/*
        │       ├── client.service.ts   # /api/fares/active y /api/client/*
        │       ├── driver.service.ts   # /api/driver/*
        │       └── admin.service.ts    # /api/admin/*
        ├── shared/
        │   └── components/
        │       └── top-navbar.component.ts
        └── pages/
            ├── auth/
            │   ├── login/login.page.ts       # Login JWT + Forgot Password (RF-CLI-03)
            │   └── register/register.page.ts # Registro Cliente y Conductor (con vehículo)
            ├── client/
            │   └── client-home.page.ts       # Mapa Leaflet, estimación Haversine, viajes y rating
            ├── driver/
            │   └── driver-home.page.ts       # Disponibilidad, radar 409 lock, arrive/start/complete y GPS
            └── admin/
                └── admin-dashboard.page.ts   # KPIs, aprobación conductores, tarifas, viajes, reportes y logs
```

## 3. Ejecución del Proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo (puerto 8100)
npm start
# o con Ionic CLI:
ionic serve
```

