# 💰 Cashly - Frontend

> Applicazione web frontend per la gestione delle finanze personali.

Questo repository contiene il frontend di **Cashly**, una piattaforma per tracciare transazioni, abbonamenti e monitorare le spese tramite una dashboard interattiva.

## ⚙️ Tech Stack

- **Framework:** Angular 21
- **Componenti UI:** Angular Material
- **Grafici:** ApexCharts (`ng-apexcharts`)
- **Notifiche:** `ngx-sonner`
- **PWA:** Supporto per Service Worker (`@angular/service-worker`)
- **Routing:** Angular Router
- **HTTP:** Axios proxyato verso il backend .NET

## ✨ Funzionalità

- 📊 **Dashboard:** Panoramica generale del bilancio con grafici interattivi.
- 💸 **Transazioni:** Registrazione, modifica e visualizzazione di entrate e uscite.
- 📁 **Categorie:** Organizzazione personalizzata delle transazioni.
- 🔁 **Abbonamenti:** Tracciamento dei pagamenti ricorrenti e abbonamenti.
- 🔐 **Autenticazione:** Sistema completo di login, registrazione e reset della password.

## 🚀 Setup e Sviluppo Locale

### Prerequisiti

- Node.js (versione 24 raccomandata)
- npm

### Installazione ed esecuzione

1. Clona il repository e installa le dipendenze:

   ```bash
   npm install
   ```

2. Avvia il server di sviluppo locale:
   ```bash
   npm run start
   ```
   L'applicazione sarà accessibile all'indirizzo `http://localhost:3000`.

> **Nota sul Proxy API:** Il file `proxy.conf.json` è configurato per inoltrare tutte le richieste che iniziano con `/cashly-api` al backend in esecuzione su `http://localhost:5248`.

## 📦 Build e Deployment con Docker

L'applicazione include un `Dockerfile` multi-stage ottimizzato per la produzione. Compila l'app Angular tramite Node.js e la serve utilizzando Nginx.

```bash
# Crea l'immagine Docker
docker build -t cashly-frontend .

# Esegui il container
docker run -d -p 80:80 cashly-frontend
```

## 🔗 Progetti Correlati

- [Cashly Backend](https://github.com/roberto-ingenito-home-lab/cashly-backend) — API REST .NET Core
- [Homelab Infrastructure](https://github.com/roberto-ingenito-home-lab/server-raspberry-pi) — Infrastruttura server e deployment Docker
