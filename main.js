// 21 · Fiesta de disfraces
// Cambia aquí los datos de la fiesta. Los textos visibles están en index.html.
const FIESTA = {
  inicio: '2026-11-01T17:00:00',          // fecha y hora de inicio (hora local)
  fin: '2026-11-02T01:00:00',             // fecha y hora de cierre
  lugar: 'Restaurant El Manantial del Castillo',
  coordenadas: '-17.4023805,-66.0514166', // el punto exacto en Google Maps
  whatsapp: '59163916139',                // número con código de país, solo dígitos
  // La lista de invitados: pega aquí la URL de tu Google Apps Script (ver confirmaciones.gs).
  // Mientras esté vacía, "Confirmar asistencia" abre WhatsApp.
  lista: 'https://script.google.com/macros/s/AKfycbwUmnVN6sLJum5Wbi_y2bydAB6KPRDDaWyNGLR0LdeXdHcaR4tB_ElRmrzVdemnfLVn/exec',
};

// Mapas: el mapa, "Abrir en Google Maps" y "Llévame desde donde estoy" apuntan al mismo lugar.
(() => {
  const at = encodeURIComponent(FIESTA.coordenadas);
  document.querySelectorAll('[data-maps="open"]').forEach((a) => { a.href = `https://www.google.com/maps/search/?api=1&query=${at}`; });
  document.querySelectorAll('[data-maps="dir"]').forEach((a) => { a.href = `https://www.google.com/maps/dir/?api=1&destination=${at}`; });
  document.querySelectorAll('[data-maps="embed"]').forEach((f) => { f.dataset.src = `https://www.google.com/maps?q=${at}&z=15&output=embed`; });
})();

// Cuenta regresiva en la barra superior.
(() => {
  const out = document.querySelector('[data-countdown]');
  if (!out) return;
  const start = new Date(FIESTA.inicio).getTime();
  const end = new Date(FIESTA.fin).getTime();
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const now = Date.now();
    if (now >= end) { out.textContent = 'Gracias por venir'; return; }
    if (now >= start) { out.textContent = 'Ya empezó, ven ya'; return; }
    const s = Math.floor((start - now) / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    out.textContent = `Faltan ${d} d ${pad(h)} h ${pad(m)} min`;
  };
  tick();
  setInterval(tick, 15000);
})();

// La lista "Ya vienen": se lee de la misma hoja de Google; si no responde, la sección no aparece.
const guests = (() => {
  const section = document.querySelector('[data-guests]');
  if (!section || !FIESTA.lista) return null;
  const list = section.querySelector('[data-guests-list]');
  const count = section.querySelector('[data-guests-count]');
  const unit = section.querySelector('[data-guests-unit]');
  const empty = section.querySelector('[data-guests-empty]');
  const more = section.querySelector('[data-guests-more]');
  const link = document.querySelector('[data-guests-link]');
  const first = matchMedia('(max-width: 40em)').matches ? 10 : 24; // el resto se abre con un botón
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const same = (a, b) => a.nombre.trim().toLowerCase() === b.nombre.trim().toLowerCase();
  const people = (g) => (g.con ? 2 : 1);
  let data = null;
  let open = false;
  let current = 0;
  let seen = !('IntersectionObserver' in window);

  // El número sube hasta el total la primera vez que se ve, y otra vez cuando alguien se suma.
  const show = (n) => {
    if (calm.matches || !seen) { current = n; count.textContent = n; return; }
    const from = current;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 900);
      count.textContent = Math.round(from + (n - from) * (1 - (1 - k) ** 3));
      if (k < 1) requestAnimationFrame(step);
    };
    current = n;
    requestAnimationFrame(step);
  };

  const item = (g, i) => {
    const li = document.createElement('li');
    li.className = 'guest';
    li.style.setProperty('--d', i % 8);
    const name = document.createElement('span');
    name.className = 'guest-name';
    name.textContent = g.nombre;
    const what = document.createElement('span');
    what.className = 'guest-costume';
    what.textContent = `Viene de ${g.disfraz || 'sorpresa'}${g.con ? ', con acompañante' : ''}`;
    li.append(name, what);
    return li;
  };

  const render = () => {
    const all = data.invitados;
    list.replaceChildren(...(open ? all : all.slice(0, first)).map(item));
    empty.hidden = all.length > 0;
    more.hidden = open || all.length <= first;
    more.textContent = `Ver la lista completa (${all.length})`;
    unit.textContent = data.personas === 1 ? 'disfrazado confirmado' : 'disfrazados confirmados';
    show(data.personas);
  };

  more.addEventListener('click', () => {
    open = true;
    render();
    const next = list.children[first];
    if (next) { next.tabIndex = -1; next.focus({ preventScroll: true }); }
  });

  if (!seen) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      seen = true;
      const n = current;
      current = 0;
      show(n);
    }, { threshold: 0.4 });
    io.observe(count);
  }

  fetch(FIESTA.lista)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((d) => {
      if (!d || !Array.isArray(d.invitados)) return;
      const invitados = d.invitados.filter((g) => g && typeof g.nombre === 'string' && g.nombre.trim());
      data = { invitados, personas: invitados.reduce((n, g) => n + people(g), 0) };
      section.hidden = false;
      if (link) link.hidden = false;
      render();
    })
    .catch(() => {});

  // Quien acaba de confirmar aparece arriba de la lista sin recargar la página.
  return {
    add(g) {
      if (!data) return;
      data.invitados = [g, ...data.invitados.filter((x) => !same(x, g))];
      data.personas = data.invitados.reduce((n, x) => n + people(x), 0);
      render();
    },
  };
})();

