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
        status: tour.status,
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

export const getCurrent = async (req, res, next) => {
  try {
    const [lastestTourArr, stations] = await Promise.all([
      Tour.list({ perpage: 1 }, req.user._id),
      Station.list({}),
    ]);
    const [latestTour] = lastestTourArr;
    if (latestTour.status === 'picking' || latestTour.status === 'leading') {
      const fromStation = stations.find((station) => station.stationId === latestTour.fromStation);
      const toStation = stations.find((station) => station.stationId === latestTour.toStation);
      const formattedTour = {
        _id: latestTour._id,
        status: latestTour.status,
        userId: latestTour.userId,
        fromStation: {
          stationId: latestTour.fromStation,
          stationName: fromStation.name,
          location: fromStation.location,
          description: fromStation.description,
        },
        toStation: {
          stationId: latestTour.toStation,
          stationName: toStation.name,
          location: toStation.location,
          description: toStation.description,
        },
        createdAt: latestTour.createdAt,
        updatedAt: latestTour.updatedAt,
      };
      return res.json(formattedTour);
    }
  } catch (error) {
    next(error);
  }
  return res.json({});
};
