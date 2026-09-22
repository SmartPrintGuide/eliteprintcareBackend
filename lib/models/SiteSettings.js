import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
    },
    chatEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model('SiteSettings', siteSettingsSchema);

export default SiteSettings;
