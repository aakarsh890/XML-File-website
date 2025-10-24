import mongoose from "mongoose";

const { Schema } = mongoose;

// Subdocument for individual accounts
const accountSchema = new Schema(
  {
    type: {
      type: String,
      trim: true,
      enum: ["Credit Card", "Loan", "Mortgage", "Other"],
      default: "Other",
    },
    provider: { type: String, trim: true },
    addresses: [{ type: String, trim: true }],
    accountNumber: { type: String, trim: true },
    amountOverdue: { type: Number, min: 0, default: 0 },
    currentBalance: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      trim: true,
      enum: ["Active", "Closed", "Delinquent", "Unknown"],
      default: "Unknown",
    },
  },
  { _id: false } // avoid extra _id for subdocuments
);

// Main report schema
const reportSchema = new Schema(
  {
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
      index: true,
    },
    uploadedAt: { type: Date, default: Date.now, index: true },
    basicDetails: {
      name: { type: String, trim: true },
      mobile: {
        type: String,
        trim: true,
        match: [/^\d{10}$/, "Invalid mobile number format"],
      },
      pan: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{5}\d{4}[A-Z]$/, "Invalid PAN format"],
      },
      creditScore: {
        type: Number,
        min: 300,
        max: 900,
        default: null,
      },
    },
    summary: {
      totalAccounts: { type: Number, min: 0, default: 0 },
      activeAccounts: { type: Number, min: 0, default: 0 },
      closedAccounts: { type: Number, min: 0, default: 0 },
      currentBalance: { type: Number, min: 0, default: 0 },
      securedAmount: { type: Number, min: 0, default: 0 },
      unsecuredAmount: { type: Number, min: 0, default: 0 },
      enquiriesLast7Days: { type: Number, min: 0, default: 0 },
    },
    accounts: [accountSchema],
  },
  {
    timestamps: true, // adds createdAt / updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Example of a virtual (computed property)
reportSchema.virtual("summary.totalValue").get(function () {
  return (
    (this.summary?.securedAmount || 0) +
    (this.summary?.unsecuredAmount || 0)
  );
});

// Example of a pre-save hook (optional)
reportSchema.pre("save", function (next) {
  // Auto-calculate summary.totalAccounts if not provided
  if (!this.summary.totalAccounts && Array.isArray(this.accounts)) {
    this.summary.totalAccounts = this.accounts.length;
  }
  next();
});

// Example index for faster lookups by PAN or upload date
reportSchema.index({ "basicDetails.pan": 1, uploadedAt: -1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
