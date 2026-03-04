const feedid = require('feedid');
const { endpoints } = require('./src/utils/endpoints');

async function testAll() {
    console.log('Testing all endpoints with feedid...');
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
