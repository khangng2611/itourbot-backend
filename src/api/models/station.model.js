import mongoose from 'mongoose';

/**
 * Station Schema
 * @private
 */
const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxLength: 64,
    trim: true,
  },
  stationId: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  imgUrl: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
  },
}, {
  timestamps: true,
});

stationSchema.statics = {
  /**
   * List stations in accending order of 'sationId'.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<Station[]>}
   */
  async list({ page = 1, perpage = 20 }) {
    const result = await this.find({})
      .sort({ stationId: 1 })
      .skip(perpage * (page - 1))
      .limit(perpage)
      .exec();
    return result;
  },

  async add({
    name, stationId, rating = 5, imgUrl, description = '',
  }) {
    const result = this.create({
      name, stationId, rating, imgUrl, description,
    });
    return result;
  },
};

export default mongoose.model('Station', stationSchema);
