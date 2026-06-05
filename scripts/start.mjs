import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');
const port = Number.parseInt(process.env.PORT || '3000', 10);

const app = express();

function registerProxy(prefix, target, options = {}) {
  app.use(
    prefix,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${prefix}`]: '' },
      ...options,
    })
  );
}

registerProxy('/api/yahoo', 'https://query1.finance.yahoo.com');
registerProxy('/api/coingecko', 'https://api.coingecko.com');
registerProxy('/api/polymarket', 'https://gamma-api.polymarket.com', { secure: false });
registerProxy('/api/earthquake', 'https://earthquake.usgs.gov');

registerProxy('/rss/bbc', 'https://feeds.bbci.co.uk');
registerProxy('/rss/guardian', 'https://www.theguardian.com');
registerProxy('/rss/npr', 'https://feeds.npr.org');
registerProxy('/rss/reuters', 'https://www.reutersagency.com');
registerProxy('/rss/aljazeera', 'https://www.aljazeera.com');
registerProxy('/rss/cnn', 'https://rss.cnn.com');
registerProxy('/rss/hn', 'https://hnrss.org');
registerProxy('/rss/arstechnica', 'https://feeds.arstechnica.com');
registerProxy('/rss/verge', 'https://www.theverge.com');
registerProxy('/rss/cnbc', 'https://www.cnbc.com');
registerProxy('/rss/marketwatch', 'https://feeds.marketwatch.com');
registerProxy('/rss/defenseone', 'https://www.defenseone.com');
registerProxy('/rss/warontherocks', 'https://warontherocks.com');
registerProxy('/rss/breakingdefense', 'https://breakingdefense.com');
registerProxy('/rss/bellingcat', 'https://www.bellingcat.com');
registerProxy('/rss/techcrunch', 'https://techcrunch.com');
registerProxy('/rss/googlenews', 'https://news.google.com');
registerProxy('/rss/openai', 'https://openai.com');
registerProxy('/rss/anthropic', 'https://www.anthropic.com');
registerProxy('/rss/googleai', 'https://blog.google');
registerProxy('/rss/deepmind', 'https://deepmind.google');
registerProxy('/rss/huggingface', 'https://huggingface.co');
registerProxy('/rss/techreview', 'https://www.technologyreview.com');
registerProxy('/rss/arxiv', 'https://rss.arxiv.org');
registerProxy('/rss/whitehouse', 'https://www.whitehouse.gov');
registerProxy('/rss/statedept', 'https://www.state.gov');
registerProxy('/rss/fedreserve', 'https://www.federalreserve.gov');
registerProxy('/rss/sec', 'https://www.sec.gov');
registerProxy('/rss/treasury', 'https://home.treasury.gov');
registerProxy('/rss/cisa', 'https://www.cisa.gov');
registerProxy('/rss/brookings', 'https://www.brookings.edu');
registerProxy('/rss/cfr', 'https://www.cfr.org');
registerProxy('/rss/csis', 'https://www.csis.org');
registerProxy('/rss/warzone', 'https://www.thedrive.com');
registerProxy('/rss/defensegov', 'https://www.defense.gov');
registerProxy('/rss/krebs', 'https://krebsonsecurity.com');
registerProxy('/rss/yahoonews', 'https://finance.yahoo.com');
registerProxy('/rss/diplomat', 'https://thediplomat.com');

app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`WorldFeed server running on 0.0.0.0:${port}`);
});
