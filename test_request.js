const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/suppliers/create',
  method: 'GET',
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let data = '';
  res.on('data', d => {
    data += d;
  });
  res.on('end', () => {
    console.log(data.substring(0, 500)); // Print first 500 chars
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
