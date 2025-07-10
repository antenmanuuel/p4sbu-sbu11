const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const CreditCardSchema = new mongoose.Schema({
    stripeCustomerId: { type: Schema._id, required: true },
    stripePaymentMethodId: { type: String, required: true },
    email: { type: String, required: true },
    // Optional non-sensitive metadata
    cardBrand: String,
    cardLast4: String,
    cardExpMonth: Number,
    cardExpYear: Number,
});

CreditCardSchema.virtual('url').get(function () {
    return `/creditcard/${this._id}`;
});

//hash password before saving user
CreditCardSchema.pre('save', async function (next) {
    if (this.isModified('cardBrand')) {
        this.cardBrand = await bcrypt.hash(this.cardBrand, 10);
    }
    if (this.isModified('cardLast4')) {
        this.cardLast4 = await bcrypt.hash(this.cardLast4, 11);
    }
    if (this.isModified('cardExpMonth')) {
        this.cardExpMonth = await bcrypt.hash(this.cardExpMonth, 12);
    }
    if (this.isModified('cardExpYear')) {
        this.cardExpYear = await bcrypt.hash(this.cardExpYear, 13);
    }
    next();
});

const CreditCardModel = mongoose.model('CreditCard', CreditCardSchema);

module.exports = CreditCardModel;