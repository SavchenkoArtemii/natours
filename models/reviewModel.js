const mongoose = require('mongoose');
const Tour = require('./toursModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, "Review cannot be empty"]
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, "Review must belong to the tour"]
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, "Review must belong to the user"]
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)


// only one review for one tour from one user
reviewSchema.index({tour: 1, user: 1}, {unique: true});

// QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function(next) {
    // this.populate({ 
    //     path: 'tour',
    //     select: "name"
    //  }).populate({ 
    //     path: 'user',
    //     select: "name"
    //  });
  
    this.start = Date.now();
    next();
  });

reviewSchema.statics.calcAverageRatings = async function(tour) {
    const stats = await this.aggregate([
        {
            $match: {tour : tour}
        },
        {
            $group: {
                _id: "$tour",
                nRating: {$sum: 1},
                avgRating: {$avg: "$rating"}
            }
        }
    ]);
    if (stats[0]) {
        await Tour.findByIdAndUpdate(tour, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    } else {
        // set default rating and quantity
        await Tour.findByIdAndUpdate(tour, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }
    
}

reviewSchema.post('save', function() {
    this.constructor.calcAverageRatings(this.tour);
})

reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = this.findOne();
    next();
})

reviewSchema.post(/^findOneAnd/, async function(){
    await this.r.constructor.calcAverageRatings(this.r.tour);
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;