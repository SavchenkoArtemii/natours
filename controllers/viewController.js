const Tour = require('../models/toursModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
    //1 get tour data from mongoDB collection
    const tours = await Tour.find();


    res.status(200).render(
        'overview', {
            title: "All Tours",
            tours
        }
    )
})

exports.getTour = catchAsync( async (req, res) => {

    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews guides',
        fields: 'review rating user'
    });

    res.status(200).render(
        'tour', {
            title: "The Forest Hiker",
            tour
        }
    )
})

exports.getForm =  (req, res) => {
    res.status(200).render("login", {
        title: "Log in form"
    })
}