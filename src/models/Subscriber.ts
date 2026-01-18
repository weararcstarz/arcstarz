import mongoose, { Schema, Document } from 'mongoose';

// Subscriber Document Interface
export interface ISubscriber extends Document {
  email: string;
  subscribed: boolean;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Subscriber Schema
const SubscriberSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  subscribed: {
    type: Boolean,
    default: true,
    index: true // Important for efficient queries
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'subscribers'
});

// Indexes for performance
SubscriberSchema.index({ email: 1 }); // Unique index already exists
SubscriberSchema.index({ subscribed: 1 }); // For querying active subscribers
SubscriberSchema.index({ createdAt: -1 }); // For recent subscribers

// Pre-save middleware to handle subscription dates
SubscriberSchema.pre('save', function() {
  if (this.isModified('subscribed')) {
    if (this.subscribed && this.unsubscribedAt) {
      // Re-subscribing: clear unsubscribedAt and update subscribedAt
      this.unsubscribedAt = null;
      this.subscribedAt = new Date();
    } else if (!this.subscribed && !this.unsubscribedAt) {
      // Unsubscribing: set unsubscribedAt
      this.unsubscribedAt = new Date();
    }
  }
});

// Static method to find or create subscriber
SubscriberSchema.statics.findOrCreate = async function(email: string) {
  let subscriber = await this.findOne({ email });
  if (!subscriber) {
    subscriber = new this({ email });
  }
  return subscriber;
};

// Static method to get all active subscribers
SubscriberSchema.statics.getActiveSubscribers = function() {
  return this.find({ subscribed: true }).sort({ createdAt: -1 });
};

// Static method to get subscriber stats
SubscriberSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const active = await this.countDocuments({ subscribed: true });
  const unsubscribed = total - active;
  
  return {
    total,
    active,
    unsubscribed,
    activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
  };
};

// Instance method to subscribe
SubscriberSchema.methods.subscribe = function() {
  this.subscribed = true;
  this.unsubscribedAt = null;
  this.subscribedAt = new Date();
  return this.save();
};

// Instance method to unsubscribe
SubscriberSchema.methods.unsubscribe = function() {
  this.subscribed = false;
  this.unsubscribedAt = new Date();
  return this.save();
};

export const Subscriber = mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);
