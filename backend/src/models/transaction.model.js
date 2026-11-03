const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    recurringScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringTransaction',
    },
    recurrenceDate: {
      type: Date,
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

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index(
  { recurringScheduleId: 1, recurrenceDate: 1 },
  {
    unique: true,
    partialFilterExpression: { recurringScheduleId: { $type: 'objectId' } },
  },
);

module.exports = mongoose.model('Transaction', transactionSchema);
