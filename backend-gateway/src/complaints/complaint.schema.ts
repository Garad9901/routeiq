import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ComplaintDocument = Complaint & Document;

@Schema({ timestamps: true })
export class Complaint {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 'Pothole' })
  category: string; // e.g. Pothole, Flooding, Signage, Drainage

  @Prop({ default: 'Negative' })
  sentiment: string; // Negative, Neutral, Positive

  @Prop({ default: 'Medium' })
  severity: string; // Low, Medium, High, Critical

  // MongoDB spatial index format
  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop()
  imageUrl: string;

  @Prop({ default: 'Open' })
  status: string; // Open, In_Progress, Resolved
}

export const ComplaintSchema = SchemaFactory.createForClass(Complaint);
// Enable geospatial index for MongoDB proximity queries
ComplaintSchema.index({ location: '2dsphere' });
