const Tour = require('./../models/toursModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/:233/center/:latlng/unit/:unit
exports.getTourWithin = catchAsync( async (req, res, next) => {
    const {distance, latlng, unit} = req.params;
    const [lat, lng] = latlng.split(",");
    const radius = unit === 'mi' 
    ? distance / 3963.2 
    : distance / 6378.1;
    
      const tours = await Tour.find({
          startLocation: { $geoWithin: {
              $centerSphere: [[lng, lat], radius]
          }}
      });
      res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
          data: tours
        }
      });
});