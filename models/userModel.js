const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A user must have a name'],
            unique: true,
            trim: true,
            maxlength: [50, 'A tour name must have less or equal then 50 characters'],
            minlength: [4, 'A tour name must have more or equal then 4 characters']
            // validate: [validator.isAlpha, 'Tour name must only contain characters']
        },
        email: {
            type: String,
            unique: true,
            lowercase: true,
            required: [true, 'A user must have email'],
            validate: [validator.isEmail]
        },
        password: {
            type: String,
            required: [true, 'A user must have password'],
            minlength: [8, 'min length of password should be 8 characters'],
            select: false
        },
        passwordConfirm: {
            type: String,
            required: [true, 'A user must have passwordConfirm'],
            validate: {
                validator: el => {
                    return el = this.password;
                }
            }
        },
        role: {
            type: String,
            enum: ['user', 'guide', 'lead-guide', 'admin'],
            default: 'user'

        },
        photo: {
            type: String,
            default: "default.jpg"
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        active: {
            type: Boolean,
            default: true,
            select: false
        }
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
})

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
})

userSchema.methods.correctPasswords = async function (candidatePassword, userPassword) {
    console.log(`candidatePassword: ${candidatePassword}`);
    console.log(`userPassword: ${userPassword}`);
    return await bcrypt.compare(candidatePassword, userPassword);
}
userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;