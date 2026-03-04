const axios = require('axios');
// Monkey patch axios defaults
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const feedid = require('feedid');
const { endpoints } = require('./src/utils/endpoints');

async function testAll() {
    console.log('Testing all endpoints with monkey-patched axios...');
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint.primary}...`);
            const response = await feedid[endpoint.primary].terbaru();
            if (response && response.data && response.data.posts) {
                console.log(`✅ ${endpoint.primary}: Success (${response.data.posts.length} posts)`);
            } else {
                console.log(`⚠️ ${endpoint.primary}: Success but no posts?`, JSON.stringify(response).substring(0, 100));
            }
        } catch (error) {
            console.log(`❌ ${endpoint.primary}: Failed - ${error.message}`);
        }
    }
}

testAll();
