import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Surface } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#667eea',
  },
};

export const TrendChart = ({ data, title, height = 220 }) => (
  <Surface style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    <LineChart
      data={data}
      width={screenWidth - 80}
      height={height}
      chartConfig={chartConfig}
      style={styles.chart}
      withInnerLines={false}
      withOuterLines={false}
      withVerticalLabels={true}
      withHorizontalLabels={true}
    />
  </Surface>
);

export const ColumnChart = ({ data, title, height = 220 }) => (
  <Surface style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    <BarChart
      data={data}
      width={screenWidth - 80}
      height={height}
      chartConfig={chartConfig}
      style={styles.chart}
      showValuesOnTopOfBars={true}
      withInnerLines={false}
    />
  </Surface>
);

export const DonutChart = ({ data, title, height = 220 }) => (
  <Surface style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    <PieChart
      data={data}
      width={screenWidth - 80}
      height={height}
      chartConfig={chartConfig}
      accessor="value"
      backgroundColor="transparent"
      paddingLeft="15"
      style={styles.chart}
      hasLegend={true}
    />
  </Surface>
);

export const MetricCard = ({ title, value, change, changeType, icon }) => (
  <Surface style={styles.metricCard}>
    <View style={styles.metricHeader}>
      <Text style={styles.metricTitle}>{title}</Text>
      {icon}
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    {change && (
      <View style={styles.metricChange}>
        <Text style={[
          styles.changeText,
          { color: changeType === 'increase' ? '#4CAF50' : '#f44336' }
        ]}>
          {changeType === 'increase' ? '↗' : '↘'} {change}
        </Text>
      </View>
    )}
  </Surface>
);

export const KPIGrid = ({ data }) => (
  <View style={styles.kpiGrid}>
    {data.map((kpi, index) => (
      <Surface key={index} style={styles.kpiCard}>
        <Text style={styles.kpiValue}>{kpi.value}</Text>
        <Text style={styles.kpiLabel}>{kpi.label}</Text>
        {kpi.target && (
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(kpi.value / kpi.target) * 100}%`,
                  backgroundColor: kpi.color || '#667eea'
                }
              ]} 
            />
          </View>
        )}
      </Surface>
    ))}
  </View>
);

export const ComparisonChart = ({ data, categories }) => (
  <Surface style={styles.chartContainer}>
    <Text style={styles.chartTitle}>Sector Comparison</Text>
    <View style={styles.comparisonContainer}>
      {categories.map((category, index) => {
        const value = data[category] || 0;
        const maxValue = Math.max(...Object.values(data));
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        
        return (
          <View key={index} style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>{category}</Text>
            <View style={styles.comparisonBar}>
              <View 
                style={[
                  styles.comparisonFill,
                  { 
                    width: `${percentage}%`,
                    backgroundColor: `hsl(${240 + index * 30}, 70%, 60%)`
                  }
                ]}
              />
            </View>
            <Text style={styles.comparisonValue}>{value}</Text>
          </View>
        );
      })}
    </View>
  </Surface>
);

const styles = StyleSheet.create({
  chartContainer: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    margin: 6,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
    minHeight: 100,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricChange: {
    alignSelf: 'flex-start',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  comparisonContainer: {
    paddingHorizontal: 16,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonLabel: {
    width: 80,
    fontSize: 12,
    color: '#666',
  },
  comparisonBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  comparisonFill: {
    height: '100%',
    borderRadius: 10,
  },
  comparisonValue: {
    width: 40,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
});