// config.js — dónde vive el API. Cargar primero, en el <head> de cada página.
// Vacío = mismo origen (server local, o backend sirviendo el frontend).
// En hosting estático (GitHub Pages, etc.) poner la URL del backend, ej: 'https://ragraph-xxxx.run.app'.
window.RAGRAPH_API = 'https://ragraph-api-719897495102.us-central1.run.app';
window.apiUrl = path => window.RAGRAPH_API + path;
