const { default: fetch } = require('node-fetch');

async function testFrontendThaiEncoding() {
  try {
    console.log('🔐 Testing Frontend Authentication with Thai encoding...');
    
    // Test login through frontend
    const loginResponse = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        identifier: 'test@example.com',
        password: 'password123'
      }),
    });

    const loginData = await loginResponse.json();
    console.log('✅ Frontend login response:', loginData.ok ? 'SUCCESS' : 'FAILED');
    
    if (!loginData.ok) {
      console.error('❌ Login failed, cannot test form submission');
      return;
    }

    // Get JWT from cookies (simulate browser behavior)
    const cookies = loginResponse.headers.get('set-cookie');
    const jwtMatch = cookies?.match(/jwt=([^;]+)/);
    const jwt = jwtMatch ? jwtMatch[1] : null;

    if (!jwt) {
      console.error('❌ No JWT found in response');
      return;
    }

    console.log('✅ JWT token obtained, testing form submission...');

    // Test form creation with Thai characters using the API service headers
    const formData = {
      data: {
        TypePos: 'SPEC',
        Name_Pos: 'รองผู้อำนวยการเขตพื้นที่การศึกษา',
        Num_Pos_M: '123141234',
        Affiliation: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาราชบุรี เขต 2',
        EducationalInstitution: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาราชบุรี เขต 2',
        DateTimeInput_M: '7 กันยายน 2568'
      }
    };

    // Use environment-appropriate URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_SERVICES_PROD_URL ||
                      process.env.NEXT_PUBLIC_BACKEND_SERVICES_URL ||
                      'http://jeval-strapi-app:1337';

    const formResponse = await fetch(`${backendUrl}/api/forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(formData),
    });

    const formResult = await formResponse.json();
    
    console.log('📊 Form submission result:');
    console.log('- Status:', formResponse.status);
    console.log('- ID:', formResult.data?.id);
    console.log('- DateTimeInput_M:', formResult.data?.DateTimeInput_M);
    console.log('- DateTimeInput_M_submit:', formResult.data?.DateTimeInput_M_submit);
    console.log('- Name_Pos:', formResult.data?.Name_Pos);
    console.log('- Affiliation:', formResult.data?.Affiliation);
    
    if (formResult.data?.DateTimeInput_M_submit && formResult.data.DateTimeInput_M.includes('กันยายน')) {
      console.log('🎉 SUCCESS: Thai characters preserved AND date conversion worked!');
      console.log(`   Thai date: "${formResult.data.DateTimeInput_M}"`);
      console.log(`   ISO date:  "${formResult.data.DateTimeInput_M_submit}"`);
    } else if (formResult.data?.DateTimeInput_M.includes('กันยายน')) {
      console.log('✅ Thai characters preserved correctly');
    } else {
      console.log('❌ Thai characters may have encoding issues');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendThaiEncoding();