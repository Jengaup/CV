/* ============================================================
   BILINGUAL SUPPORT — English (default) / Spanish
   ============================================================ */
(function () {
  var translations = {
    en: {
      'nav.about':      'About',
      'nav.expertise':  'Expertise',
      'nav.impact':     'Impact',
      'nav.experience': 'Experience',
      'nav.contact':    'Contact',

      'hero.title': 'IT Director &amp; Business Relationship Manager',
      'hero.sub':   '20+ years of IT leadership, digital transformation, and IT/OT integration across energy, pharmaceutical, healthcare, and food service industries. US Citizen. Bilingual EN/ES.',
      'hero.cta1':  'Get in Touch',
      'hero.cta2':  'See My Impact',
      'hero.stat1': 'Years of Experience',
      'hero.stat2': 'Cost Savings Delivered',
      'hero.stat3': 'On-Time Project Delivery',
      'hero.stat4': 'Industries Served',

      'about.label':     'About',
      'about.title':     'Where Technology Meets <span class="accent">Business Value</span>',
      'about.lead':      'I am a results-driven IT Director and Business Relationship Manager with over 20 years of experience leading digital transformation, IT/OT integration, and technology strategy across regulated and high-demand industries.',
      'about.p2':        'My career spans energy, pharmaceutical, healthcare, and food service sectors. I have managed multi-million-dollar IT portfolios, led cross-functional teams, driven vendor negotiations, and built strong partnerships between business units and IT organizations. I hold an MBA in Technology Management and hands-on expertise in infrastructure, cloud, cybersecurity, compliance, and project delivery.',
      'about.p3':        'Known for stakeholder management at the executive level, change management leadership, and a track record of on-time, on-budget project execution. Bilingual in English and Spanish. US Citizen. Available for on-site, remote, or hybrid roles.',
      'about.certsLabel': 'Credentials &amp; Certifications',
      'about.v1title':   'Results First',
      'about.v1desc':    'Every initiative I lead is tied to measurable business outcomes: cost reduction, efficiency gains, and real capability improvements.',
      'about.v2title':   'Partnership Mindset',
      'about.v2desc':    'I build trust across organizational layers, from shop floor to boardroom, making sure technology serves people and not the other way around.',
      'about.v3title':   'Continuous Improvement',
      'about.v3desc':    'Trained in Six Sigma methodology, I systematically identify inefficiencies and implement sustainable improvements.',

      'expertise.label': 'Core Strengths',
      'expertise.title': 'Areas of <span class="accent">Expertise</span>',
      'expertise.sub':   'A comprehensive command of the technical and leadership dimensions that modern IT Directors and Technology Managers need to deliver real business value.',

      'exp1.title': 'IT Leadership &amp; Team Management',
      'exp1.desc':  'Building and guiding high-performance IT teams. Mentoring professionals, defining vision, and aligning day-to-day operations with strategic objectives.',
      'exp2.title': 'IT/OT Integration &amp; Alignment',
      'exp2.desc':  'Bridging Information Technology and Operational Technology in manufacturing and energy environments. Ensuring systems speak the same language as the business.',
      'exp3.title': 'Infrastructure &amp; Operations',
      'exp3.desc':  'End-to-end management of enterprise infrastructure: networks, servers, data centers, storage systems, virtualization (VMware/ESX), and cloud environments.',
      'exp4.title': 'Business Relationship Management',
      'exp4.desc':  'Serving as the strategic bridge between IT and business units. Translating organizational needs into technology roadmaps that generate tangible value.',
      'exp5.title': 'Project &amp; Program Delivery',
      'exp5.desc':  'Leading complex, cross-functional technology programs from scoping to delivery. Consistent track record of on-time, on-budget execution across multiple concurrent projects.',
      'exp6.title': 'Process Improvement &amp; Six Sigma',
      'exp6.desc':  'Green Belt certified in Six Sigma methodology. Systematically identifying inefficiencies, implementing controls, and measuring results to drive sustainable operational improvements.',
      'exp7.title': 'IT Security &amp; Compliance',
      'exp7.desc':  'Enforcing security policies, managing regulatory compliance (FDA, cGMP), and implementing cybersecurity frameworks to protect critical enterprise assets and data.',
      'exp8.title': 'Bilingual Communication',
      'exp8.desc':  'Fully bilingual in English and Spanish, which allows me to collaborate effectively with global teams, multinational stakeholders, and diverse user communities across industries.',

      'impact.label': 'Selected Impact',
      'impact.title': 'Delivering <span class="accent">Measurable Results</span>',
      'impact.sub':   'Impact speaks louder than titles. Here are some of the outcomes I have driven throughout my career.',

      'ic1.title': 'Cost Savings via IT/OT Initiatives',
      'ic1.desc':  'Led strategic IT/OT integration programs at Luma Energy, identifying and implementing initiatives that saved over $1.2 million while maintaining full project quality and deliverables.',
      'ic1.tag':   'Luma Energy · 2024–Present',
      'ic2.title': 'Operational Efficiency Increase',
      'ic2.desc':  'Aligned technology roadmaps across 7 departments with business objectives, resulting in a 15% increase in operational efficiency through strategic IT/OT integration.',
      'ic2.tag':   'Luma Energy',
      'ic3.title': 'On-Time Project Delivery Rate',
      'ic3.desc':  'Supervised technology implementations across the full project lifecycle, consistently achieving 95% of project deadlines on time and within budget.',
      'ic3.tag':   'Luma Energy',
      'ic4.title': 'Network Infrastructure Savings',
      'ic4.desc':  'Led a network infrastructure change management project replacing L2 switches, APs, and wireless controllers, delivering $198K in year one savings and a projected $250K in year two.',
      'ic4.tag':   'Avara Pharmaceutical · 2016–2023',
      'ic5.title': 'Downtime Reduction',
      'ic5.desc':  'Identified root causes of recurring program issues and implemented creative solutions that reduced operational downtime by 20%, improving service continuity across the organization.',
      'ic5.tag':   'Luma Energy',
      'ic6.title': 'Six Sigma Certification Achieved',
      'ic6.desc':  'Earned Six Sigma Green Belt for implementing a network monitoring and management project that realized $198K in savings and contributed 17% toward the company\'s savings goal.',
      'ic6.tag':   'Avara Pharmaceutical',

      'xp.label': 'Career Highlights',
      'xp.title': 'Professional <span class="accent">Experience</span>',

      'contact.label':           'Contact',
      'contact.title':           'Let\'s <span class="accent">Connect</span>',
      'contact.sub':             'Whether you have a leadership opportunity, a strategic initiative, or simply want to connect, I would be glad to hear from you.',
      'contact.industries':      'Industries',
      'contact.languages':       'Languages',
      'contact.availability':    'Availability',
      'contact.availabilityVal': 'Open to new opportunities',
      'contact.workstyle':       'Work Style',
      'contact.workstyleVal':    'On-site · Remote · Hybrid',

      'form.name':         'Full Name',
      'form.namePh':       'Your full name',
      'form.subject':      'Subject',
      'form.subjectPh':    'What is this regarding?',
      'form.message':      'Message',
      'form.messagePh':    'Tell me about the opportunity or reason for reaching out...',
      'form.submit':       'Send Message',
      'form.sending':      'Sending…',
      'form.successTitle': 'Message sent successfully!',
      'form.successMsg':   'Thank you for reaching out. I will get back to you shortly.',
      'form.errorTitle':   'Something went wrong.',
      'form.errorMsg':     'Please try again or check your connection.',
      'form.rateLimit':    'Too many attempts. Please try again later.',

      'footer.rights': 'All rights reserved.',
      'footer.note':   'IT Director &amp; Business Relationship Manager · US Citizen · Bilingual EN/ES',
    },

    es: {
      'nav.about':      'Sobre Mí',
      'nav.expertise':  'Especialidades',
      'nav.impact':     'Impacto',
      'nav.experience': 'Experiencia',
      'nav.contact':    'Contacto',

      'hero.title': 'Director de TI y Gerente de Relaciones de Negocio',
      'hero.sub':   'Más de 20 años de liderazgo en TI, transformación digital e integración TI/OT en industrias de energía, farmacéutica, salud y servicio de alimentos. Ciudadano estadounidense. Bilingüe EN/ES.',
      'hero.cta1':  'Contáctame',
      'hero.cta2':  'Ver Mi Impacto',
      'hero.stat1': 'Años de Experiencia',
      'hero.stat2': 'Ahorros Generados',
      'hero.stat3': 'Proyectos Entregados a Tiempo',
      'hero.stat4': 'Industrias Atendidas',

      'about.label':     'Sobre Mí',
      'about.title':     'Donde la Tecnología Genera <span class="accent">Valor de Negocio</span>',
      'about.lead':      'Soy un Director de TI y Gerente de Relaciones de Negocio orientado a resultados, con más de 20 años liderando transformación digital, integración TI/OT y estrategia tecnológica en industrias reguladas y de alta demanda.',
      'about.p2':        'Mi carrera abarca los sectores de energía, farmacéutica, salud y servicio de alimentos. He gestionado portafolios de TI multimillonarios, liderado equipos interfuncionales, negociado con proveedores y construido alianzas sólidas entre las unidades de negocio y la organización de TI. Poseo un MBA en Gestión Tecnológica y experiencia práctica en infraestructura, nube, ciberseguridad, cumplimiento y entrega de proyectos.',
      'about.p3':        'Reconocido por la gestión de partes interesadas a nivel ejecutivo, liderazgo en gestión del cambio y un historial comprobado de ejecución puntual y dentro del presupuesto. Bilingüe en inglés y español. Ciudadano estadounidense. Disponible para roles presenciales, remotos o híbridos.',
      'about.certsLabel': 'Credenciales y Certificaciones',
      'about.v1title':   'Resultados Primero',
      'about.v1desc':    'Cada iniciativa que lidero está vinculada a resultados de negocio medibles: reducción de costos, mejoras en eficiencia y avances reales en capacidades.',
      'about.v2title':   'Mentalidad de Alianza',
      'about.v2desc':    'Construyo confianza en todos los niveles organizacionales, desde el piso de producción hasta la sala de directivos, asegurando que la tecnología sirva a las personas y no al revés.',
      'about.v3title':   'Mejora Continua',
      'about.v3desc':    'Formado en metodología Six Sigma, identifico sistemáticamente ineficiencias e implemento mejoras sostenibles.',

      'expertise.label': 'Fortalezas Clave',
      'expertise.title': 'Áreas de <span class="accent">Especialidad</span>',
      'expertise.sub':   'Dominio integral de las dimensiones técnicas y de liderazgo que los Directores de TI modernos necesitan para generar valor real de negocio.',

      'exp1.title': 'Liderazgo de TI y Gestión de Equipos',
      'exp1.desc':  'Construir y guiar equipos de TI de alto rendimiento. Mentoría de profesionales, definición de visión y alineación de operaciones diarias con objetivos estratégicos.',
      'exp2.title': 'Integración y Alineación TI/OT',
      'exp2.desc':  'Conectar Tecnología de la Información y Tecnología Operacional en entornos de manufactura y energía. Asegurar que los sistemas hablen el mismo idioma que el negocio.',
      'exp3.title': 'Infraestructura y Operaciones',
      'exp3.desc':  'Gestión integral de infraestructura empresarial: redes, servidores, centros de datos, sistemas de almacenamiento, virtualización (VMware/ESX) y entornos en la nube.',
      'exp4.title': 'Gestión de Relaciones de Negocio',
      'exp4.desc':  'Servir como puente estratégico entre TI y las unidades de negocio. Traducir necesidades organizacionales en hojas de ruta tecnológicas que generen valor tangible.',
      'exp5.title': 'Entrega de Proyectos y Programas',
      'exp5.desc':  'Liderazgo de programas tecnológicos complejos e interfuncionales desde la conceptualización hasta la entrega. Historial consistente de ejecución puntual y dentro del presupuesto.',
      'exp6.title': 'Mejora de Procesos y Six Sigma',
      'exp6.desc':  'Certificado Green Belt en metodología Six Sigma. Identificación sistemática de ineficiencias, implementación de controles y medición de resultados para impulsar mejoras operativas sostenibles.',
      'exp7.title': 'Seguridad de TI y Cumplimiento',
      'exp7.desc':  'Aplicación de políticas de seguridad, gestión de cumplimiento regulatorio (FDA, cGMP) e implementación de marcos de ciberseguridad para proteger activos y datos empresariales críticos.',
      'exp8.title': 'Comunicación Bilingüe',
      'exp8.desc':  'Completamente bilingüe en inglés y español, lo que me permite colaborar eficazmente con equipos globales, partes interesadas multinacionales y comunidades diversas de usuarios en distintas industrias.',

      'impact.label': 'Impacto Seleccionado',
      'impact.title': 'Entregando <span class="accent">Resultados Medibles</span>',
      'impact.sub':   'El impacto habla más que los títulos. Estos son algunos de los resultados que he generado a lo largo de mi carrera.',

      'ic1.title': 'Ahorros mediante Iniciativas TI/OT',
      'ic1.desc':  'Lideré programas estratégicos de integración TI/OT en Luma Energy, identificando e implementando iniciativas que generaron más de $1.2 millones en ahorros, manteniendo la calidad total del proyecto.',
      'ic1.tag':   'Luma Energy · 2024–Presente',
      'ic2.title': 'Aumento en Eficiencia Operacional',
      'ic2.desc':  'Alineé hojas de ruta tecnológicas en 7 departamentos con los objetivos de negocio, logrando un aumento del 15% en eficiencia operacional mediante integración TI/OT estratégica.',
      'ic2.tag':   'Luma Energy',
      'ic3.title': 'Tasa de Entrega Puntual de Proyectos',
      'ic3.desc':  'Supervisé implementaciones tecnológicas en todo el ciclo de vida del proyecto, logrando consistentemente el 95% de los plazos dentro del tiempo y presupuesto acordados.',
      'ic3.tag':   'Luma Energy',
      'ic4.title': 'Ahorros en Infraestructura de Red',
      'ic4.desc':  'Lideré un proyecto de gestión del cambio en infraestructura de red, reemplazando switches L2, APs y controladores inalámbricos, generando $198K en ahorros el primer año y $250K proyectados para el segundo.',
      'ic4.tag':   'Avara Pharmaceutical · 2016–2023',
      'ic5.title': 'Reducción de Tiempo de Inactividad',
      'ic5.desc':  'Identifiqué las causas raíz de problemas recurrentes e implementé soluciones creativas que redujeron el tiempo de inactividad operacional en un 20%, mejorando la continuidad del servicio.',
      'ic5.tag':   'Luma Energy',
      'ic6.title': 'Certificación Six Sigma Obtenida',
      'ic6.desc':  'Obtuve la certificación Green Belt de Six Sigma al implementar un proyecto de monitoreo y gestión de redes que generó $198K en ahorros y contribuyó un 17% hacia la meta de ahorro de la empresa.',
      'ic6.tag':   'Avara Pharmaceutical',

      'xp.label': 'Trayectoria Profesional',
      'xp.title': 'Experiencia <span class="accent">Profesional</span>',

      'contact.label':           'Contacto',
      'contact.title':           'Conectemos <span class="accent">Hoy</span>',
      'contact.sub':             'Ya sea que tenga una oportunidad de liderazgo, una iniciativa estratégica o simplemente desee conectar, estaré encantado de escucharle.',
      'contact.industries':      'Industrias',
      'contact.languages':       'Idiomas',
      'contact.availability':    'Disponibilidad',
      'contact.availabilityVal': 'Abierto a nuevas oportunidades',
      'contact.workstyle':       'Modalidad de Trabajo',
      'contact.workstyleVal':    'Presencial · Remoto · Híbrido',

      'form.name':         'Nombre Completo',
      'form.namePh':       'Su nombre completo',
      'form.subject':      'Asunto',
      'form.subjectPh':    '¿Sobre qué trata su mensaje?',
      'form.message':      'Mensaje',
      'form.messagePh':    'Cuénteme sobre la oportunidad o el motivo de su contacto...',
      'form.submit':       'Enviar Mensaje',
      'form.sending':      'Enviando…',
      'form.successTitle': '¡Mensaje enviado con éxito!',
      'form.successMsg':   'Gracias por comunicarse. Le responderé a la brevedad posible.',
      'form.errorTitle':   'Algo salió mal.',
      'form.errorMsg':     'Por favor intente de nuevo o verifique su conexión.',
      'form.rateLimit':    'Demasiados intentos. Por favor intente más tarde.',

      'footer.rights': 'Todos los derechos reservados.',
      'footer.note':   'Director de TI y Gerente de Relaciones de Negocio · Ciudadano Estadounidense · Bilingüe EN/ES',
    }
  };

  var currentLang = localStorage.getItem('lang') || 'en';

  function applyLang(lang) {
    var t = translations[lang];
    if (!t) return;

    // Translate innerHTML elements
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (t[key] !== undefined) el.setAttribute('placeholder', t[key]);
    });

    // Update html lang attribute
    document.documentElement.lang = lang;

    // Update toggle button label
    var btn = document.getElementById('lang-toggle');
    if (btn) {
      var label = btn.querySelector('.nav__lang-label');
      if (label) label.textContent = lang === 'en' ? 'ES' : 'EN';
      btn.setAttribute('title', lang === 'en' ? 'Cambiar a Español' : 'Switch to English');
    }

    currentLang = lang;
    localStorage.setItem('lang', lang);
  }

  // Wire up toggle button
  document.addEventListener('DOMContentLoaded', function () {
    applyLang(currentLang);

    var btn = document.getElementById('lang-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        applyLang(currentLang === 'en' ? 'es' : 'en');
      });
    }
  });

  // Expose for main.js to use translated strings (e.g. form validation)
  window.i18n = {
    t: function (key) {
      return (translations[currentLang] || translations['en'])[key] || key;
    },
    lang: function () { return currentLang; }
  };
})();
