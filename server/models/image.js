const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imagePath: {
    type: String,
    required: true
  },
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

imageSchema.statics.deleteImage = async function(imageId) {
  try {
    const deletedImage = await Image.deleteImage(imageId);
    return deletedImage;
  } catch (error) {
    throw new Error(error.message);
  }
};

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
