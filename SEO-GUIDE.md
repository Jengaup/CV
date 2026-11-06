# Guía SEO — josealbertopr.com

Última revisión: 2026-11-06. Sitio estático (HTML/CSS/JS, GitHub Pages + Cloudflare); **no** es Next.js ni usa paso de compilación.

## 1. Estado técnico (resumen)

| Elemento | Estado |
|---|---|
| `sitemap.xml` | 4 URLs indexables (inicio, privacidad, términos, accesibilidad). Sin `hreflang` (ver §5). |
| `robots.txt` | Permite todo a buscadores y a rastreadores de búsqueda con IA; bloquea rastreadores de entrenamiento. No bloquea CSS/JS/imágenes/fuentes. |
| `noindex` | Solo en `404.html` (intencional). |
| Canonical | Autorreferencial en cada página, igual a la URL del sitemap. |
| Títulos / descripciones | Únicos por página (≤ 70 y ≤ 160 caracteres). |
| H1 | Uno visible por página. En las páginas legales el bloque del otro idioma está `hidden`. |
| JSON-LD | `ProfilePage`, `WebSite`, `Person` (+ credenciales), `ItemList` de `EmployeeRole`; `WebPage` + `BreadcrumbList` en páginas legales. |
| Open Graph | `og-image.jpg` 1200×630 (86 KB; antes 243 KB PNG). El PNG antiguo se conserva para no romper vistas previas ya compartidas. |
| Fuentes | Alojadas localmente (`/fonts`), sin peticiones a Google. |
| Imágenes | No hay `<img>` de contenido; el avatar es un SVG con `role="img"` y `aria-label`. |
| 404 | `404.html` (GitHub Pages la sirve con estado 404). |
| URLs | `privacy.html`, `terms.html`, `accessibility.html`: cortas y consistentes; no se renombraron para no necesitar redirecciones 301 (GitHub Pages no las admite en el servidor). |

Validación automática: `python3 tests/seo-check.py` (sitemap, robots, canonical, metadatos, H1, JSON-LD, enlaces internos).

## 2. Palabras clave (propuesta; sin datos de volumen)

No tuve acceso a herramientas de volumen de búsqueda. Esta lista sale de cómo suelen buscar los reclutadores y de lo que el sitio **ya** afirma; valídala con Search Console (Rendimiento → Consultas) tras 4–8 semanas.

- Principales: `IT Director`, `IT Manager`, `Business Relationship Manager`, `IT/OT integration`, `digital transformation`.
- Secundarias (credenciales visibles en el sitio): `ITIL 4`, `BRMP`, `Six Sigma Green Belt`, `IT operations`, `cybersecurity`.
- Español (hoy solo se ve en inglés para Google, ver §5): `Director de TI`, `Gerente de TI`, `gerente de relaciones de negocio`.
- Consulta de marca: `Jose Alberto Jimenez` (es la que realmente se posicionará primero).
- **[PENDIENTE — decisión tuya]** Términos geográficos (p. ej. "Puerto Rico"): el sitio no muestra ubicación por una regla anterior de privacidad. Añadirla mejoraría búsquedas locales, pero publica un dato de ubicación. No lo hice.

## 3. Pendientes que requieren tu acceso

1. **[PENDIENTE] Verificar Search Console** (§4).
2. **[PENDIENTE] Cloudflare / DNS / GitHub** (detalle en `SECURITY_DEPLOYMENT.md`): *Always Use HTTPS*, regla de cabeceras, *Enforce HTTPS* en GitHub Pages (Settings → Pages), y confirmar que `www.josealbertopr.com` redirige 301 al dominio sin `www`. No pude verificar el sitio en vivo desde el entorno de desarrollo (bloqueado por el proxy), así que **no está comprobado** que hoy HTTP→HTTPS responda 301.
3. **[PENDIENTE] Caché**: GitHub Pages suele servir `max-age=600` (no verificado en vivo). En Cloudflare → Caching → Cache Rules, define *Browser TTL* de 1 año para `/fonts/*`, `/vendor/*` y `og-image.jpg` (son archivos que no cambian de nombre) y 4 h para CSS/JS. Verifica que Brotli esté activo (por defecto lo está).
4. **[PENDIENTE] Cuenta X/Twitter**: retiré `twitter:site`, `twitter:creator` y `profile:username` porque no puedo verificar que existan. Si tienes cuenta, indícame el usuario real.
5. **[PENDIENTE] Habilidades del marcado**: retiré de `knowsAbout`/`skills` términos que no aparecen en el contenido visible (SCADA, Azure, Cloud Computing, Infrastructure/Project/Program/Vendor/IT Portfolio Management, OT Systems). Si son ciertos y quieres mostrarlos, añádelos primero al texto visible y luego al JSON-LD.
6. **[PENDIENTE] Refrescar vistas previas**: tras publicar, pide a LinkedIn (Post Inspector) y a Facebook (Sharing Debugger) que vuelvan a leer la URL para que usen `og-image.jpg`.

