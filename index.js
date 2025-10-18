// استدعاء المكتبات
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// استدعاء الموديل
const Reading = require('./models/Reading');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // لخدمة صفحة المحاكي

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('✅ ممتاز! تم الاتصال بقاعدة البيانات بنجاح.'))
  .catch((err) => console.error('❌ خطأ: لم نتمكن من الاتصال بقاعدة البيانات.', err));

// --- (دالة محاكاة الذكاء الاصطناعي) ---
async function getAIAnalysis(readings) {
  console.log('AI model received data for analysis...');
  // محاكاة تأخير الشبكة والتحليل
  await new Promise(resolve => setTimeout(resolve, 2000)); 
  
  const totalReadings = readings.length;
  if (totalReadings === 0) {
    return {
      summary: "لا توجد بيانات كافية للتحليل.",
      hotspots: [],
      patterns: "يرجى إرسال بعض القراءات أولاً.",
      recommendations: "استخدم صفحة المحاكي لإضافة بيانات."
    };
  }
  
  // مثال لتحليل بسيط
  const averageTemp = readings.reduce((sum, r) => sum + r.data.temperature_celsius, 0) / totalReadings;
  const highTurbidityReadings = readings
    .filter(r => r.data.turbidity_ntu > 150)
    .map(r => r.guardian_id);

  const report = {
    summary: `تم تحليل ${totalReadings} قراءة. متوسط درجة الحرارة العام هو ${averageTemp.toFixed(2)} درجة مئوية. الحالة العامة تبدو مستقرة مع بعض الملاحظات.`,
    hotspots: highTurbidityReadings.length > 0 
      ? [`تم رصد مستويات عكارة مرتفعة بشكل مثير للقلق من الحراس: ${[...new Set(highTurbidityReadings)].join(', ')}`]
      : ["لا توجد مناطق حرجة تتطلب تدخلاً عاجلاً حاليًا."],
    patterns: "يلاحظ وجود ميل لارتفاع طفيف في درجات الحرارة في القراءات الأخيرة، وهو أمر طبيعي مع دخول وقت الظهيرة.",
    recommendations: "يوصى بمراقبة الحراس ذوي قراءات العكارة المرتفعة. إذا استمرت القراءات العالية، قد يتطلب الأمر فحصًا ميدانيًا للمنطقة."
  };
  
  console.log('AI analysis complete.');
  return report;
}

// --- اللينكات (Routes) ---

app.get('/', (req, res) => {
  res.send('API حراس النيل يعمل!');
});

// -- اللينك الجديد الخاص بتحليل الذكاء الاصطناعي --
app.get('/api/v1/analysis', async (req, res) => {
  try {
    // 1. سحب كل البيانات من قاعدة البيانات
    const allReadings = await Reading.find().sort({ timestamp: -1 }); // جلب الأحدث أولاً

    // 2. إرسال البيانات لدالة التحليل وانتظار التقرير
    const analysisReport = await getAIAnalysis(allReadings);

    // 3. إرسال التقرير كرد
    res.status(200).json(analysisReport);

  } catch (error) {
    console.error("Error during AI analysis:", error);
    res.status(500).json({ message: "An error occurred during analysis." });
  }
});

// ... باقي اللينكات القديمة (POST و GET) تبقى كما هي ...
app.post('/api/v1/readings', async (req, res) => {
  try {
    const newReading = new Reading(req.body);
    await newReading.save();
    res.status(201).json({ message: "Data saved successfully!", data: newReading });
  } catch (error) {
    res.status(500).json({ message: "Error saving data", error: error });
  }
});

// --- اللينك الجديد: لجلب بيانات حارس واحد فقط ---
// 1. اللينك الذي يجلب كل القراءات (لصفحة الخريطة الرئيسية)
app.get('/api/v1/readings', async (req, res) => {
  try {
    const allReadings = await Reading.find();
    res.status(200).json(allReadings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error: error });
  }
});

// 2. اللينك الذي يجلب قراءات حارس واحد فقط (لصفحة التفاصيل المستقبلية)
app.get('/api/v1/readings/:guardianId', async (req, res) => {
  try {
    const { guardianId } = req.params;
    const readings = await Reading.find({ guardian_id: guardianId }).sort({ timestamp: -1 });

    if (readings.length === 0) {
      return res.status(404).json({ message: "No readings found for this guardian." });
    }

    res.status(200).json(readings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching guardian data", error: error });
  }
});


// تشغيل الخادم
app.listen(port, () => {
  console.log(`الخادم يعمل على http://localhost:${port}`);
});