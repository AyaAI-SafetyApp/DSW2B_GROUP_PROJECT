const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const { Expo } = require('expo-server-sdk');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const expo = new Expo();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// ==================== BACKGROUND SERVICES ====================
class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    console.log('🔄 Initializing background services...');
    
    // Check for new alerts every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.checkForNewAlerts();
    });
    
    // Clean up old alerts every hour
    cron.schedule('0 * * * *', () => {
      this.cleanupOldAlerts();
    });

    // Send time-based tips at scheduled hours (00, 06, 12, 18)
     cron.schedule('0 0,6,12,18 * * *', () => {
     this.sendScheduledTimeTips();
    });
  // Send time-based tips at 21:05 for testing
    /*cron.schedule('36 21 * * *', () => {
      this.sendScheduledTimeTips();
    });*/

    
    console.log('✅ Background services initialized');
  }

  async checkForNewAlerts() {
    try {
      console.log('🔍 Checking for new alerts...');
      const now = new Date().toISOString();

      // Deactivate expired safety alerts
      await supabase
        .from('safety_alerts')
        .update({ is_active: false })
        .eq('is_active', true)
        .lt('end_time', now);

      // Deactivate expired location warnings
      await supabase
        .from('location_warnings')
        .update({ is_active: false })
        .eq('is_active', true)
        .lt('end_time', now);

    } catch (error) {
      console.error('Error in checkForNewAlerts:', error);
    }
  }

  async cleanupOldAlerts() {
    try {
      console.log('🧹 Cleaning up old alerts...');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      await supabase
        .from('safety_alerts')
        .delete()
        .eq('is_active', false)
        .lt('created_at', thirtyDaysAgo);

      await supabase
        .from('crime_alerts')
        .delete()
        .eq('status', 'resolved')
        .lt('created_at', thirtyDaysAgo);

      await supabase
        .from('location_warnings')
        .delete()
        .eq('is_active', false)
        .lt('created_at', thirtyDaysAgo);

    } catch (error) {
      console.error('Error in cleanupOldAlerts:', error);
    }
  }

  async sendScheduledTimeTips() {
    try {
      console.log('⏰ Sending scheduled time tips...');
      const currentHour = new Date().getHours();
      
      const { data: tips, error } = await supabase
        .from('time_tips')
        .select('*')
        .eq('is_active', true)
        .lte('hour_start', currentHour)
        .gte('hour_end', currentHour)
        .limit(1);

      if (error || !tips || tips.length === 0) return;

      const tip = tips[0];
      await this.sendTimeTipNotification(tip);
      
    } catch (error) {
      console.error('Error in sendScheduledTimeTips:', error);
    }
  }

  async sendTimeTipNotification(tip) {
    try {
      const { data: notifications, error } = await supabase
        .from('push_tokens')
        .select('token')
        .not('token', 'is', null);

      if (error) return;

      const messages = [];
      
      for (const notification of notifications || []) {
        if (!Expo.isExpoPushToken(notification.token)) continue;
        
        messages.push({
          to: notification.token,
          sound: 'default',
          title: tip.awareness,
          body: tip.tip,
          data: { type: 'time_tip', tipId: tip.id }
        });
      }
      
      if (messages.length === 0) return;
      
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }
      
      console.log(`✅ Sent time tip: ${tip.awareness}`);
      
    } catch (error) {
      console.error('Error in sendTimeTipNotification:', error);
    }
  }
}

// Initialize background services
const backgroundService = new BackgroundService();

// ==================== API ROUTES ====================

// Health check
app.get('/health', async (req, res) => {
  try {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'AyaAI Safety Backend'
    });
  } catch (error) {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'AyaAI Safety Backend'
    });
  }
});

// Save push token
app.post('/save-push-token', async (req, res) => {
  try {
    const { token, platform, userId } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('push_tokens')
      .upsert({
        token: token,
        platform: platform || 'unknown',
        user_id: userId || 'anonymous',
        updated_at: now
      }, {
        onConflict: 'token'
      });

    if (error) throw error;

    res.status(200).json({ 
      success: true, 
      message: 'Push token saved successfully'
    });
  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save push token'
    });
  }
});

// Get active safety alerts
app.get('/safety-alerts', async (req, res) => {
  try {
    const { data: alerts, error } = await supabase
      .from('safety_alerts')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: alerts || []
    });
  } catch (error) {
    console.error('Error fetching safety alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching safety alerts'
    });
  }
});

