const mongoose = require('mongoose');
const User = require('./src/models/User');
const config = require('./src/config/env');

const checkUser = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    const user = await User.findOne({ email: 'admin@nitisetu.gov.in' });
    console.log('Superadmin ID:', user._id.toString());
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

checkUser();
