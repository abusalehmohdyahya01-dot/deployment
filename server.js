// server.js - Final Fix with Username and Password

const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// ************************************************************
// *** YOUR CLOUDANT CREDENTIALS AND NETLIFY URL (FILLED IN) ***

const CLOUDANT_URL = 'https://d581adba-6d80-45ed-a2f0-3232797f04bc-bluemix.cloudantnosqldb.appdomain.cloud';
const CLOUDANT_API_KEY = 'bQ_Gsp1MtuAkxEgYWO-e9bDLmy88ez_ogkK0kqIro2at';
const NETLIFY_DOMAIN = 'https://rainbow-symiki-47fdbdb.netlify.app';

// *** NEW: Add your Cloudant Username here ***
const CLOUDANT_USERNAME = 'd581adba-6d80-45ed-a2f0-3232797f04bc-bluemix'; 

// ************************************************************

const DB_NAME = 'campus-locations';
const DOC_ID = 'locations-list';
const CLOUDANT_ENDPOINT = `${CLOUDANT_URL}/${DB_NAME}/${DOC_ID}`;

// Set up the proxy to only accept requests from your Netlify domain
app.use(express.json());

// Proxy endpoint for Netlify to call
app.get('/api/locations', async (req, res) => {
    const origin = req.headers.origin;
    if (origin === NETLIFY_DOMAIN || process.env.NODE_ENV !== 'production') {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'null');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
        // --- AUTH FIX: Use Username and API Key for Basic Auth ---
        // This is the standard Basic Auth required for "unauthorized" errors
        const authHeader = 'Basic ' + Buffer.from(`${CLOUDANT_USERNAME}:${CLOUDANT_API_KEY}`).toString('base64');
        // --- END AUTH FIX ---

        // Forward the request to Cloudant
        const cloudantResponse = await fetch(CLOUDANT_ENDPOINT, {
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json'
            }
        });

        if (!cloudantResponse.ok) {
            console.error('Cloudant Authentication/API Error:', cloudantResponse.statusText);
            // Re-throw with status code for easier debugging
            throw new Error(`DB Error: ${cloudantResponse.status}`); 
        }

        const data = await cloudantResponse.json();
        res.status(200).json(data.locations);

    } catch (error) {
        console.error('Proxy Execution Error:', error.message);
        res.status(500).json({ error: 'Failed to retrieve location data via proxy.' });
    }
});

app.options('/api/locations', (req, res) => {
    res.send(200);
});

app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});