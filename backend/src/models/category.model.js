const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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

categorySchema.index(
  { userId: 1, name: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

module.exports = mongoose.model('Category', categorySchema);
