import HttpStatus from 'http-status';
import Tour from '../models/tour.model.js';
import Station from '../models/station.model.js';
import APIError from '../errors/api-error.js';
/**
 * Get user list
 * @public
 */
export const list = async (req, res, next) => {
  try {
    const [tours, stations] = await Promise.all([
      Tour.list(req.query, req.user._id),
      Station.list({}),
    ]);
    const formattedTours = tours.map((tour) => {
      const fromStation = stations.find((station) => station.stationId === tour.fromStation);
      const toStation = stations.find((station) => station.stationId === tour.toStation);
      const item = {
        _id: tour._id,
        _status: tour.status,
        userId: tour.userId,
        fromStation: {
          stationId: tour.fromStation,
          stationName: fromStation.name,
        },
        toStation: {
          stationId: tour.toStation,
          stationName: toStation.name,
        },
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt,
      };
      return item;
    });
    res.json(formattedTours);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const tour = await Tour.add({ userId: req.user._id, ...req.body });
    res.status(HttpStatus.CREATED);
    res.json(tour);
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const tour = await Tour.get(req.body.id);
    if (tour.userId.toString() !== req.user._id.toString()) {
      throw new APIError({
        message: 'Forbidden',
        status: HttpStatus.FORBIDDEN,
      });
    }
    tour.status = req.body.status;
    const savedTour = await tour.save();
    res.json(savedTour);
  } catch (error) {
    next(error);
  }
};
