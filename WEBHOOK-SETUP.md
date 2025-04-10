# Configuración de Webhooks en Sanity para Actualización en Tiempo Real

Este documento explica cómo configurar un webhook en Sanity Studio para que cuando se actualice el contenido, tu sitio web de Next.js se actualice automáticamente.

## Paso 1: Obtén la URL de tu API de revalidación

Cuando tu sitio esté desplegado en Vercel, necesitarás la URL completa de tu endpoint de revalidación:

```
https://tu-dominio.vercel.app/api/revalidate
```

Para desarrollo local, puedes usar:

```
http://localhost:3000/api/revalidate
```

## Paso 2: Configura el Webhook en Sanity

1. Inicia sesión en [Sanity Manage](https://www.sanity.io/manage)
2. Selecciona tu proyecto
3. Ve a la sección **API**
4. Haz clic en la pestaña **Webhooks**
5. Haz clic en **Create webhook**
6. Configura el webhook con la siguiente información:
   - **Name**: Revalidate Next.js Site
   - **URL**: Tu URL de revalidación (del Paso 1) + `?secret=fcb2b5d8e6f7g8h9j0k1l2m3n4o5p6q`
     - Ejemplo: `https://tu-dominio.vercel.app/api/revalidate?secret=fcb2b5d8e6f7g8h9j0k1l2m3n4o5p6q`
   - **Dataset**: production
   - **Projection**: Deja vacío para incluir todos los campos
   - **Filter**: Puedes dejarlo vacío para incluir todos los documentos o agregar un filtro específico
   - **Secret**: No es necesario si ya lo incluiste en la URL
   - **HTTP method**: POST
   - **API version**: v2021-03-25

7. Haz clic en **Save**

## Paso 3: Prueba tu Webhook

1. Realiza un cambio en tu contenido en Sanity Studio
2. Publica el cambio
3. Espera unos segundos
4. Verifica tu sitio web para confirmar que los cambios aparecen sin necesidad de redesplegar

## Notas de Seguridad

- El secreto en tu archivo `.env` debería ser una cadena aleatoria segura
- Nunca compartas este secreto públicamente
- Considera usar un generador de contraseñas o ejecutar este comando para generar un secreto:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

## Solución de Problemas

Si los webhooks no funcionan correctamente:

1. Verifica los logs en Vercel para ver si el endpoint de revalidación está recibiendo las solicitudes
2. Asegúrate de que el secreto en la URL coincida con el configurado en tu archivo `.env`
3. Comprueba que has publicado (no solo guardado) tus cambios en Sanity 