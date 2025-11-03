import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HelpSupportScreen({ navigation }) {
  const handleContactSupport = (method) => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:support@ayaapp.com');
        break;
      case 'phone':
        Linking.openURL('tel:0800123456');
        break;
      case 'whatsapp':
        Linking.openURL('https://wa.me/27800123456');
        break;
      case 'chat':
        Alert.alert('Live Chat', 'Live chat feature coming soon!');
        break;
    }
  };

  const renderHelpItem = (title, description, icon, onPress) => (
    <TouchableOpacity style={styles.helpItem} onPress={onPress}>
      <View style={styles.helpLeft}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={24} color="#FF1493" />
        </View>
        <View style={styles.helpText}>
          <Text style={styles.helpTitle}>{title}</Text>
          <Text style={styles.helpDescription}>{description}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderContactItem = (title, subtitle, icon, method) => (
    <TouchableOpacity 
      style={styles.contactItem} 
      onPress={() => handleContactSupport(method)}
    >
      <Ionicons name={icon} size={24} color="#FF1493" />
      <View style={styles.contactText}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          {renderHelpItem(
            'FAQ',
            'Find answers to common questions',
            'help-circle-outline',
            () => Alert.alert('FAQ', 'Frequently asked questions coming soon!')
          )}
          {renderHelpItem(
            'Safety Guide',
            'Learn how to stay safe with Aya',
            'book-outline',
            () => Alert.alert('Safety Guide', 'Comprehensive safety guide coming soon!')
          )}
          {renderHelpItem(
            'Video Tutorials',
            'Watch how to use Aya features',
            'play-circle-outline',
            () => Alert.alert('Tutorials', 'Video tutorials coming soon!')
          )}
          {renderHelpItem(
            'Report a Problem',
            'Let us know if something isn\'t working',
            'flag-outline',
            () => Alert.alert('Report Problem', 'Describe the issue you\'re experiencing')
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          {renderContactItem(
            'Email Support',
            'support@ayaapp.com',
            'mail-outline',
            'email'
          )}
          {renderContactItem(
            'Phone Support',
            '0800 123 456',
            'call-outline',
            'phone'
          )}
          {renderContactItem(
            'WhatsApp',
            'Message us on WhatsApp',
            'logo-whatsapp',
            'whatsapp'
          )}
          {renderContactItem(
            'Live Chat',
            'Chat with our support team',
            'chatbubbles-outline',
            'chat'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Resources</Text>
          {renderHelpItem(
            'Emergency Hotlines',
            'Important emergency contact numbers',
            'call-outline',
            () => Alert.alert(
              'Emergency Hotlines',
              'Police: 10111\nAmbulance: 10177\nGBV Command Centre: 0800 428 428\nLifeline: 0861 322 322'
            )
          )}
          {renderHelpItem(
            'Nearest Safe Spaces',
            'Find safe spaces near you',
            'location-outline',
            () => Alert.alert('Safe Spaces', 'Showing safe spaces on map...')
          )}
          {renderHelpItem(
            'Legal Resources',
            'Know your rights and legal options',
            'document-text-outline',
            () => Alert.alert('Legal Resources', 'Legal information coming soon!')
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="headset-outline" size={28} color="#FF1493" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>24/7 Support Available</Text>
            <Text style={styles.infoText}>
              Our support team is here to help you anytime, day or night.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>App Version 1.0.0</Text>
          <TouchableOpacity onPress={() => Alert.alert('About', 'Aya - Your Safety Companion')}>
            <Text style={styles.footerLink}>About Aya</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Terms', 'Terms of Service')}>
            <Text style={styles.footerLink}>Terms & Privacy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF1493',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFF0F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    marginLeft: 15,
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  helpDescription: {
    fontSize: 13,
    color: '#999',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  contactText: {
    marginLeft: 15,
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#FF1493',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F8',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB6D9',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF1493',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  footerLink: {
    fontSize: 14,
    color: '#FF1493',
    marginVertical: 5,
    fontWeight: '500',
  },
});