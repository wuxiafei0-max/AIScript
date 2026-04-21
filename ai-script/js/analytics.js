export const analytics = {
  pageViews: 0,
  generateClicks: 0,
  track(event) {
    if (event === 'pageview') this.pageViews++;
    if (event === 'generate_click') this.generateClicks++;
    // fetch('/api/analytics', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event, ts: Date.now() }) });
    console.log('[Hookly Analytics]', event, this);
  }
};

analytics.track('pageview');
