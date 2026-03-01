const jwt = require('jsonwebtoken');

// Create a superadmin token for testing
const token = jwt.sign({ id: '699772d49467d5bc9f7e911e', role: 'superadmin' }, 'supersecretjwtkey', { expiresIn: '1h' });

async function testRoleUpdate() {
  try {
    const response = await fetch(
      'http://localhost:3000/api/auth/users/69987ea2f66b1552d75f8822/role',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'farmer' })
      }
    );
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Result:', data);
  } catch (err) {
    console.log('Error:', err.message);
  }
}

testRoleUpdate();
