
async function checkBrands() {
    try {
        const res = await fetch('http://localhost:5000/api/v1/brands');
        const data = await res.json();
        console.log('Total Brands:', data.data?.brands?.length || 0);
        if (data.data?.brands?.length > 0) {
            console.log('Sample Brand:', JSON.stringify(data.data.brands[0], null, 2));
        }

        const manRes = await fetch('http://localhost:5000/api/v1/brands?type=manufacturer');
        const manData = await manRes.json();
        console.log('Manufacturer Brands:', manData.data?.brands?.length || 0);
    } catch (e) {
        console.error(e);
    }
}

checkBrands();
