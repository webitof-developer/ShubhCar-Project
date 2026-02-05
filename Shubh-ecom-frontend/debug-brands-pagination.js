
async function debugBrands() {
    try {
        const url = 'http://localhost:5000/api/v1/brands?type=manufacturer&status=active&page=1&limit=10';
        console.log('Fetching:', url);
        const res = await fetch(url);
        const json = await res.json();

        console.log('Response status:', res.status);
        if (json.data && json.data.brands) {
            console.log('Brands count:', json.data.brands.length);
            console.log('Total count:', json.data.total);
            console.log('First brand:', json.data.brands[0]?.name);
        } else {
            console.log('Unexpected structure:', JSON.stringify(json, null, 2));
        }

    } catch (e) {
        console.error(e);
    }
}

debugBrands();
