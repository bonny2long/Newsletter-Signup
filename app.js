'use strict';
const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotEnv = require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});

app.post('/', (req, res) => {
  const firstName = req.body.fName;
  const lastName = req.body.lName;
  const Email = req.body.email;
  console.log(firstName, lastName, Email);

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

  console.log('Headers:', options.headers);

  const request = https.request(url, options, response => {
    if (response.statusCode === 200) {
      res.sendFile(__dirname + '/success.html');
    } else {
      res.sendFile(__dirname + '/failure.html');
    }
    response.on('data', d => {
      console.log(JSON.parse(d));
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
