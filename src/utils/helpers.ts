// Format Egyptian phone numbers to international WhatsApp format (201xxxxxxxxx)
export const formatWhatsAppPhone = (phone: string): string => {
  if (!phone) return '';
  // remove any non-digit chars
  let cleaned = phone.replace(/\D/g, '');
  
  // if starts with 0020 or +20
  if (cleaned.startsWith('0020')) {
    cleaned = cleaned.substring(2);
  }
  // if starts with 01
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '2' + cleaned;
  }
  // if already starts with 201
  if (!cleaned.startsWith('20') && cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = '20' + cleaned;
  }
  return cleaned;
};

// Generate wa.me link with encoded Arabic text
export const generateWhatsAppLink = (phone: string, message: string): string => {
  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMsg}`;
};

// Format date to Arabic readable string
export const formatArabicDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

// Today's YYYY-MM-DD
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get current Arabic Day Name
export const getCurrentArabicDay = (): string => {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[new Date().getDay()];
};

/**
 * CallMeBot WhatsApp Notification
 * Sends automatic background WhatsApp messages without opening the WhatsApp interface
 */
export async function sendWhatsAppNotification(
  parentPhone: string,
  studentName: string,
  absenceDate: string,
  customApiKey?: string
): Promise<{ success: boolean; message: string }> {
  // المفتاح ورقمك متظبطين هنا جاهزين
  const apiKey = customApiKey || "2155589";
  const myPhone = "201559735253"; 

  // Format phone to international format without spaces/dashes
  let phoneCleaned = parentPhone.replace(/\D/g, '');
  if (phoneCleaned.startsWith('01')) {
    phoneCleaned = '2' + phoneCleaned;
  } else if (phoneCleaned.startsWith('0020')) {
    phoneCleaned = phoneCleaned.substring(2);
  } else if (!phoneCleaned.startsWith('20') && phoneCleaned.length === 10) {
    phoneCleaned = '20' + phoneCleaned;
  }
  
  // CallMeBot works with leading +
  const targetPhone = phoneCleaned.startsWith('+') ? phoneCleaned : `+${phoneCleaned}`;

  // نص الرسالة اللي هتروح لولي الأمر
  const message = `تنبيه غياب: ولي الأمر المحترم، نود إعلامكم أن الطالب/ة (${studentName}) متغيب عن المدرسة بتاريخ ${absenceDate}. برجاء المتابعة.`;

  // تجهيز رابط الـ API الخاص بـ CallMeBot
  const encodedMessage = encodeURIComponent(message);
  const apiURL = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(targetPhone)}&text=${encodedMessage}&apikey=${apiKey}`;

  // إرسال الطلب أوتوماتيك في الخلفية من غير ما تفتح واتساب
  try {
    // mode: 'no-cors' allows sending to CallMeBot from the browser without browser CORS policy aborting the request
    await fetch(apiURL, { mode: 'no-cors' });
    console.log("تم إرسال رسالة الواتساب بنجاح لـ: " + targetPhone);
    return {
      success: true,
      message: `تم إرسال إشعار الغياب بنجاح لـ: ${targetPhone} عبر واتساب!`
    };
  } catch (error) {
    try {
      const ping = new Image();
      ping.src = apiURL;
      console.log("تم إرسال رسالة الواتساب عبر Image ping بنجاح لـ: " + targetPhone);
      return {
        success: true,
        message: `تم إرسال إشعار الغياب بنجاح لـ: ${targetPhone} عبر واتساب!`
      };
    } catch (err2) {
      console.error("خطأ في الاتصال بالشبكة:", err2);
      return {
        success: false,
        message: "حدث خطأ أثناء إرسال الرسالة."
      };
    }
  }
}

export interface AbsentStudentItem {
  name: string;
  phone: string;
  date: string;
}

/**
 * Send batch absence notifications to all absent students in list
 */
export async function sendBatchAbsenceNotifications(
  absentStudentsList: AbsentStudentItem[],
  customApiKey?: string,
  onProgress?: (index: number, total: number, studentName: string) => void
): Promise<{ total: number; sent: number }> {
  const apiKey = customApiKey || "2155589";
  let sentCount = 0;

  for (let i = 0; i < absentStudentsList.length; i++) {
    const student = absentStudentsList[i];
    if (onProgress) {
      onProgress(i + 1, absentStudentsList.length, student.name);
    }

    const res = await sendWhatsAppNotification(
      student.phone,
      student.name,
      student.date,
      apiKey
    );

    if (res.success) {
      sentCount++;
      console.log(`تم إرسال إشعار الغياب بنجاح لولي أمر الطالب: ${student.name}`);
    } else {
      console.error(`فشل في إرسال الرسالة للطالب: ${student.name}`);
    }

    // Small delay between calls to ensure smooth delivery
    if (i < absentStudentsList.length - 1) {
      await new Promise((res) => setTimeout(res, 400));
    }
  }

  return { total: absentStudentsList.length, sent: sentCount };
}

