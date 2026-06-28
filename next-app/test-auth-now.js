#!/usr/bin/env node

// Immediate Authentication Test
// Quick test script to verify authentication with production API

const https = require('https');

const config = {
  hostname: 'jeval.otepc.go.th',
  path: '/api/auth/local',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json',
    'User-Agent': 'JEVAL-Auth-Test/1.0'
  }
};

const credentials = {
  identifier: 'test@example.com',
  password: 'password123'
};

console.log('🧪 JEVAL Authentication Test');
console.log('============================');
console.log('🌐 Testing:', `https://${config.hostname}${config.path}`);
console.log('👤 User:', credentials.identifier);
console.log('⏰ Time:', new Date().toISOString());
console.log('');

const startTime = Date.now();

const req = https.request(config, (res) => {
  const endTime = Date.now();
  const responseTime = endTime - startTime;

  console.log(`📊 Response Time: ${responseTime}ms`);
  console.log(`📈 Status Code: ${res.statusCode}`);
  console.log(`📋 Content Type: ${res.headers['content-type']}`);
  console.log('');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log('✅ AUTHENTICATION SUCCESSFUL!');
        console.log('');
        console.log('🔑 JWT Token:');
        console.log('   Length:', response.jwt ? response.jwt.length : 'Not provided');
        console.log('   Present:', response.jwt ? 'Yes' : 'No');

        if (response.jwt) {
          console.log('   Preview:', response.jwt.substring(0, 50) + '...');
        }

        console.log('');
        console.log('👤 User Information:');
        if (response.user) {
          console.log('   ID:', response.user.id);
          console.log('   Email:', response.user.email);
          console.log('   Username:', response.user.username || 'Not provided');

          if (response.user.role) {
            console.log('   Role:', response.user.role.name || response.user.role);
          }

          if (response.user.confirmed !== undefined) {
            console.log('   Confirmed:', response.user.confirmed);
          }

          if (response.user.blocked !== undefined) {
            console.log('   Blocked:', response.user.blocked);
          }
        }

        console.log('');
        console.log('🎉 All checks passed! Your authentication is working correctly.');

        // Test protected endpoint
        if (response.jwt) {
          testProtectedEndpoint(response.jwt);
        }

      } else {
        console.log('❌ AUTHENTICATION FAILED!');
        console.log('');
        console.log('📋 Error Details:');

        if (response.error) {
          console.log('   Message:', response.error.message || response.error);

          if (response.error.details) {
            console.log('   Details:', JSON.stringify(response.error.details, null, 2));
          }
        } else {
          console.log('   Raw response:', data);
        }

        console.log('');
        console.log('🔍 Troubleshooting:');
        console.log('   - Verify username and password are correct');
        console.log('   - Check if user account is active in Strapi');
        console.log('   - Ensure user has proper permissions');
        console.log('   - Check Strapi authentication settings');
      }

    } catch (error) {
      console.log('❌ RESPONSE PARSING ERROR!');
      console.log('');
      console.log('📋 Error:', error.message);
      console.log('📋 Raw Response:', data);
    }
  });
});

// Test protected endpoint
function testProtectedEndpoint(token) {
  console.log('🔒 Testing Protected Endpoint...');
  console.log('');

  const protectedConfig = {
    hostname: 'jeval.otepc.go.th',
    path: '/api/users/me',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'User-Agent': 'JEVAL-Auth-Test/1.0'
    }
  };

  const protectedReq = https.request(protectedConfig, (res) => {
    console.log(`📈 Protected endpoint status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const userData = JSON.parse(data);
          console.log('✅ Protected endpoint accessible');
          console.log('👤 User data retrieved successfully');
          console.log('   ID:', userData.id);
          console.log('   Email:', userData.email);
        } catch (error) {
          console.log('✅ Protected endpoint accessible (parsing error)');
        }
      } else {
        console.log('❌ Protected endpoint failed');
        console.log('📋 Response:', data);
      }
      console.log('');
      console.log('🏁 Test completed!');
    });
  });

  protectedReq.on('error', (error) => {
    console.log('❌ Protected endpoint error:', error.message);
  });

  protectedReq.end();
}

req.on('error', (error) => {
  console.log('❌ CONNECTION ERROR!');
  console.log('');
  console.log('📋 Error:', error.message);
  console.log('📋 Code:', error.code);
  console.log('');

  if (error.code === 'ENOTFOUND') {
    console.log('🌐 Network troubleshooting:');
    console.log('   - Check internet connection');
    console.log('   - Verify domain name is correct');
    console.log('   - Try: ping jeval.otepc.go.th');
  } else if (error.code === 'ECONNREFUSED') {
    console.log('🔒 Connection troubleshooting:');
    console.log('   - Server may be down');
    console.log('   - Check firewall settings');
    console.log('   - Verify port 443 is open');
  } else if (error.code === 'CERT_HAS_EXPIRED') {
    console.log('🔐 SSL Certificate troubleshooting:');
    console.log('   - SSL certificate has expired');
    console.log('   - Contact server administrator');
  }
});

// Send the request
req.write(JSON.stringify(credentials));
req.end();