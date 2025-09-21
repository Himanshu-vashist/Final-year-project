import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

export const StatusBadge = ({ status, type = 'default' }) => {
  const getStatusStyle = () => {
    const styles = {
      default: {
        pending: { backgroundColor: '#FFF3CD', color: '#856404' },
        approved: { backgroundColor: '#D4EDDA', color: '#155724' },
        rejected: { backgroundColor: '#F8D7DA', color: '#721C24' },
        active: { backgroundColor: '#D1ECF1', color: '#0C5460' },
        completed: { backgroundColor: '#D4EDDA', color: '#155724' },
        draft: { backgroundColor: '#F8F9FA', color: '#6C757D' }
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
        development: { backgroundColor: '#CCE5FF', color: '#004085' },
        growth: { backgroundColor: '#D4EDDA', color: '#155724' },
        scaling: { backgroundColor: '#E2E3E5', color: '#383D41' }
      }
    };

    return styles[type][status] || styles.default[status] || styles.default.draft;
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
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    backgroundColor: '#fff',
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
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionCard: {
    marginBottom: 12,
  },
  actionSurface: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
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
    color: '#333',
    marginLeft: 8,
  },
  infoContent: {
    // Content styles handled by children
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  loadingContent: {
    // Loading animation styles
  },
  loadingLine: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 8,
  },
});