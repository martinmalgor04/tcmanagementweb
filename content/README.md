# Contenido de los infoproductos

Acá viven los HTML que se sirven **detrás del pago**. Esta carpeta no es
`public/`: nada de lo que está adentro se puede pedir por URL. La única forma de
llegar al archivo es a través de una ruta que primero valida el entitlement.

## Actualizar el manual de Capital de Esencia Visual

El manual es un `index.html` autocontenido (estilos y scripts adentro; las
imágenes salen del CDN de R2). Para publicar una versión nueva:

```bash
cp /ruta/al/manual/index.html content/capital-esencia-visual/manual.html
git add content/capital-esencia-visual/manual.html
git commit -m "content: actualiza el manual"
git push
```

Vercel lo despliega solo. No hace falta tocar la base ni reenviar links: las
compradoras que ya entraron van a ver la versión nueva la próxima vez que abran.

## Cosas para no romper

El archivo se lee del disco en runtime, así que tiene que viajar en el bundle de
la función. Eso lo garantiza `outputFileTracingIncludes` en `next.config.mjs`.
Si movés esta carpeta o renombrás la ruta, actualizá esa entrada o en Vercel la
función va a desplegarse sin el archivo y el manual va a tirar 500.

Si el HTML pasa a referenciar imágenes con rutas relativas (`img/...`) en vez de
URLs del CDN, van a dar 404: adentro del iframe las rutas relativas se resuelven
contra `/capital-esencia-visual/manual/`, que no sirve archivos estáticos. O se
dejan las URLs absolutas del CDN, o hay que servir los assets desde otra ruta.
