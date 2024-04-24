const mongoose = require('mongoose');

async function connectToDatabase() {
  try {
    const mongodbURI = 'mongodb+srv://muaz:afdal@cluster0.ciuul8i.mongodb.net/galeri  ';
    await mongoose.connect(mongodbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
  }
}

module.exports = connectToDatabase;
