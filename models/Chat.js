import mongoose from 'mongoose';

const ResponseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['vqa', 'grounding', 'captioning'],
    required: true,
  },
  prompt: {
    type: String,
    required: true,
    trim: true,
  },
  response: {
    type: mongoose.Schema.Types.Mixed, 
    required: true,
  },
   coordinates: [
    {
      C0: {
        x: { type: Number, required: true, },  
        y: { type: Number, required: true, },  
      },
      C1: {
        x: { type: Number, required: true, },  
        y: { type: Number, required: true, }, 
      },
      C2: {
        x: { type: Number, required: true, },  
        y: { type: Number, required: true, },  
      },
      C3: {
        x: { type: Number, required: true, }, 
        y: { type: Number, required: true, },  
      },
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true, 
    },
    croppedUrl: {
      type: String,
      default:null,
    },
    routine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Routine',
      default: null, 
    },
    isFirst: {
      type: Boolean,
      default: true, 
    },
    responses: [ResponseSchema], 
    metadata: {
      imageSize: String, 
      uploadedAt: Date,
      processingTime: Number, 
    },
  },
  {
    timestamps: true,
  }
);

ChatSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      await mongoose.model('User').updateOne({ _id: this.user }, { $inc: { totalImages: 1 } });
    }
    next();
  } catch (err) {
    console.log(err)
  }
});

ChatSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  try {
    await mongoose.model('User').updateOne({ _id: doc.user }, { $inc: { totalImages: -1 } });
  } catch (err) {
   console.error(err);
  }
});

ChatSchema.index({ user: 1, createdAt: -1 });
ChatSchema.index({ routine: 1 });

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
