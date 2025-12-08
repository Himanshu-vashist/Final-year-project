// FundingScreen.js (3 Cards Per Row Grid Layout)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import fundingDataJson from './startup_funding.json';

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 3;   // 3 cards per row with spacing
const isTablet = width > 600;

function safeString(v) {
  if (!v || v === "NaN") return "N/A";
  return String(v).trim();
}

export default function FundingScreen() {
  const [fundingData, setFundingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const mapped = fundingDataJson.slice(0, 30).map((item, idx) => ({
        id: item["Sr No"] || idx + 1,
        company_name: safeString(item["Startup Name"]),
        amount_raised: safeString(item["Amount in USD"]),
        round_type: safeString(item["InvestmentnType"]),
        date: safeString(item["Date dd/mm/yyyy"]),
        investors: item["Investors Name"]
          ? item["Investors Name"].split(",").map((s) => s.trim())
          : [],
        city: safeString(item["City  Location"]),
        industry: safeString(item["Industry Vertical"]),
        subvertical: safeString(item["SubVertical"]),
        remarks: safeString(item["Remarks"]),
      }));

      setFundingData(mapped);
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#b366ff" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#1a1a3e", "#2d2d5f", "#1a1a3e"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Latest Funding Rounds</Text>
          <Ionicons name="cash-outline" size={32} color="#b366ff" />
        </View>

        {/* FULL WIDTH CARD LAYOUT */}
        <View style={styles.cardList}>
          {fundingData.map((item) => (
            <View key={item.id} style={styles.fundingCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.iconBadge}>
                  <Ionicons name="business" size={24} color="#b366ff" />
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.round_type}</Text>
                </View>
              </View>
              <Text style={styles.company}>{item.company_name}</Text>
              <Text style={styles.amount}>{item.amount_raised}</Text>
              <View style={styles.cardDetailsRow}>
                <Text style={styles.meta}><Ionicons name="calendar" size={16} color="#b366ff" /> {item.date}</Text>
                <Text style={styles.meta}><Ionicons name="location" size={16} color="#b366ff" /> {item.city}</Text>
              </View>
              <Text style={styles.meta}><Ionicons name="people" size={16} color="#b366ff" /> {item.investors.join(", ") || "N/A"}</Text>
              <Text style={styles.meta}><Ionicons name="briefcase" size={16} color="#b366ff" /> {item.industry} - {item.subvertical}</Text>
              {item.remarks && <Text style={styles.meta}><Ionicons name="information-circle" size={16} color="#b366ff" /> {item.remarks}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingTop: 40,
    paddingBottom: 15,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },

  cardList: {
    paddingHorizontal: 15,
  },
  fundingCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderLeftWidth: 5,
    borderLeftColor: '#b366ff',
    elevation: 4,
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  iconBadge: {
    backgroundColor: "rgba(179,102,255,0.15)",
    padding: 6,
    borderRadius: 8,
  },

  statusBadge: {
    backgroundColor: "rgba(179,102,255,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },

  statusText: {
    color: "#b366ff",
    fontSize: 10,
    fontWeight: "700",
  },

  company: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  amount: {
    color: '#b366ff',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  meta: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
