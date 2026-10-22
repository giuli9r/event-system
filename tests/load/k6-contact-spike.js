// ============================================================================
// TRIPU SYSTEM - PRUEBA DE ESTRÉS PARA ENDPOINT DE CONTACTO (/api/contact)
// Valida límites de concurrencia y comportamiento del backend ante ráfagas
// ============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('contact_errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Carga base
    { duration: '1m', target: 100 },   // Ráfaga media
    { duration: '1m', target: 300 },   // Pico de estrés
    { duration: '30s', target: 0 },    // Enfriamiento
  ],
  thresholds: {
    'contact_errors': ['rate<0.05'], // Permitir menos del 5% de errores en estrés
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://tripu-producciones.vercel.app';

export default function () {
  const url = `${BASE_URL}/api/contact`;
  const vuId = __VU;
  const iterId = __ITER;

  const payload = JSON.stringify({
    name: `Test Runner VU${vuId}`,
    email: `test-vu${vuId}-${iterId}@tripu-loadtest.com`,
    phone: '3564123456',
    selected_event: 'Milo J - Estadio Mario Alberto Kempes',
    message: 'Mensaje sintético automatizado de prueba de carga y concurrencia k6.',
    honeypot: '' // Campo vacío para comportamiento humano legítimo
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  const success = check(res, {
    'Contact status 200': (r) => r.status === 200,
    'Contact success true': (r) => {
      try {
        return JSON.parse(r.body).success === true;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
  sleep(Math.random() * 3 + 2);
}
