const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    period: {
      type: String,
      enum: ['monthly', 'weekly', 'yearly'],
      default: 'monthly',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    alertStatus: {
      type: String,
      enum: ['on_track', 'near_limit', 'over_budget'],
      default: 'on_track',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

budgetSchema.index({ userId: 1, startDate: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
