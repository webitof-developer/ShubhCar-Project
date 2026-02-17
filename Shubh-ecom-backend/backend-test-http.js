const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body));
          } else {
            reject(
              new Error(
                `Request failed. Status: ${res.statusCode} Body: ${body}`,
              ),
            );
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test() {
  try {
    console.log('Logging in...');
    const loginData = JSON.stringify({
      email: 'admin@spareparts.com',
      password: 'Admin@123',
    });

    const loginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/users/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': loginData.length,
        },
      },
      loginData,
    );

    const token = loginRes.data?.accessToken || loginRes.token;
    console.log('Login successful. Token obtained.');

    if (!token) throw new Error('No token found in login response');

    console.log('Fetching salesmen...');
    const salesmenRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/users/admin?role=salesman',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const salesmen = salesmenRes.data?.items || salesmenRes.data || [];
    console.log(`Found ${salesmen.length} salesmen.`);

    // Find a salesman to test with, or just test dashboard stats without filter if none
    let salesmanId = null;
    if (salesmen.length > 0) {
      salesmanId = salesmen[0]._id || salesmen[0].id;
      console.log(`Testing with Salesman ID: ${salesmanId}`);
    } else {
      console.log(
        'No salesmen found. Testing admin dashboard stats without filter.',
      );
    }

    const statsPath = `/api/v1/analytics/dashboard${salesmanId ? `?salesmanId=${salesmanId}` : ''}`;
    console.log(`Fetching stats from ${statsPath}...`);

    const statsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: statsPath,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('Dashboard Stats:', JSON.stringify(statsRes.data, null, 2));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

test();
