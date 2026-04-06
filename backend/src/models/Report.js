import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    // ✅ The Employer who will receive/view the analytics
    employer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employer", 
      required: true 
    },

    // ✅ The Admin who verified and pushed the data
    admin: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Admin", 
      required: true 
    },

    // ✅ Sync status to distinguish between live data and pushed reports
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published"
    },

    // ✅ Core Metrics (Aligned with your Analytics UI)
    metrics: {
      activeListings: { 
        type: Number, 
        default: 0,
        description: "Number of currently open/active job posts" 
      },
      totalApplications: { 
        type: Number, 
        default: 0,
        description: "Total count of candidates in the pipeline" 
      },
      shortlisted: { 
        type: Number, 
        default: 0, 
        description: "Count of candidates marked for shortlisting"
      },
      totalInterviews: { 
        type: Number, 
        default: 0 
      },
      hires: { 
        type: Number, 
        default: 0 
      }
    },

    // ✅ Custom notes from the Admin to the Employer
    adminNotes: {
      type: String,
      trim: true
    },

    // ✅ For historical tracking
    generatedAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    timestamps: true // Automatically creates createdAt and updatedAt
  }
);

// ✅ Indexing for fast retrieval by the Employer dashboard
reportSchema.index({ employer: 1, generatedAt: -1 });

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

export default Report;