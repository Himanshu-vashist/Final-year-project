import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function LinkedInJobsScreen() {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchLinkedInData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch(
        'https://fresh-linkedin-profile-data.p.rapidapi.com/get-extra-profile-data?urn=ACoAAABD0a4B2wblfHunfjGEN-uRLdg2MnWydmk&include_publications=true&include_honors=true&include_patents=true&include_courses=true&include_projects=true&include_volunteers=true&include_organizations=true&include_languages=true',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'fresh-linkedin-profile-data.p.rapidapi.com',
            'x-rapidapi-key': 'a7301d4997msh19167ea7c00162dp188d11jsne14adad6fd94'
          }
        }
      );

      if (!response.ok) {
        // Specifically handling "free version" errors as requested
        if (response.status === 401 || response.status === 403 || response.status === 429) {
          setErrorMsg("go to paid you are using free version right now");
        } else {
          setErrorMsg(`Error: ${response.status} ${response.statusText}`);
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('LinkedIn API Error:', error);
      setErrorMsg("go to paid you are using free version right now");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkedInData();
  }, []);

  const renderSection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <Text style={styles.itemHeader}>{item.title || item.name || 'Untitled'}</Text>
            {item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
          </View>
        ))}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0f1226', '#171735']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => fetchLinkedInData()} style={styles.refreshBtn}>
             <Ionicons name="logo-linkedin" size={28} color="#0077B5" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>LinkedIn Insights</Text>
            <Text style={styles.headerSubtitle}>Extra Profile Data Extraction</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0077B5" />
            <Text style={styles.loadingText}>Fetching profile insights...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#ff4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchLinkedInData}>
               <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
            {data?.data?.publications && renderSection('Publications', data.data.publications)}
            {data?.data?.honors && renderSection('Honors & Awards', data.data.honors)}
            {data?.data?.projects && renderSection('Projects', data.data.projects)}
            {data?.data?.organizations && renderSection('Organizations', data.data.organizations)}
            {data?.data?.languages && renderSection('Languages', data.data.languages)}
            
            {!data?.data && (
              <View style={styles.centered}>
                <Text style={styles.noDataText}>No extra profile data available.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  refreshBtn: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#cfcfe6',
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#cfcfe6',
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 30,
    backgroundColor: 'rgba(255,68,68,0.1)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  retryText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0077B5',
    paddingLeft: 10,
  },
  itemCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  itemHeader: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  itemDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
  },
  noDataText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
  }
});
