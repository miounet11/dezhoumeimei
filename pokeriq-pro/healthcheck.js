const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 8820,
  path: '/api/health',
  timeout: 3000,
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode == 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', function(err) {
  console.log('ERROR:', err);
  process.exit(1);
});

request.end();