// El pase de entrada: escribe tu nombre y tu disfraz; al confirmar quedas en la lista de invitados.
(() => {
  const form = document.getElementById('pass-form');
  if (!form) return;
  const { nombre: name, disfraz: costume, acompanante: plus } = form.elements;
  const pass = document.querySelector('.pass');
  const outName = document.querySelector('[data-pass="name"]');
  const outCostume = document.querySelector('[data-pass="costume"]');
  const wa = document.querySelector('[data-confirm="whatsapp"]');
  const send = document.querySelector('button[form="pass-form"]');
  const status = document.querySelector('[data-status]');
  let bump;

  const message = () => {
    const extra = plus.value.trim() ? ` Voy con ${plus.value.trim()}.` : '';
    return `Hola, confirmo para la fiesta 21 del domingo 1 de noviembre en El Manantial del Castillo. Soy ${name.value.trim() || '(mi nombre)'} y voy disfrazado de ${costume.value.trim() || '(mi disfraz)'}.${extra}`;
  };

  const update = () => {
    outName.textContent = name.value.trim() || 'Tu nombre';
    outCostume.textContent = costume.value.trim() || 'tu disfraz';
    wa.href = `https://wa.me/${FIESTA.whatsapp}?text=${encodeURIComponent(message())}`;
    pass.classList.add('is-bumped');
    clearTimeout(bump);
    bump = setTimeout(() => pass.classList.remove('is-bumped'), 160);
  };

  form.addEventListener('input', () => { update(); status.textContent = ''; });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!name.value.trim()) { status.textContent = 'Escribe tu nombre.'; name.focus(); return; }
    if (!costume.value.trim()) { status.textContent = 'Sin disfraz no se entra: cuéntanos de qué vienes.'; costume.focus(); return; }
    if (!FIESTA.lista) { window.open(wa.href, '_blank', 'noopener'); return; }
    send.disabled = true;
    status.textContent = 'Enviando…';
    try {
      // Google Apps Script no responde a otros dominios: se envía sin leer la respuesta.
      await fetch(FIESTA.lista, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ nombre: name.value.trim(), disfraz: costume.value.trim(), acompanante: plus.value.trim() }) });
      status.textContent = `Listo, ${name.value.trim()}: estás en la lista. Guarda una captura de tu pase.`;
      guests?.add({ nombre: name.value.trim(), disfraz: costume.value.trim(), con: plus.value.trim() !== '' });
    } catch {
      status.textContent = 'No se pudo enviar. Prueba otra vez o avísanos por WhatsApp.';
    } finally {
      send.disabled = false;
    }
  });
  update();
  pass.classList.remove('is-bumped');
})();

// El mapa en vivo: solo se pide si Google responde; si no hay conexión queda el dibujo con los enlaces.
(() => {
  const map = document.querySelector('[data-maps="embed"]');
  if (!map) return;
  const load = () => {
    const probe = new Image();
    probe.onload = () => {
      map.addEventListener('load', () => map.classList.add('is-loaded'), { once: true });
      map.src = map.dataset.src;
    };
    probe.src = `https://www.google.com/favicon.ico?${Date.now()}`;
  };
  if (!('IntersectionObserver' in window)) { load(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); load(); }
  }, { rootMargin: '600px 0px' });
  io.observe(map);
})();

// Entradas: cada parte aparece una vez al entrar en pantalla; nada queda oculto si algo falla.
(() => {
  const targets = document.querySelectorAll('[data-reveal], .door');
  document.querySelectorAll('.rows li').forEach((li, i) => li.style.setProperty('--d', i));
  document.querySelectorAll('.faq-row').forEach((row) => row.style.setProperty('--d', 1));
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
  window.addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2500));
})();
