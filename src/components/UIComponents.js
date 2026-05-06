import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export const StatCard = ({ title, value, icon, color, subtitle, onPress }) => (
  <TouchableOpacity onPress={onPress} disabled={!onPress}>
    <Surface style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <Ionicons name={icon} size={24} color={color} />
      </View>
    </Surface>
  </TouchableOpacity>
);

export const ActionCard = ({ title, description, icon, color, onPress }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <Surface style={styles.actionSurface}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </Surface>
  </TouchableOpacity>
);

export const InfoCard = ({ title, children, icon }) => (
  <Surface style={styles.infoCard}>
    <View style={styles.infoHeader}>
      {icon && <Ionicons name={icon} size={20} color="#667eea" />}
      <Text style={styles.infoTitle}>{title}</Text>
    </View>
    <View style={styles.infoContent}>
      {children}
    </View>
  </Surface>
);

export const StatusBadge = ({ status = 'draft', type = 'default' }) => {
  const getStatusStyle = () => {
    const styles = {
      default: {
        pending: { backgroundColor: '#FFF3CD', color: '#856404' },
        approved: { backgroundColor: '#D4EDDA', color: '#155724' },
        rejected: { backgroundColor: '#F8D7DA', color: '#721C24' },
        active: { backgroundColor: '#D1ECF1', color: '#0C5460' },
        completed: { backgroundColor: '#D4EDDA', color: '#155724' },
        draft: { backgroundColor: '#F8F9FA', color: '#6C757D' },
        bootstrapped: { backgroundColor: '#E3F2FD', color: '#0D47A1' },
        pre_seed: { backgroundColor: '#F3E5F5', color: '#4A148C' },
        seed: { backgroundColor: '#E8F5E9', color: '#1B5E20' },
        series_a: { backgroundColor: '#FFF3E0', color: '#E65100' },
        series_b: { backgroundColor: '#E1F5FE', color: '#01579B' },
        series_c: { backgroundColor: '#F3E5F5', color: '#4A148C' }
      },
      research: {
        ongoing: { backgroundColor: '#D1ECF1', color: '#0C5460' },
        completed: { backgroundColor: '#D4EDDA', color: '#155724' },
        paused: { backgroundColor: '#FFF3CD', color: '#856404' },
        cancelled: { backgroundColor: '#F8D7DA', color: '#721C24' }
      },
      ipr: {
        filed: { backgroundColor: '#D1ECF1', color: '#0C5460' },
        published: { backgroundColor: '#CCE5FF', color: '#004085' },
        granted: { backgroundColor: '#D4EDDA', color: '#155724' },
        rejected: { backgroundColor: '#F8D7DA', color: '#721C24' }
      },
      startup: {
        ideation: { backgroundColor: '#F8F9FA', color: '#6C757D' },
        validation: { backgroundColor: '#E3F2FD', color: '#0D47A1' },
        early_stage: { backgroundColor: '#F3E5F5', color: '#4A148C' },
        growth: { backgroundColor: '#E8F5E9', color: '#1B5E20' },
        expansion: { backgroundColor: '#FFF3E0', color: '#E65100' },
        mature: { backgroundColor: '#E1F5FE', color: '#01579B' },
        exit: { backgroundColor: '#F3E5F5', color: '#4A148C' }
      }
    };

    // Ensure we have valid values
    const typeStyles = styles[type] || styles.default;
    return typeStyles[status] || styles.default.draft;
  };

  const statusStyle = getStatusStyle();

  return (
    <View style={[styles.statusBadge, statusStyle]}>
      <Text style={[styles.statusText, { color: statusStyle.color }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
};

export const EmptyState = ({ icon, title, description, actionText, onAction }) => (
  <View style={styles.emptyState}>
    <Ionicons name={icon} size={64} color="#ccc" />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyDescription}>{description}</Text>
    {actionText && onAction && (
      <TouchableOpacity style={styles.emptyAction} onPress={onAction}>
        <Text style={styles.emptyActionText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const LoadingCard = () => (
  <Surface style={styles.loadingCard}>
    <View style={styles.loadingContent}>
      <View style={styles.loadingLine} />
      <View style={[styles.loadingLine, { width: '60%' }]} />
      <View style={[styles.loadingLine, { width: '40%' }]} />
    </View>
  </Surface>
);

const styles = StyleSheet.create({
  statCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statTitle: {
    fontSize: 14,
    color: '#a0a0b0',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#808090',
    marginTop: 2,
  },
  actionCard: {
    marginBottom: 12,
  },
  actionSurface: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#a0a0b0',
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  infoContent: {
    // Content styles handled by children
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#a0a0b0',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    backgroundColor: 'rgba(179, 102, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(179, 102, 255, 0.5)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyActionText: {
    color: '#b366ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  loadingContent: {
    // Loading animation styles
  },
  loadingLine: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    marginBottom: 8,
  },
  loadingSpinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  }
});

export const LoadingSpinner = ({ size = 'large', color = '#667eea' }) => (
  <View style={styles.loadingSpinner}>
    <ActivityIndicator size={size} color={color} />
  </View>
);