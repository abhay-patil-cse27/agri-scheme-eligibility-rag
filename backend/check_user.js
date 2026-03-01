const mongoose = require('mongoose');
const User = require('./src/models/User');
const config = require('./src/config/env');

const checkUser = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');
    const user = await User.findById('69987ea2f66b1552d75f8822');
    if (!user) {
      console.log('User not found');
    } else {
      console.log('User found:', JSON.stringify(user, null, 2));
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

checkUser();
