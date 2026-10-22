# Pruebas de Carga y Concurrencia — Tripu System

Este directorio contiene las suites reproducibles de pruebas de estrés y rendimiento desarrolladas con **k6** para validar la capacidad del sistema ante volúmenes de 100 a 10.000 usuarios virtuales concurrentes.

---

## 1. Requisitos Previos

Instalar **k6** en el entorno local o servidor de pruebas:

* **Windows (vía Winget o Chocolatey):**
  ```powershell
  winget install k6 --source winget
  # o bien:
  choco install k6
  ```
* **macOS (Homebrew):**
  ```bash
  brew install k6
  ```
* **Linux (Debian/Ubuntu):**
  ```bash
  sudo gpg -k
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D34EE24C
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update && sudo apt-get install k6
  ```

---

## 2. Scripts Disponibles

| Script | Propósito | Escenarios de Carga |
| :--- | :--- | :--- |
| **`k6-load-test.js`** | Simula navegación pública real (Portada + Ficha de Viaje con Slugs reales). | Rampa progresiva de 50 a 1.000, 5.000 y 10.000 usuarios concurrentes. |
| **`k6-contact-spike.js`** | Prueba de estrés sobre el endpoint Nitro de mensajería (`/api/contact`). | Ráfaga de hasta 300 peticiones POST concurrentes. |

---

## 3. Modos de Ejecución

### A. Prueba de Humo Local (Smoke Test - 10 VUs / 30s)
Para verificar la conectividad sin saturar:
```bash
k6 run --vus 10 --duration 30s -e TARGET_URL=http://localhost:3000 tests/load/k6-load-test.js
```

### B. Prueba de Carga sobre Staging / Preview Branch (Recomendado)
Para certificar cambios antes de pasar a producción:
```bash
k6 run -e TARGET_URL=https://tu-rama-preview.vercel.app tests/load/k6-load-test.js
```

### C. Prueba de Carga Completa en Producción
```bash
k6 run -e TARGET_URL=https://tripu-producciones.vercel.app tests/load/k6-load-test.js
```

---

## 4. Métricas Clave y Umbrales (SLAs)

| Métrica k6 | Significado | Umbral de Aprobación |
| :--- | :--- | :---: |
| `http_req_duration (p95)` | Latencia percentil 95 de la entrega de página | **< 800 ms** (con SWR: **< 100 ms**) |
| `http_req_duration (p99)` | Latencia percentil 99 | **< 2.500 ms** |
| `failed_requests` | Proporción de respuestas no-200 o caídas | **< 1.0%** |
| `ttfb_custom` | Time to First Byte (tiempo hasta el primer byte del servidor) | **< 300 ms** |

---

## 5. Prevención de Costos y Afectación de Usuarios
1. **No ejecutar pruebas destructivas de escritura masiva en producción:** Utilizar `k6-contact-spike.js` únicamente en entornos de preview o con throttling.
2. **Monitorear el Dashboard de Supabase:** Mantener abierto el panel de Supabase durante la ejecución para verificar el uso de CPU y el conteo de conexiones activas en el pooler.
