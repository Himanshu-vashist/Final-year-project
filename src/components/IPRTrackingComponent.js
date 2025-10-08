import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, ProgressBar, Text, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

const IPR_STAGES = {
  draft: { index: 0, color: '#9E9E9E', label: 'Draft' },
  filed: { index: 1, color: '#2196F3', label: 'Filed' },
  published: { index: 2, color: '#FF9800', label: 'Published' },
  examined: { index: 3, color: '#9C27B0', label: 'Under Examination' },
  granted: { index: 4, color: '#4CAF50', label: 'Granted' },
  rejected: { index: 5, color: '#F44336', label: 'Rejected' }
};

export const IPRTrackingComponent = ({ application, isGovernmentView = false }) => {
  const currentStage = IPR_STAGES[application.status];
  const progress = currentStage ? (currentStage.index / (Object.keys(IPR_STAGES).length - 1)) : 0;

  const renderTimeline = () => {
    return (
      <View style={styles.timeline}>
        <ProgressBar
          progress={progress}
          color={currentStage?.color || '#9E9E9E'}
          style={styles.progressBar}
        />
        <View style={styles.stagesContainer}>
          {Object.entries(IPR_STAGES).map(([stage, info]) => (
            <View
              key={stage}
              style={[
                styles.stagePoint,
                { backgroundColor: application.status === stage ? info.color : '#E0E0E0' }
              ]}
            />
          ))}
        </View>
        <View style={styles.stageLabels}>
          {Object.entries(IPR_STAGES).map(([stage, info]) => (
            <Text
              key={stage}
              style={[
                styles.stageLabel,
                { color: application.status === stage ? info.color : '#757575' }
              ]}
            >
              {info.label}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderStatusUpdates = () => {
    return (
      <View style={styles.updates}>
        {application.statusUpdates?.map((update, index) => (
          <Card key={index} style={styles.updateCard}>
            <Card.Content>
              <View style={styles.updateHeader}>
                <Chip
                  icon={() => (
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={IPR_STAGES[update.status]?.color || '#757575'}
                    />
                  )}
                  style={[styles.statusChip, { backgroundColor: IPR_STAGES[update.status]?.color + '20' }]}
                >
                  {IPR_STAGES[update.status]?.label}
                </Chip>
                <Text style={styles.updateDate}>
                  {moment(update.timestamp.toDate()).format('MMM DD, YYYY')}
                </Text>
              </View>
              <Paragraph style={styles.updateNotes}>{update.notes}</Paragraph>
              {isGovernmentView && (
                <Text style={styles.updateBy}>Updated by: {update.updatedBy}</Text>
              )}
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.trackingCard}>
        <Card.Content>
          <Title>Application Progress</Title>
          {renderTimeline()}
          <View style={styles.detailsContainer}>
            <View style={styles.detail}>
              <Ionicons name="document-text-outline" size={20} color="#757575" />
              <Text style={styles.detailText}>
                Application ID: {application.applicationNumber}
              </Text>
            </View>
            <View style={styles.detail}>
              <Ionicons name="calendar-outline" size={20} color="#757575" />
              <Text style={styles.detailText}>
                Filed: {moment(application.filingDate.toDate()).format('MMM DD, YYYY')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.updatesCard}>
        <Card.Content>
          <Title>Status Updates</Title>
          {renderStatusUpdates()}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  trackingCard: {
    margin: 16,
    elevation: 2,
  },
  timeline: {
    marginVertical: 20,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  stagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  stagePoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  stageLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stageLabel: {
    fontSize: 10,
    textAlign: 'center',
    width: 60,
    marginHorizontal: -15,
  },
  detailsContainer: {
    marginTop: 16,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailText: {
    marginLeft: 8,
    color: '#424242',
  },
  updatesCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  updates: {
    marginTop: 8,
  },
  updateCard: {
    marginVertical: 8,
    backgroundColor: '#FAFAFA',
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    height: 24,
  },
  updateDate: {
    fontSize: 12,
    color: '#757575',
  },
  updateNotes: {
    fontSize: 14,
    color: '#424242',
    marginTop: 4,
  },
  updateBy: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 8,
    fontStyle: 'italic',
  },
});