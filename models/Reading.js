const mongoose = require('mongoose');

// 1. تعريف المخطط (Schema) الذي يصف شكل بيانات القراءة
const readingSchema = new mongoose.Schema({
  guardian_id: {
    type: String,
    required: true // هذا الحقل إجباري
  },
  timestamp: {
    type: Date,
    required: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  data: {
    temperature_celsius: { type: Number },
    turbidity_ntu: { type: Number }
  },
  battery_level: {
    type: Number,
    min: 0,
    max: 1
  }
});

// 2. إنشاء وتصدير الـ "Model" بناءً على المخطط
// mongoose سيقوم بإنشاء "collection" (جدول) اسمه "readings" تلقائيًا
module.exports = mongoose.model('Reading', readingSchema);