// Create safety alert
app.post('/safety-alerts', async (req, res) => {
  try {
    const alertData = {
      ...req.body,
      created_at: new Date().toISOString()
    };

    const { data: alert, error } = await supabase
      .from('safety_alerts')
      .insert([alertData])
      .select()
      .single();

    if (error) throw error;

    await sendSafetyAlertNotifications(alert);

    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error creating safety alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating safety alert'
    });
  }
});

// Get crime alerts
app.get('/crime-alerts', async (req, res) => {
  try {
    const { data: crimes, error } = await supabase
      .from('crime_alerts')
      .select('*')
      .eq('status', 'active')
      .order('severity', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: crimes || []
    });
  } catch (error) {
    console.error('Error fetching crime alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching crime alerts'
    });
  }
});

// Create crime alert
app.post('/crime-alerts', async (req, res) => {
  try {
    const crimeData = {
      ...req.body,
      created_at: new Date().toISOString()
    };

    const { data: crime, error } = await supabase
      .from('crime_alerts')
      .insert([crimeData])
      .select()
      .single();

    if (error) throw error;

    if (crime.severity === 'high' || crime.severity === 'critical') {
      await sendCrimeNotifications(crime);
    }

    res.status(201).json({
      success: true,
      data: crime
    });
  } catch (error) {
    console.error('Error creating crime alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating crime alert'
    });
  }
});

// Get location warnings
app.get('/location-warnings', async (req, res) => {
  try {
    const { data: warnings, error } = await supabase
      .from('location_warnings')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: warnings || []
    });
  } catch (error) {
    console.error('Error fetching location warnings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location warnings'
    });
  }
});

// Create location warning
app.post('/location-warnings', async (req, res) => {
  try {
    const warningData = {
      ...req.body,
      created_at: new Date().toISOString()
    };

    const { data: warning, error } = await supabase
      .from('location_warnings')
      .insert([warningData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: warning
    });
  } catch (error) {
    console.error('Error creating location warning:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating location warning'
    });
  }
});

// Get time tips
app.get('/time-tips', async (req, res) => {
  try {
    const { data: tips, error } = await supabase
      .from('time_tips')
      .select('*')
      .eq('is_active', true)
      .order('hour_start', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: tips || []
    });
  } catch (error) {
    console.error('Error fetching time tips:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching time tips'
    });
  }
});

// Create time tip
app.post('/time-tips', async (req, res) => {
  try {
    const tipData = {
      ...req.body,
      created_at: new Date().toISOString()
    };

    const { data: tip, error } = await supabase
      .from('time_tips')
      .insert([tipData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: tip
    });
  } catch (error) {
    console.error('Error creating time tip:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating time tip'
    });
  }
});

// Trigger time tip manually
app.post('/trigger-time-tip', async (req, res) => {
  try {
    await backgroundService.sendScheduledTimeTips();
    res.status(200).json({
      success: true,
      message: 'Time tip notification triggered'
    });
  } catch (error) {
    console.error('Error triggering time tip:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering time tip'
    });
  }
});

// ==================== NOTIFICATION FUNCTIONS ====================

async function sendSafetyAlertNotifications(alert) {
  try {
    const { data: notifications, error } = await supabase
      .from('push_tokens')
      .select('token')
      .not('token', 'is', null);

    if (error) return;

    const messages = [];
    
    for (const notification of notifications || []) {
      if (!Expo.isExpoPushToken(notification.token)) continue;
      
      messages.push({
        to: notification.token,
        sound: 'default',
        title: alert.title || 'Safety Alert',
        body: alert.message,
        data: { type: 'safety_alert', alertId: alert.id }
      });
    }
    
    if (messages.length === 0) return;
    
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending notification chunk:', error);
      }
    }
    
  } catch (error) {
    console.error('Error in sendSafetyAlertNotifications:', error);
  }
}

async function sendCrimeNotifications(crime) {
  try {
    const { data: notifications, error } = await supabase
      .from('push_tokens')
      .select('token')
      .not('token', 'is', null);

    if (error) return;

    const messages = [];
    
    for (const notification of notifications || []) {
      if (!Expo.isExpoPushToken(notification.token)) continue;
      
      messages.push({
        to: notification.token,
        sound: 'default',
        title: 'Crime Alert',
        body: `${crime.type} reported in ${crime.area}`,
        data: { type: 'crime_alert', crimeId: crime.id }
      });
    }
    
    if (messages.length === 0) return;
    
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending crime notification chunk:', error);
      }
    }
    
  } catch (error) {
    console.error('Error in sendCrimeNotifications:', error);
  }
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});