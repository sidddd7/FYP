const selfsigned = require('selfsigned');
const fs = require('fs');

const attrs = [{ name: 'commonName', value: '192.168.1.82' }];
const opts = { days: 365 };

selfsigned.generate(attrs, opts, (err, pems) => {
    if (err) {
        console.error('Error generating certificates:', err);
        return;
    }
    fs.writeFileSync('key.pem', pems.private);
    fs.writeFileSync('cert.pem', pems.cert);
    console.log('Certificates generated successfully!');
});