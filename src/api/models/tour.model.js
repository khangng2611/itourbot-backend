import mongoose from 'mongoose';
import HttpStatus from 'http-status';
import APIError from '../errors/api-error.js';

const statuses = ['picking', 'leading', 'canceled', 'done'];
/**
 * Tour History Schema
 * @private
 */
const tourSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fromStation: {
    type: Number,
    required: true,
  },
  toStation: {
    type: [Number],
    required: true,
  },
  status: {
    type: String,
    enum: statuses,
    default: 'picking',
  },
  lastStation: {
    type: Number,
  },
}, {
  timestamps: true,
});

tourSchema.statics = {
  statuses,
  /**
     * Get tour
     *
     * @param {ObjectId} id - The objectId of tour.
     * @returns {Promise<Tour, APIError>}
     */
  async get(id) {
    let tour;
    if (mongoose.Types.ObjectId.isValid(id)) {
      tour = await this.findById(id).exec();
    }
    if (tour) {
      return tour;
    }
    throw new APIError({
      message: 'Tour does not exist',
      status: HttpStatus.NOT_FOUND,
    });
  },
  /**
     * List stations in accending order of 'sationId'.
     *
     * @param {number} skip - Number of users to be skipped.
     * @param {number} limit - Limit number of users to be returned.
     * @returns {Promise<Tour[]>}
     */
  async list({
    page = 1, perpage = 20, status = '', id = '',
  }, userId) {
    if (id) {
      const result = await this.findById(id).exec();
      return [result];
    }
    const options = {
      status: status || { $ne: null },
      userId,
    };
    const result = await this.find(options)
      .skip(perpage * (page - 1))
      .limit(perpage)
      .sort({ createdAt: -1 })
      .exec();
    return result;
  },
  async add({ userId, fromStation, toStation = [] }) {
    if (toStation.includes(fromStation)) {
      throw new APIError({
        message: 'fromStation must not be included in toStation',
        status: HttpStatus.FORBIDDEN,
      });
    }
    const result = await this.create({
      userId,
      fromStation,
      toStation,
      lastStation: fromStation,
    });
    return result;
  },
};

const Tour = mongoose.model('Tour', tourSchema);
export default Tour;
