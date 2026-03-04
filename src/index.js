require('dotenv').config();
const app = require('express')();
const cors = require('cors');
const { endpoints, endpointsOverview } = require('./utils/endpoints');
const feedid = require('feedid');
const axios = require('axios');

// Globally apply User-Agent to axios used by feedid
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate=59');
  next();
});

app.get('/all', async (req, res) => {
  try {
    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          const response = await feedid[endpoint.primary].terbaru();
          return { name: endpoint.primary, ...response };
        } catch (error) {
          return null;
        }
      })
    );

    const filteredResults = results.filter((result) => result !== null);

    return res.send({
      data: filteredResults,
      message: 'All latest news fetched successfully',
      success: true,
    });
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'Failed to fetch all news',
      success: false,
    });
  }
});

endpoints.forEach((endpoint) => {
  app.get(`/${endpoint.primary}/:category`, async (req, res) => {
    const { category } = req.params;

    try {
      const response = await feedid[endpoint.primary][category]();
      return res.send(response);
    } catch (error) {
      return res
        .status(404)
        .send({ data: null, message: 'Not found', success: false });
    }
  });
});

app.get('/', (req, res) => {
  return res.send({
    maintainer: 'R.M Reza',
    github: 'https://github.com/renomureza/api-berita-indonesia',
    endpoints: endpointsOverview,
  });
});

app.all('*', (req, res) => {
  return res
    .status(404)
    .send({ data: null, message: 'Not found', success: false });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
