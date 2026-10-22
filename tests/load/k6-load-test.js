// ============================================================================
// TRIPU SYSTEM - SUITE DE PRUEBAS DE CARGA Y CONCURRENCIA CON K6
// Simula navegación real de 100 a 10.000 usuarios virtuales (VUs)
// ============================================================================

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métricas personalizadas
const failureRate = new Rate('failed_requests');
const ttfbTrend = new Trend('ttfb_custom');
const homeDurationTrend = new Trend('home_duration');
const detailDurationTrend = new Trend('detail_duration');

export const options = {
  // Configuración de etapas de carga (Ramp-up progresivo hacia los 4 escenarios de la auditoría)
  stages: [
    { duration: '30s', target: 50 },     // Calentamiento inicial
    { duration: '1m', target: 200 },     // Carga baja
    { duration: '2m', target: 1000 },    // Escenario A: 1.000 usuarios concurrentes
    { duration: '3m', target: 1000 },    // Sostenido a 1.000 usuarios
    { duration: '2m', target: 5000 },    // Escenario B: Rampa a 5.000 usuarios
    { duration: '2m', target: 5000 },    // Sostenido a 5.000 usuarios
    { duration: '1m', target: 10000 },   // Escenario C: Pico a 10.000 usuarios
    { duration: '1m', target: 0 },       // Enfriamiento controlado
  ],

  // Umbrales de calidad técnica (SLA)
  thresholds: {
    'http_req_duration': ['p(95)<800', 'p(99)<2500'], // 95% de peticiones bajo 800ms
    'failed_requests': ['rate<0.01'],                  // Tasa de fallos menor al 1%
    'http_req_failed': ['rate<0.01'],
  },
};

// Configuración de entorno
const BASE_URL = __ENV.TARGET_URL || 'https://tripu-producciones.vercel.app';

// Slugs de recitales reales descubiertos en sitemap.xml
const EVENT_SLUGS = [
  'milo-j-mario-alberto-kempes-2026-12-05',
  'red-hot-chilli-peppers-estadio-river-plate-2026-12-22'
];

export default function () {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Tripu-LoadTest/1.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-AR,es;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
  };

  // --------------------------------------------------------------------------
  // FLUJO 1: Acceso a la Portada Pública (Descubrimiento y Cartelera)
  // --------------------------------------------------------------------------
  group('01_Home_Page', function () {
    const start = new Date();
    const res = http.get(`${BASE_URL}/`, { headers });
    const duration = new Date() - start;

    homeDurationTrend.add(duration);
    ttfbTrend.add(res.timings.waiting);

    const success = check(res, {
      'Home: status 200': (r) => r.status === 200,
      'Home: contenido presente': (r) => r.body.includes('PRÓXIMOS RECITALES') || r.body.includes('Tripu Producciones'),
      'Home: cache header': (r) => r.headers['X-Vercel-Cache'] !== undefined || r.headers['Server'] !== undefined,
    });

    failureRate.add(!success);
  });

  // Think time realista: el usuario explora afiches (5 a 12 segundos)
  sleep(Math.random() * 7 + 5);

  // --------------------------------------------------------------------------
  // FLUJO 2: Exploración de Ficha Detallada de Show (Venta y Tarifas)
  // --------------------------------------------------------------------------
  group('02_Event_Detail', function () {
    const slug = EVENT_SLUGS[Math.floor(Math.random() * EVENT_SLUGS.length)];
    const start = new Date();
    const res = http.get(`${BASE_URL}/viajes/${slug}`, { headers });
    const duration = new Date() - start;

    detailDurationTrend.add(duration);

    const success = check(res, {
      'Detail: status 200': (r) => r.status === 200,
      'Detail: show cargado': (r) => r.body.includes('Salida Confirmada') || r.body.includes('Salida Completa') || r.body.includes('Volver a la cartelera'),
    });

    failureRate.add(!success);
  });

  // Think time: lectura de itinerario y tarifas antes de consultar por WhatsApp
  sleep(Math.random() * 8 + 6);
}
