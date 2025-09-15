const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const config = {
  SITE_URL: isLocal ? 'http://localhost:8080' : `https://${window.location.hostname}`,
};

export default config;