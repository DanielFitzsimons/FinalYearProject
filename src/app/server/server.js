const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Import CORS package

const app = express();
const port = 3000; // Choose a port for your server

app.use(cors()); // Use the CORS package
app.use(express.json());
app.use(express.json());



app.put('/google-fit-api/sessions/:sessionId', async (req, res) => {
    // Correctly extract the sessionId from the request parameters first
    const sessionId = req.params.sessionId;

    // Now you can safely log the sessionId
    console.log('Session ID:', sessionId);

    const googleFitApiUrl = `https://www.googleapis.com/fitness/v1/users/me/sessions/${sessionId}`;

    // You can also log the entire URL to make sure it is correct
    console.log('Google Fit API URL:', googleFitApiUrl);
    console.log('Request body:', req.body);

    try {
        const response = await fetch(googleFitApiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': req.headers.authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Response data:', data);
            res.json(data);
        } else {
            const errorBody = await response.text();
            console.error('Google Fit API responded with an error:', response.status, errorBody);
            res.status(response.status).json({ error: errorBody });
        }
    } catch (error) {
        console.error('Error when calling Google Fit API:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.get('/google-fit-api/heart-rate', async (req, res) => {
    const startTimeMillis = req.query.startTime;
    const endTimeMillis = req.query.endTime;
    const accessToken = req.headers.authorization; // You would get the access token from the request headers

    const requestBody = {
        aggregateBy: [{
            dataTypeName: "com.google.heart_rate.bpm",
            dataSourceId: "derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm"
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startTimeMillis,
        endTimeMillis: endTimeMillis
    };

    try {
        const googleFitResponse = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
            method: 'POST',
            headers: {
                'Authorization': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (googleFitResponse.ok) {
            const data = await googleFitResponse.json();
            res.json(data);
        } else {
            res.status(googleFitResponse.status).send('Error fetching data from Google Fit API');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});





app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
});
