const BASE_URL = 'http://localhost:5000/api/v1';

async function test() {
  try {
    console.error('Logging in...');
    const loginRes = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@spareparts.com',
        password: 'Admin@123',
      }),
    });

    if (!loginRes.ok) {
      const err = await loginRes.text();
      throw new Error(`Login failed: ${loginRes.status} ${err}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken || loginData.token;
    console.error('Login successful. Token obtained.');

    console.error('Fetching salesmen...');
    const salesmenRes = await fetch(`${BASE_URL}/users/admin?role=salesman`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!salesmenRes.ok) {
      throw new Error(`Fetch salesmen failed: ${salesmenRes.status}`);
    }

    const salesmenData = await salesmenRes.json();
    const salesmen = salesmenData.data?.items || salesmenData.data || [];
    console.error(`Found ${salesmen.length} salesmen.`);

    if (salesmen.length === 0) {
      console.error('No salesmen found. Cannot test specific salesman stats.');
      // Try to fetch stats with current user (admin) just to check endpoint
      console.error('Fetching dashboard stats for Admin (should be global)...');
      const statsRes = await fetch(`${BASE_URL}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const stats = await statsRes.json();
      console.error(
        'Admin Dashboard Stats:',
        JSON.stringify(stats.data, null, 2),
      );
      return;
    }

    const salesmanId = salesmen[0]._id || salesmen[0].id;
    console.error(`Testing with Salesman ID: ${salesmanId}`);

    console.error('Fetching dashboard stats for salesman...');
    const statsRes = await fetch(
      `${BASE_URL}/analytics/dashboard?salesmanId=${salesmanId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!statsRes.ok) {
      throw new Error(`Fetch stats failed: ${statsRes.status}`);
    }

    const stats = await statsRes.json();
    console.error(
      'Salesman Dashboard Stats:',
      JSON.stringify(stats.data, null, 2),
    );

    console.error('Fetching revenue chart for salesman...');
    const chartRes = await fetch(
      `${BASE_URL}/analytics/dashboard/chart?salesmanId=${salesmanId}&range=month`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const chart = await chartRes.json();
    console.error(
      'Salesman Chart Data:',
      JSON.stringify(chart.data, null, 2).substring(0, 200) + '...',
    );
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
