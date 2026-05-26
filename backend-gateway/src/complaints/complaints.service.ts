import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Complaint, ComplaintDocument } from './complaint.schema';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(
    @InjectModel(Complaint.name)
    private complaintModel: Model<ComplaintDocument>,
    private alertsService: AlertsService,
  ) {}

  async create(createDto: any): Promise<Complaint> {
    const { title, description, lng, lat, imageUrl, category } = createDto;

    // NLP Sentiment & Severity Analyzer Simulation
    let sentiment = 'Neutral';
    let severity = 'Medium';
    let detectedCategory = category || 'Pothole';

    const text = (title + ' ' + description).toLowerCase();

    // Sentiment check
    if (text.includes('terrible') || text.includes('awful') || text.includes('dangerous') || text.includes('damage') || text.includes('worse') || text.includes('accident')) {
      sentiment = 'Negative';
    }

    // Severity mapping
    if (text.includes('accident') || text.includes('collapsed') || text.includes('sinkhole') || text.includes('severe injury') || text.includes('blocked major highway')) {
      severity = 'Critical';
    } else if (text.includes('dangerous') || text.includes('broken axle') || text.includes('tire burst') || text.includes('flooded deep')) {
      severity = 'High';
    } else if (text.includes('small') || text.includes('minor') || text.includes('annoying')) {
      severity = 'Low';
    }

    // Category mapping override
    if (text.includes('flood') || text.includes('water') || text.includes('rain') || text.includes('submerged')) {
      detectedCategory = 'Flooding';
    } else if (text.includes('pothole') || text.includes('pit') || text.includes('hole')) {
      detectedCategory = 'Pothole';
    } else if (text.includes('sign') || text.includes('light') || text.includes('signal') || text.includes('traffic lamp')) {
      detectedCategory = 'Signage';
    } else if (text.includes('crack') || text.includes('asphalt splitting')) {
      detectedCategory = 'Surface Degradation';
    }

    const complaint = new this.complaintModel({
      title,
      description,
      category: detectedCategory,
      sentiment,
      severity,
      imageUrl,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      status: 'Open',
    });

    const saved = await complaint.save();
    this.logger.log(`New citizen complaint filed: ${saved.title} (Severity: ${saved.severity})`);

    // Emit critical real-time alert via WebSockets
    if (severity === 'Critical' || severity === 'High') {
      this.alertsService.emitCriticalAlert({
        id: saved._id,
        title: saved.title,
        description: saved.description,
        severity: saved.severity,
        category: saved.category,
        location: saved.location,
      });
    }

    return saved;
  }

  async findAll(): Promise<Complaint[]> {
    return this.complaintModel.find().sort({ createdAt: -1 }).exec();
  }

  async findNearby(lng: number, lat: number, maxDistanceMeters: number): Promise<Complaint[]> {
    return this.complaintModel
      .find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: maxDistanceMeters,
          },
        },
      })
      .exec();
  }

  async updateStatus(id: string, status: string): Promise<Complaint> {
    return this.complaintModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  async getComplaintKPIs(): Promise<any> {
    const total = await this.complaintModel.countDocuments();
    const open = await this.complaintModel.countDocuments({ status: 'Open' });
    const inProgress = await this.complaintModel.countDocuments({ status: 'In_Progress' });
    const resolved = await this.complaintModel.countDocuments({ status: 'Resolved' });
    
    const critical = await this.complaintModel.countDocuments({ severity: 'Critical' });
    
    // Aggregation of categories
    const categories = await this.complaintModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c._id] = c.count;
    });

    return {
      total,
      open,
      inProgress,
      resolved,
      critical,
      categoryMap,
    };
  }
}