## 4. Google Search Console (paso a paso)

1. Entra en https://search.google.com/search-console con la cuenta de Google que usarás.
2. **Añadir propiedad → Dominio** → `josealbertopr.com` (cubre http/https y subdominios).
3. Google muestra un registro **TXT**. En Cloudflare → DNS → Add record: tipo `TXT`, nombre `@`, contenido = el valor que te dio Google (`[PENDIENTE]`, solo lo ves tú). Guarda y pulsa **Verificar** (puede tardar unos minutos).
   - Alternativa sin DNS: propiedad *Prefijo de URL* → etiqueta HTML; me pasas el `content` y la añado al `<head>`.
4. **Sitemaps** → escribe `sitemap.xml` → Enviar. Debe decir *Correcto* y detectar 4 URL.
5. **Inspección de URL** → pega `https://josealbertopr.com/` → *Probar URL activa* → **Solicitar indexación**.
6. A los 3–7 días revisa **Páginas** (debe mostrar 4 indexadas; el 404 no cuenta) y **Experiencia → Core Web Vitals** (los datos reales tardan semanas en aparecer).
7. Opcional: Bing Webmaster Tools → *Importar desde Google Search Console* (alimenta también a otros buscadores).

## 5. Limitación importante: el español no es indexable hoy

La traducción ES/EN se aplica con JavaScript sobre **una sola URL**. Google solo ve el inglés (idioma por defecto). Por eso quité las etiquetas `hreflang` (apuntaban es/en a la misma URL, lo cual es inválido).

Si quieres posicionarte también en español (reclutadores en Puerto Rico), la opción correcta es crear páginas estáticas separadas (p. ej. `/es/`) con `hreflang` recíproco. Eso crea URLs públicas nuevas y duplica el contenido a mantener, así que **requiere tu aprobación**; no lo implementé.

## 6. Estrategia de backlinks (ética, priorizada)

Un currículum web no necesita volumen de enlaces: necesita **pocos enlaces coherentes de perfiles reales** que confirmen quién eres. Prioriza por impacto/dificultad:

| # | Acción | Impacto | Dificultad |
|---|---|---|---|
| 1 | Poner `https://josealbertopr.com/` en tu perfil de LinkedIn (sección *Sitio web* e *Información de contacto*) y como enlace destacado. Mantén el mismo nombre y título que en el sitio. | Alto | Muy baja |
| 2 | Perfiles de credenciales que permitan enlazar sitio web: BRM Institute, ASQ, CompTIA, UiPath Academy, Toastmasters, FEMA/EMI (solo donde exista campo de sitio web y la credencial sea tuya). | Medio-alto | Baja |
| 3 | Perfil de egresado de University of Phoenix y UMET (si ofrecen directorio o publicación de logros). | Medio | Baja |
| 4 | Perfiles propios: GitHub (README), Gravatar, about.me, Medium/dev.to, X si existe. Enlazan al sitio con el nombre como texto. | Medio | Baja |
| 5 | Artículos propios en LinkedIn/Medium sobre temas que ya dominas (IT/OT, BRM, ITIL 4) con enlace natural al portafolio. Solo contenido que puedas respaldar. | Medio | Media |
| 6 | Participar como ponente/invitado en eventos, podcasts o comunidades de TI y BRM (capítulos locales, universidades, itSMF/ISACA si eres miembro) y pedir que enlacen tu sitio en la biografía. | Alto | Media-alta |
| 7 | Mentoría o charlas de carrera en universidades: suelen enlazar al perfil del ponente. | Medio | Media |

Reglas: **no** comprar enlaces, **no** redes de blogs/PBN, **no** intercambios masivos, **no** comentarios ni directorios de spam, texto ancla natural (tu nombre o "portafolio de TI"), nunca el mismo ancla repetido. Los enlaces de redes sociales suelen ser `nofollow`: sirven para visibilidad y tráfico, no tanto para autoridad, y está bien.

Medición: Search Console → *Enlaces*; revisa cada trimestre.
