'use strict';
const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

// Middleware order is important: static files first
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'), {
    headers: { 'Content-Type': 'text/html' },
  });
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
    return res.sendFile(path.join(__dirname, 'public', 'failure.html'), {
      headers: { 'Content-Type': 'text/html' },
    });
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
      let parsedData = null;

      try {
        parsedData = JSON.parse(data);
        console.log('Mailchimp API Response:', parsedData);
      } catch (error) {
        console.error(
          'Error parsing Mailchimp response:',
          error,
          'Raw Response:',
          data
        );
      }

      if (response.statusCode === 200) {
        res.sendFile(path.join(__dirname, 'public', 'success.html'), {
          headers: { 'Content-Type': 'text/html' },
        });
      } else {
        console.error(
          'Failed to subscribe:',
          parsedData
            ? parsedData
            : 'Mailchimp Response parsing failed. Raw Response:',
          data
        );
        res.sendFile(path.join(__dirname, 'public', 'failure.html'), {
          headers: { 'Content-Type': 'text/html' },
        });
      }
    });
  });

  request.on('error', err => {
    console.error('API Request Error:', err); // Log the full error object
    res.sendFile(path.join(__dirname, 'public', 'failure.html'), {
      headers: { 'Content-Type': 'text/html' },
    });
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
