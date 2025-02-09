'use strict';
const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const path = require('path'); // Importing path module for resolving file paths
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

app.use(express.static(path.join(__dirname, 'public'))); // Corrected path handling for static files
app.use('/public', express.static(path.join(__dirname, 'public'))); // Static files route

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html')); // Corrected path to serve signup.html
});

app.post('/', (req, res) => {
  const firstName = req.body.fName;
  const lastName = req.body.lName;
  const Email = req.body.email;
  console.log('Form data:', firstName, lastName, Email);

  const data = {
    members: [
      {
        email_address: Email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
      },
    ],
  };

  const jsonData = JSON.stringify(data);

  const url = 'https://us10.api.mailchimp.com/3.0/lists/0ad809e044';

  const apiKey = process.env.MAILCHIMP_API_KEY;
  if (!apiKey) {
    console.error('Mailchimp API Key is missing!');
    res.sendFile(path.join(__dirname, 'public', 'failure.html')); // Handle missing API Key
    return;
  }

  console.log('API Key:', apiKey);

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from('anystring:' + apiKey).toString(
        'base64'
      )}`,
      'Content-Type': 'application/json',
    },
  };

  const request = https.request(url, options, response => {
    let data = '';

    response.on('data', chunk => {
      data += chunk;
    });

    response.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        console.log('Mailchimp API Response:', parsedData);
      } catch (error) {
        console.error('Error parsing Mailchimp response:', error);
      }

      if (response.statusCode === 200) {
        res.sendFile(path.join(__dirname, 'public', 'success.html')); // Serve success page
      } else {
        console.error('Failed to subscribe:', parsedData); // Log failure response
        res.sendFile(path.join(__dirname, 'public', 'failure.html')); // Serve failure page
      }
    });
  });

  request.on('error', err => {
    console.error('API Request Error:', err);
    res.sendFile(path.join(__dirname, 'public', 'failure.html')); // Handle API request errors
  });

  request.write(jsonData);
  request.end();
});

app.post('/failure', (req, res) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
