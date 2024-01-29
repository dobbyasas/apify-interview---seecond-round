function parsePrice(priceStr) {
    return parseFloat(priceStr.substring(1));
}

async function fetchWithRetry(url, maxRetries = 3, initialRetryDelay = 1000) {
    let lastError;
    let retryDelay = initialRetryDelay;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status >= 500 && response.status <= 600) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return await response.json();
            }

            return await response.json();
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${i + 1} failed: ${error.message}`);
            
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 2;
            }
        }
    }

    throw lastError;
}

async function fetchAndProcessData() {
    const url = 'https://api.apify.com/v2/datasets/VuFwckCdhVhoLJJ08/items?clean=true&format=json';

    try {
        const offers = await fetchWithRetry(url);
        const cheapestOffers = {};
    
        offers.forEach(offer => {
            const numericPrice = parsePrice(offer.price);
    
            if (!cheapestOffers[offer.productId] || parsePrice(cheapestOffers[offer.productId].price) > numericPrice) {
                cheapestOffers[offer.productId] = offer;
            }
        });
    
        return Object.values(cheapestOffers);
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return [];
    }
}

fetchAndProcessData().then(cheapestOffers => {
    console.log(cheapestOffers);
});
