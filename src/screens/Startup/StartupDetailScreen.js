// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   TouchableOpacity,
//   Linking
// } from 'react-native';
// import { Title, Button, Chip, Avatar, Divider } from 'react-native-paper';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
// import { db } from '../../config/firebaseConfig';
// import { useAuth } from '../../context/AuthContext';
// import { StatusBadge, LoadingSpinner } from '../../components/UIComponents';

// const STARTUP_STAGE_TRANSITIONS = {
//   ideation: ['validation'],
//   validation: ['early_stage'],
//   early_stage: ['growth'],
//   growth: ['expansion'],
//   expansion: ['mature'],
//   mature: ['exit']
// };

// const FUNDING_STAGE_TRANSITIONS = {
//   bootstrapped: ['pre_seed'],
//   pre_seed: ['seed'],
//   seed: ['series_a'],
//   series_a: ['series_b'],
//   series_b: ['series_c']
// };

// export default function StartupDetailScreen({ route, navigation }) {
//   const { startupId } = route.params;
//   const { userProfile, hasPermission } = useAuth();
//   const [startup, setStartup] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [founders, setFounders] = useState([]);
//   const [investors, setInvestors] = useState([]);
//   const [timeline, setTimeline] = useState([]);
//   const [fundingRounds, setFundingRounds] = useState([]);
//   const [updating, setUpdating] = useState(false);

//   useEffect(() => {
//     loadStartupDetails();
//   }, [startupId]);

//   const loadStartupDetails = async () => {
//     try {
//       setLoading(true);
      
//       // Load startup details
//       const startupDoc = await getDoc(doc(db, 'startups', startupId));
//       if (startupDoc.exists()) {
//         const startupData = { id: startupDoc.id, ...startupDoc.data() };
//         setStartup(startupData);
        
//         // Load related data
//         await Promise.all([
//           loadFounders(startupData),
//           loadInvestors(startupData),
//           loadTimeline(startupData),
//           loadFundingRounds(startupData)
//         ]);
//       } else {
//         Alert.alert('Error', 'Startup not found');
//         navigation.goBack();
//       }
//     } catch (error) {
//       console.error('Error loading startup details:', error);
//       Alert.alert('Error', 'Failed to load startup details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadFounders = async (startupData) => {
//     if (startupData.founderIds && startupData.founderIds.length > 0) {
//       try {
//         const founderPromises = startupData.founderIds.map(async (founderId) => {
//           const founderDoc = await getDoc(doc(db, 'users', founderId));
//           return founderDoc.exists() ? { id: founderDoc.id, ...founderDoc.data() } : null;
//         });
//         const founderData = await Promise.all(founderPromises);
//         setFounders(founderData.filter(founder => founder !== null));
//       } catch (error) {
//         console.error('Error loading founders:', error);
//       }
//     }
//   };

//   const loadInvestors = async (startupData) => {
//     if (startupData.investorIds && startupData.investorIds.length > 0) {
//       try {
//         const investorPromises = startupData.investorIds.map(async (investorId) => {
//           const investorDoc = await getDoc(doc(db, 'users', investorId));
//           return investorDoc.exists() ? { id: investorDoc.id, ...investorDoc.data() } : null;
//         });
//         const investorData = await Promise.all(investorPromises);
//         setInvestors(investorData.filter(investor => investor !== null));
//       } catch (error) {
//         console.error('Error loading investors:', error);
//       }
//     }
//   };

//   const loadTimeline = async (startupData) => {
//     try {
//       const timelineQuery = query(
//         collection(db, 'startup_timeline'),
//         where('startupId', '==', startupId)
//       );
//       const timelineSnapshot = await getDocs(timelineQuery);
//       const timelineData = timelineSnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
//       setTimeline(timelineData);
//     } catch (error) {
//       console.error('Error loading timeline:', error);
//     }
//   };

//   const loadFundingRounds = async (startupData) => {
//     try {
//       const fundingQuery = query(
//         collection(db, 'funding_rounds'),
//         where('startupId', '==', startupId)
//       );
//       const fundingSnapshot = await getDocs(fundingQuery);
//       const fundingData = fundingSnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       })).sort((a, b) => new Date(b.closingDate) - new Date(a.closingDate));
      
//       setFundingRounds(fundingData);
//     } catch (error) {
//       console.error('Error loading funding rounds:', error);
//     }
//   };

//   const canEdit = () => {
//     return hasPermission('manage_startups') || startup?.userId === userProfile.uid;
//   };

//   const canUpdateStage = () => {
//     return hasPermission('manage_startups');
//   };

//   const canInvest = () => {
//     return userProfile.role === 'investor' && userProfile.uid !== startup?.userId;
//   };

//   const canConnect = () => {
//     return userProfile.uid !== startup?.userId;
//   };

//   const getStageColor = (stage) => {
//     const colors = {
//       ideation: '#2196F3',
//       validation: '#FF9800',
//       early_stage: '#9C27B0',
//       growth: '#4CAF50',
//       expansion: '#607D8B',
//       mature: '#795548',
//       exit: '#E91E63'
//     };
//     return colors[stage] || '#666';
//   };

//   const getFundingColor = (fundingStage) => {
//     const colors = {
//       bootstrapped: '#4CAF50',
//       pre_seed: '#FF9800',
//       seed: '#9C27B0',
//       series_a: '#2196F3',
//       series_b: '#607D8B',
//       series_c: '#795548'
//     };
//     return colors[fundingStage] || '#666';
//   };

//   const updateStage = async (newStage) => {
//     setUpdating(true);
//     try {
//       await updateDoc(doc(db, 'startups', startupId), {
//         stage: newStage,
//         updatedAt: new Date().toISOString()
//       });

//       // Add timeline entry
//       await addDoc(collection(db, 'startup_timeline'), {
//         startupId: startupId,
//         action: 'stage_updated',
//         description: `Startup stage updated to ${newStage.replace('_', ' ')}`,
//         userId: userProfile.uid,
//         userName: userProfile.name,
//         createdAt: new Date().toISOString(),
//         metadata: { oldStage: startup.stage, newStage }
//       });

//       setStartup(prev => ({ ...prev, stage: newStage }));
//       loadTimeline(startup);
//       Alert.alert('Success', 'Stage updated successfully');
//     } catch (error) {
//       console.error('Error updating stage:', error);
//       Alert.alert('Error', 'Failed to update stage');
//     } finally {
//       setUpdating(false);
//     }
//   };

//   const requestInvestment = async () => {
//     try {
//       await addDoc(collection(db, 'investment_requests'), {
//         startupId: startupId,
//         startupName: startup.name,
//         investorId: userProfile.uid,
//         investorName: userProfile.name,
//         status: 'pending',
//         message: `I am interested in investing in ${startup.name}. I would like to discuss potential investment opportunities.`,
//         createdAt: new Date().toISOString()
//       });

//       Alert.alert('Success', 'Investment request sent!');
//     } catch (error) {
//       console.error('Error sending investment request:', error);
//       Alert.alert('Error', 'Failed to send investment request');
//     }
//   };

//   const requestConnection = async () => {
//     try {
//       await addDoc(collection(db, 'connection_requests'), {
//         startupId: startupId,
//         startupName: startup.name,
//         requesterId: userProfile.uid,
//         requesterName: userProfile.name,
//         requesterType: userProfile.role,
//         ownerId: startup.userId,
//         status: 'pending',
//         message: `I would like to connect with ${startup.name} for potential collaboration opportunities.`,
//         createdAt: new Date().toISOString()
//       });

//       Alert.alert('Success', 'Connection request sent!');
//     } catch (error) {
//       console.error('Error sending connection request:', error);
//       Alert.alert('Error', 'Failed to send connection request');
//     }
//   };

//   const formatFunding = (amount) => {
//     if (amount >= 10000000) {
//       return `₹${(amount / 10000000).toFixed(1)} Crores`;
//     } else if (amount >= 100000) {
//       return `₹${(amount / 100000).toFixed(1)} Lakhs`;
//     } else {
//       return `₹${(amount / 1000).toFixed(0)}K`;
//     }
//   };

//   const openURL = (url) => {
//     Linking.openURL(url);
//   };

//   if (loading) {
//     return <LoadingSpinner message="Loading startup details..." />;
//   }

//   if (!startup) {
//     return (
//       <View style={styles.container}>
//         <Text>Startup not found</Text>
//       </View>
//     );
//   }

//   const availableStageTransitions = STARTUP_STAGE_TRANSITIONS[startup.stage] || [];
//   const availableFundingTransitions = FUNDING_STAGE_TRANSITIONS[startup.fundingStage] || [];

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <LinearGradient
//         colors={[getStageColor(startup.stage), '#667eea']}
//         style={styles.header}
//       >
//         <View style={styles.headerContent}>
//           <Title style={styles.headerTitle} numberOfLines={2}>
//             {startup.name}
//           </Title>
//           <View style={styles.headerBadges}>
//             <StatusBadge status={startup.stage || 'ideation'} type="startup" />
//             {startup.fundingStage && (
//               <StatusBadge 
//                 status={startup.fundingStage || 'draft'}
//                 type="default"
//               />
//             )}
//             {startup.isVerified && (
//               <View style={styles.verifiedBadge}>
//                 <Ionicons name="checkmark-circle" size={20} color="#fff" />
//                 <Text style={styles.verifiedText}>Verified</Text>
//               </View>
//             )}
//           </View>
//         </View>
//       </LinearGradient>

//       <ScrollView style={styles.content}>
//         {/* Basic Information */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>About</Text>
//           <Text style={styles.description}>{startup.description}</Text>
          
//           <View style={styles.metaInfo}>
//             <View style={styles.metaItem}>
//               <Ionicons name="person-outline" size={16} color="#666" />
//               <Text style={styles.metaText}>{startup.founderName}</Text>
//             </View>
//             <View style={styles.metaItem}>
//               <Ionicons name="business-outline" size={16} color="#666" />
//               <Text style={styles.metaText}>{startup.sector}</Text>
//             </View>
//             <View style={styles.metaItem}>
//               <Ionicons name="location-outline" size={16} color="#666" />
//               <Text style={styles.metaText}>{startup.location}</Text>
//             </View>
//             <View style={styles.metaItem}>
//               <Ionicons name="calendar-outline" size={16} color="#666" />
//               <Text style={styles.metaText}>
//                 Founded: {new Date(startup.foundingDate).toLocaleDateString()}
//               </Text>
//             </View>
//             {startup.website && (
//               <TouchableOpacity
//                 style={styles.metaItem}
//                 onPress={() => openURL(startup.website)}
//               >
//                 <Ionicons name="globe-outline" size={16} color="#2196F3" />
//                 <Text style={[styles.metaText, { color: '#2196F3' }]}>
//                   {startup.website}
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         {/* Key Metrics */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Key Metrics</Text>
//           <View style={styles.metricsGrid}>
//             {startup.employeeCount && (
//               <View style={styles.metricCard}>
//                 <Ionicons name="people-outline" size={24} color="#4CAF50" />
//                 <Text style={styles.metricValue}>{startup.employeeCount}</Text>
//                 <Text style={styles.metricLabel}>Employees</Text>
//               </View>
//             )}
//             {startup.revenue && (
//               <View style={styles.metricCard}>
//                 <Ionicons name="trending-up-outline" size={24} color="#2196F3" />
//                 <Text style={styles.metricValue}>{formatFunding(startup.revenue)}</Text>
//                 <Text style={styles.metricLabel}>Revenue</Text>
//               </View>
//             )}
//             {startup.totalFunding && (
//               <View style={styles.metricCard}>
//                 <Ionicons name="cash-outline" size={24} color="#9C27B0" />
//                 <Text style={styles.metricValue}>{formatFunding(startup.totalFunding)}</Text>
//                 <Text style={styles.metricLabel}>Total Funding</Text>
//               </View>
//             )}
//             {startup.valuation && (
//               <View style={styles.metricCard}>
//                 <Ionicons name="diamond-outline" size={24} color="#FF9800" />
//                 <Text style={styles.metricValue}>{formatFunding(startup.valuation)}</Text>
//                 <Text style={styles.metricLabel}>Valuation</Text>
//               </View>
//             )}
//           </View>
//         </View>

//         {/* Tags */}
//         {startup.tags && startup.tags.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Technologies & Focus Areas</Text>
//             <View style={styles.tagsContainer}>
//               {startup.tags.map((tag, index) => (
//                 <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
//                   {tag}
//                 </Chip>
//               ))}
//             </View>
//           </View>
//         )}

//         {/* Business Model */}
//         {startup.businessModel && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Business Model</Text>
//             <Text style={styles.content}>{startup.businessModel}</Text>
//           </View>
//         )}

//         {/* Problem & Solution */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Problem & Solution</Text>
//           {startup.problemStatement && (
//             <View style={styles.subsection}>
//               <Text style={styles.subsectionTitle}>Problem Statement</Text>
//               <Text style={styles.content}>{startup.problemStatement}</Text>
//             </View>
//           )}
//           {startup.solution && (
//             <View style={styles.subsection}>
//               <Text style={styles.subsectionTitle}>Solution</Text>
//               <Text style={styles.content}>{startup.solution}</Text>
//             </View>
//           )}
//         </View>

//         {/* Market Information */}
//         {startup.marketSize && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Market Information</Text>
//             <View style={styles.subsection}>
//               <Text style={styles.subsectionTitle}>Market Size</Text>
//               <Text style={styles.content}>{startup.marketSize}</Text>
//             </View>
//             {startup.targetMarket && (
//               <View style={styles.subsection}>
//                 <Text style={styles.subsectionTitle}>Target Market</Text>
//                 <Text style={styles.content}>{startup.targetMarket}</Text>
//               </View>
//             )}
//             {startup.competitors && (
//               <View style={styles.subsection}>
//                 <Text style={styles.subsectionTitle}>Competitive Landscape</Text>
//                 <Text style={styles.content}>{startup.competitors}</Text>
//               </View>
//             )}
//           </View>
//         )}

//         {/* Founders */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Founders & Team</Text>
//           {founders.length > 0 ? (
//             founders.map((founder) => (
//               <View key={founder.id} style={styles.founderCard}>
//                 <Avatar.Text
//                   size={50}
//                   label={founder.name.charAt(0)}
//                   style={styles.founderAvatar}
//                 />
//                 <View style={styles.founderInfo}>
//                   <Text style={styles.founderName}>{founder.name}</Text>
//                   <Text style={styles.founderTitle}>{founder.title || 'Co-Founder'}</Text>
//                   <Text style={styles.founderBio}>{founder.bio}</Text>
//                 </View>
//               </View>
//             ))
//           ) : (
//             <View style={styles.founderCard}>
//               <Avatar.Text
//                 size={50}
//                 label={startup.founderName.charAt(0)}
//                 style={styles.founderAvatar}
//               />
//               <View style={styles.founderInfo}>
//                 <Text style={styles.founderName}>{startup.founderName}</Text>
//                 <Text style={styles.founderTitle}>Founder</Text>
//               </View>
//             </View>
//           )}
//         </View>

//         {/* Funding Rounds */}
//         {fundingRounds.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Funding History</Text>
//             {fundingRounds.map((round) => (
//               <View key={round.id} style={styles.fundingRoundCard}>
//                 <View style={styles.fundingRoundHeader}>
//                   <StatusBadge 
//                     status={round.roundType || 'draft'}
//                     type="default"
//                   />
//                   <Text style={styles.fundingDate}>
//                     {new Date(round.closingDate).toLocaleDateString()}
//                   </Text>
//                 </View>
//                 <Text style={styles.fundingAmount}>
//                   {formatFunding(round.amount)}
//                 </Text>
//                 {round.investors && round.investors.length > 0 && (
//                   <Text style={styles.fundingInvestors}>
//                     Investors: {round.investors.join(', ')}
//                   </Text>
//                 )}
//                 {round.description && (
//                   <Text style={styles.fundingDescription}>{round.description}</Text>
//                 )}
//               </View>
//             ))}
//           </View>
//         )}

//         {/* Current Fundraising */}
//         {startup.currentFundraising && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Current Fundraising</Text>
//             <View style={styles.fundraisingCard}>
//               <View style={styles.fundraisingHeader}>
//                 <Ionicons name="megaphone-outline" size={24} color="#FF9800" />
//                 <Text style={styles.fundraisingTitle}>
//                   {startup.currentFundraisingType} Round
//                 </Text>
//               </View>
//               {startup.targetAmount && (
//                 <Text style={styles.fundraisingAmount}>
//                   Target: {formatFunding(startup.targetAmount)}
//                 </Text>
//               )}
//               {startup.fundraisingDescription && (
//                 <Text style={styles.fundraisingDescription}>
//                   {startup.fundraisingDescription}
//                 </Text>
//               )}
//             </View>
//           </View>
//         )}

//         {/* Investors */}
//         {investors.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Investors</Text>
//             {investors.map((investor) => (
//               <View key={investor.id} style={styles.investorCard}>
//                 <Avatar.Text
//                   size={40}
//                   label={investor.name.charAt(0)}
//                   style={styles.investorAvatar}
//                 />
//                 <View style={styles.investorInfo}>
//                   <Text style={styles.investorName}>{investor.name}</Text>
//                   <Text style={styles.investorOrg}>{investor.organization}</Text>
//                 </View>
//               </View>
//             ))}
//           </View>
//         )}

//         {/* Documents & Links */}
//         {(startup.documents?.length > 0 || startup.links?.length > 0) && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Resources</Text>
            
//             {startup.documents?.map((doc, index) => (
//               <TouchableOpacity
//                 key={index}
//                 style={styles.resourceItem}
//                 onPress={() => openURL(doc.url)}
//               >
//                 <Ionicons name="document-outline" size={20} color="#9C27B0" />
//                 <Text style={styles.resourceName}>{doc.name}</Text>
//                 <Ionicons name="open-outline" size={16} color="#666" />
//               </TouchableOpacity>
//             ))}

//             {startup.links?.map((link, index) => (
//               <TouchableOpacity
//                 key={index}
//                 style={styles.resourceItem}
//                 onPress={() => openURL(link.url)}
//               >
//                 <Ionicons name="link-outline" size={20} color="#2196F3" />
//                 <Text style={styles.resourceName}>{link.title}</Text>
//                 <Ionicons name="open-outline" size={16} color="#666" />
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}

//         {/* Timeline */}
//         {timeline.length > 0 && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Activity Timeline</Text>
//             {timeline.slice(0, 5).map((event) => (
//               <View key={event.id} style={styles.timelineItem}>
//                 <View style={styles.timelineDot} />
//                 <View style={styles.timelineContent}>
//                   <Text style={styles.timelineDescription}>{event.description}</Text>
//                   <View style={styles.timelineMeta}>
//                     <Text style={styles.timelineUser}>{event.userName}</Text>
//                     <Text style={styles.timelineDate}>
//                       {new Date(event.createdAt).toLocaleDateString()}
//                     </Text>
//                   </View>
//                 </View>
//               </View>
//             ))}
//           </View>
//         )}

//         {/* Action Buttons */}
//         <View style={styles.actionSection}>
//           {/* Edit Button */}
//           {canEdit() && (
//             <Button
//               mode="outlined"
//               onPress={() => navigation.navigate('RegisterStartup', { startupId, editMode: true })}
//               style={styles.actionButton}
//               icon="pencil-outline"
//             >
//               Edit Profile
//             </Button>
//           )}

//           {/* Stage Update Buttons */}
//           {canUpdateStage() && availableStageTransitions.length > 0 && (
//             <View style={styles.stageActions}>
//               <Text style={styles.actionLabel}>Update Stage:</Text>
//               <View style={styles.stageButtons}>
//                 {availableStageTransitions.map((stage) => (
//                   <Button
//                     key={stage}
//                     mode="contained"
//                     onPress={() => updateStage(stage)}
//                     style={[styles.stageButton, { backgroundColor: getStageColor(stage) }]}
//                     loading={updating}
//                     disabled={updating}
//                     compact
//                   >
//                     {stage.replace('_', ' ')}
//                   </Button>
//                 ))}
//               </View>
//             </View>
//           )}

//           {/* Investment & Connection Actions */}
//           <View style={styles.connectionActions}>
//             {canInvest() && startup.currentFundraising && (
//               <Button
//                 mode="contained"
//                 onPress={requestInvestment}
//                 style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
//                 icon="cash-outline"
//               >
//                 Express Investment Interest
//               </Button>
//             )}
            
//             {canConnect() && (
//               <Button
//                 mode="outlined"
//                 onPress={requestConnection}
//                 style={styles.actionButton}
//                 icon="people-outline"
//               >
//                 Connect & Collaborate
//               </Button>
//             )}
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   header: {
//     paddingTop: 40,
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//   },
//   headerContent: {
//     gap: 8,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   headerBadges: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   verifiedBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   verifiedText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   content: {
//     flex: 1,
//     padding: 20,
//   },
//   section: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 12,
//   },
//   subsection: {
//     marginBottom: 12,
//   },
//   subsectionTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 6,
//   },
//   description: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//     marginBottom: 12,
//   },
//   metaInfo: {
//     gap: 8,
//   },
//   metaItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   metaText: {
//     fontSize: 14,
//     color: '#666',
//     marginLeft: 8,
//   },
//   metricsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   metricCard: {
//     width: '48%',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     padding: 12,
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   metricValue: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 4,
//   },
//   metricLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 2,
//   },
//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   tag: {
//     height: 28,
//     marginRight: 8,
//     marginBottom: 8,
//     backgroundColor: '#f0f0f0',
//   },
//   tagText: {
//     fontSize: 12,
//   },
//   founderCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   founderAvatar: {
//     backgroundColor: '#E91E63',
//   },
//   founderInfo: {
//     marginLeft: 12,
//     flex: 1,
//   },
//   founderName: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//   },
//   founderTitle: {
//     fontSize: 12,
//     color: '#E91E63',
//     marginTop: 2,
//   },
//   founderBio: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 4,
//   },
//   fundingRoundCard: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 8,
//   },
//   fundingRoundHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 6,
//   },
//   fundingDate: {
//     fontSize: 12,
//     color: '#666',
//   },
//   fundingAmount: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#4CAF50',
//     marginBottom: 4,
//   },
//   fundingInvestors: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 4,
//   },
//   fundingDescription: {
//     fontSize: 12,
//     color: '#666',
//   },
//   fundraisingCard: {
//     backgroundColor: '#FFF3E0',
//     borderRadius: 8,
//     padding: 12,
//   },
//   fundraisingHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   fundraisingTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#FF9800',
//     marginLeft: 8,
//   },
//   fundraisingAmount: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 6,
//   },
//   fundraisingDescription: {
//     fontSize: 12,
//     color: '#666',
//   },
//   investorCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 6,
//   },
//   investorAvatar: {
//     backgroundColor: '#4CAF50',
//   },
//   investorInfo: {
//     marginLeft: 12,
//     flex: 1,
//   },
//   investorName: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//   },
//   investorOrg: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 2,
//   },
//   resourceItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     marginBottom: 8,
//   },
//   resourceName: {
//     flex: 1,
//     fontSize: 14,
//     color: '#333',
//     marginLeft: 8,
//   },
//   timelineItem: {
//     flexDirection: 'row',
//     paddingVertical: 8,
//   },
//   timelineDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#E91E63',
//     marginTop: 6,
//     marginRight: 12,
//   },
//   timelineContent: {
//     flex: 1,
//   },
//   timelineDescription: {
//     fontSize: 14,
//     color: '#333',
//     marginBottom: 4,
//   },
//   timelineMeta: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   timelineUser: {
//     fontSize: 12,
//     color: '#E91E63',
//     fontWeight: '600',
//   },
//   timelineDate: {
//     fontSize: 12,
//     color: '#666',
//   },
//   actionSection: {
//     marginBottom: 40,
//   },
//   actionButton: {
//     marginBottom: 12,
//     borderColor: '#E91E63',
//   },
//   stageActions: {
//     marginBottom: 16,
//   },
//   actionLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//   },
//   stageButtons: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   stageButton: {
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   connectionActions: {
//     gap: 8,
//   },
// });


/** 
 * STARTUP DETAIL SCREEN – DASHBOARD THEME UI  
 * Includes: 
 * - Dark gradient background
 * - Glassmorphism Cards
 * - Purple Accent Glow (#b366ff)
 * - Dashboard-style metrics & sections
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Avatar, Button, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, LoadingSpinner } from '../../components/UIComponents';

export default function StartupDetailScreen({ route, navigation }) {
  const { startupId } = route.params;
  const { currentUser, userProfile, hasPermission } = useAuth();

  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasRequestedInvestment, setHasRequestedInvestment] = useState(false);
  const [hasRequestedConnection, setHasRequestedConnection] = useState(false);
  const [investmentRequests, setInvestmentRequests] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [founders, setFounders] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [fundingRounds, setFundingRounds] = useState([]);

  useEffect(() => {
    loadStartup();
  }, [startupId]);

  const loadStartup = async () => {
    try {
      setLoading(true);
      const docSnap = await getDoc(doc(db, "startups", startupId));
      if (!docSnap.exists()) {
        Alert.alert("Error", "Startup not found");
        return navigation.goBack();
      }
      const data = { id: docSnap.id, ...docSnap.data() };
      setStartup(data);
      await loadExtra(data);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to load startup");
    }
    setLoading(false);
  };

  const loadExtra = async (startupData) => {
    loadFounders(startupData);
    loadTimeline(startupData);
    loadFundingHistory(startupData);
    checkExistingRequests(startupData.id);
    
    // If the user is the owner, load the requests they've received
    if (currentUser?.uid === startupData.userId) {
      loadReceivedRequests(startupData.id);
    }
  };

  const loadReceivedRequests = async (id) => {
    try {
      // Load investment requests
      const invQ = query(collection(db, 'investment_requests'), where('startupId', '==', id));
      const invSnap = await getDocs(invQ);
      setInvestmentRequests(invSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Load connection requests
      const connQ = query(collection(db, 'connection_requests'), where('startupId', '==', id));
      const connSnap = await getDocs(connQ);
      setConnectionRequests(connSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading received requests:', error);
    }
  };

  const checkExistingRequests = async (id) => {
    if (!currentUser) return;
    try {
      // Check investment requests
      const invQ = query(
        collection(db, 'investment_requests'),
        where('startupId', '==', id),
        where('investorId', '==', currentUser.uid)
      );
      const invSnap = await getDocs(invQ);
      setHasRequestedInvestment(!invSnap.empty);

      // Check connection requests
      const connQ = query(
        collection(db, 'connection_requests'),
        where('startupId', '==', id),
        where('requesterId', '==', currentUser.uid)
      );
      const connSnap = await getDocs(connQ);
      setHasRequestedConnection(!connSnap.empty);
    } catch (error) {
      console.error('Error checking existing requests:', error);
    }
  };

  const loadFounders = async (startupData) => {
    if (!startupData.founders) return;
    setFounders(startupData.founders);
  };

  const loadTimeline = async (startupData) => {
    const q = query(
      collection(db, "startup_timeline"),
      where("startupId", "==", startupData.id)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setTimeline(items);
  };

  const loadFundingHistory = async (startupData) => {
    const q = query(
      collection(db, "funding_rounds"),
      where("startupId", "==", startupData.id)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setFundingRounds(items);
  };

  // INVESTOR ACTIONS
  const requestInvestment = async () => {
    if (actionLoading || !currentUser) return;
    try {
      setActionLoading(true);
      await addDoc(collection(db, 'investment_requests'), {
        startupId: startup.id,
        startupName: startup.name,
        investorId: currentUser.uid,
        investorName: userProfile?.name || currentUser.email || 'Anonymous Investor',
        ownerId: startup.userId,
        status: 'pending',
        message: `I am interested in investing in ${startup.name}. I would like to discuss potential investment opportunities.`,
        createdAt: new Date().toISOString()
      });
      setHasRequestedInvestment(true);
      Alert.alert('Success', 'Investment interest sent to founder!');
    } catch (error) {
      console.error('Error sending investment request:', error);
      Alert.alert('Error', 'Failed to send request. Check your permissions.');
    } finally {
      setActionLoading(false);
    }
  };

  const requestConnection = async () => {
    if (actionLoading || !currentUser) return;
    try {
      setActionLoading(true);
      await addDoc(collection(db, 'connection_requests'), {
        startupId: startup.id,
        startupName: startup.name,
        requesterId: currentUser.uid,
        requesterName: userProfile?.name || currentUser.email || 'Anonymous User',
        requesterType: userProfile?.role || 'user',
        ownerId: startup.userId,
        status: 'pending',
        message: `I would like to connect with ${startup.name} for potential collaboration opportunities.`,
        createdAt: new Date().toISOString()
      });
      setHasRequestedConnection(true);
      Alert.alert('Success', 'Connection request sent!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      Alert.alert('Error', 'Failed to send connection request.');
    } finally {
      setActionLoading(false);
    }
  };

  // OPEN LINKS
  const openURL = (url) => Linking.openURL(url);

  const isOwner = currentUser?.uid === startup?.userId || userProfile?.uid === startup?.userId;
  const isInvestor = userProfile?.role === 'investor';

  if (loading) return <LoadingSpinner message="Loading Startup..." />;

  return (
    <LinearGradient
      colors={["#1a1a3e", "#2d2d5f", "#1a1a3e"]}
      style={styles.container}
    >

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{startup.name}</Text>

        <View style={styles.headerBadges}>
          <StatusBadge status={startup.stage} type="startup" />{startup.fundingStage && (
            <StatusBadge status={startup.fundingStage} />
          )}{startup.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}</View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>

        {/* ABOUT SECTION */}
        <GlassCard title="About">
          <Text style={styles.description}>{startup.description}</Text>

          <View style={styles.metaList}>
            <Meta icon="person-outline" text={startup.founderName} />
            <Meta icon="business-outline" text={startup.sector} />
            <Meta icon="location-outline" text={startup.location} />
            <Meta
              icon="calendar-outline"
              text={`Founded: ${new Date(startup.foundingDate).toLocaleDateString()}`}
            />{startup.website && (
              <TouchableOpacity onPress={() => openURL(startup.website)}>
                <Meta icon="globe-outline" text={startup.website} link />
              </TouchableOpacity>
            )}</View>
        </GlassCard>

        {/* METRICS GRID */}
        <GlassCard title="Key Metrics">
          <View style={styles.metricsGrid}>
            {metric(startup.employeeCount, "people-outline", "Employees")}{metric(startup.totalFunding, "cash-outline", "Total Funding")}{metric(startup.valuation, "diamond-outline", "Valuation")}{metric(startup.currentRevenue, "trending-up-outline", "Revenue")}</View>
        </GlassCard>

        {/* TAGS */}
        {startup.tags?.length > 0 && (
          <GlassCard title="Technologies / Tags">
            <View style={styles.tagsContainer}>{startup.tags.map((tag, i) => (
                <Chip key={i} style={styles.tag} textStyle={{ color: "#fff" }}>
                  {tag}
                </Chip>
              ))}</View>
          </GlassCard>
        )}

        {/* PROBLEM / SOLUTION */}
        <GlassCard title="Problem & Solution">
          <SubSection title="Problem" content={startup.problemStatement} />
          <SubSection title="Solution" content={startup.solution} />
        </GlassCard>

        {/* FOUNDERS */}
        <GlassCard title="Founders">
          {founders.map((f, i) => (
            <View key={i} style={styles.founderCard}>
              <Avatar.Text
                label={f.name?.charAt(0)}
                size={50}
                style={styles.founderAvatar}
              />
              <View style={styles.founderInfo}>
                <Text style={styles.founderName}>{f.name}</Text>
                <Text style={styles.founderTitle}>{f.role || "Founder"}</Text>
                <Text style={styles.founderBio}>{f.bio}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* FUNDING HISTORY */}
        {fundingRounds.length > 0 && (
          <GlassCard title="Funding History">
            {fundingRounds.map((fr) => (
              <View key={fr.id} style={styles.fundingRow}>
                <StatusBadge status={fr.roundType} />
                <Text style={styles.fundingAmount}>
                  ₹{fr.amount?.toLocaleString()}
                </Text>
                <Text style={styles.fundingDate}>
                  {new Date(fr.closingDate).toDateString()}
                </Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* MANAGEMENT SECTION (OWNER ONLY) */}
        {isOwner && (
          <GlassCard title="Management: Requests">
            {investmentRequests.length === 0 && connectionRequests.length === 0 ? (
              <Text style={styles.noRequestsText}>No requests received yet.</Text>
            ) : (
              <>
                {investmentRequests.length > 0 && (
                  <View style={styles.requestSubSection}>
                    <Text style={styles.requestSubTitle}>Investment Interests ({investmentRequests.length})</Text>
                    {investmentRequests.map((req) => (
                      <View key={req.id} style={styles.requestItem}>
                        <Ionicons name="cash-outline" size={18} color="#4CAF50" />
                        <View style={styles.requestContent}>
                          <Text style={styles.requestUser}>{req.investorName}</Text>
                          <Text style={styles.requestMsg} numberOfLines={2}>{req.message}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                
                {connectionRequests.length > 0 && (
                  <View style={styles.requestSubSection}>
                    <Text style={styles.requestSubTitle}>Connection Requests ({connectionRequests.length})</Text>
                    {connectionRequests.map((req) => (
                      <View key={req.id} style={styles.requestItem}>
                        <Ionicons name="people-outline" size={18} color="#2196F3" />
                        <View style={styles.requestContent}>
                          <Text style={styles.requestUser}>{req.requesterName} ({req.requesterType})</Text>
                          <Text style={styles.requestMsg} numberOfLines={2}>{req.message}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </GlassCard>
        )}

        {/* TIMELINE */}
        {timeline.length > 0 && (
          <GlassCard title="Activity Timeline">
            {timeline.map((t) => (
              <View key={t.id} style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <View>
                  <Text style={styles.timelineDescription}>{t.description}</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        <View style={styles.actions}>
          {isOwner && (
            <GradientButton
              label="Edit Profile"
              icon="pencil"
              onPress={() =>
                navigation.navigate("RegisterStartup", {
                  startupId,
                  editMode: true
                })
              }
              loading={actionLoading}
            />
          )}
          {isInvestor && (
            <GradientButton
              label={hasRequestedInvestment ? "Interest Expressed" : "Express Investment Interest"}
              icon={hasRequestedInvestment ? "checkmark-done-outline" : "cash-outline"}
              onPress={requestInvestment}
              loading={actionLoading}
              disabled={hasRequestedInvestment}
            />
          )}
          {!isOwner && (
            <GradientButton
              label={hasRequestedConnection ? "Connection Requested" : "Connect & Collaborate"}
              icon={hasRequestedConnection ? "checkmark-done-outline" : "people-outline"}
              outlined
              onPress={requestConnection}
              loading={actionLoading}
              disabled={hasRequestedConnection}
            />
          )}
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

/* ---------------------------------------------------
   REUSABLE DASHBOARD UI COMPONENTS
--------------------------------------------------- */

const GlassCard = ({ title, children }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

const Meta = ({ icon, text, link }) => (
  <View style={styles.metaRow}>
    <Ionicons name={icon} size={16} color={link ? "#699bff" : "#aaa"} />
    <Text style={[styles.metaText, link && { color: "#699bff" }]}>{text}</Text>
  </View>
);

const SubSection = ({ title, content }) =>
  content ? (
    <View style={styles.subSection}>
      <Text style={styles.subSectionTitle}>{title}</Text>
      <Text style={styles.subSectionContent}>{content}</Text>
    </View>
  ) : null;

const GradientButton = ({ label, icon, outlined, onPress, loading, disabled }) => {
  const isDisabled = loading || disabled;
  if (outlined) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        style={[styles.outlinedBtn, isDisabled && { opacity: 0.6 }]} 
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#b366ff" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={icon} size={18} color="#b366ff" />
            <Text style={styles.outlinedText}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.gradientBtn, isDisabled && { opacity: 0.8 }]} 
      disabled={isDisabled}
    >
      <LinearGradient
        colors={isDisabled ? ["#555", "#444", "#333"] : ["#b366ff", "#8b3dc7", "#6a2c96"]}
        style={styles.gradientInner}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={icon} size={18} color="#fff" />
            <Text style={styles.gradientText}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

/* ---------------------------------------------------
   DASHBOARD STYLE SHEET
--------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a3e",
  },

  /* HEADER */
  header: {
    paddingTop: 70,
    paddingHorizontal: 25,
    paddingBottom: 30,
  },

  headerTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
    textShadowColor: "rgba(179,102,255,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  headerBadges: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(179, 102, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  verifiedText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 4,
    fontSize: 13,
  },

  /* CONTENT */
  content: {
    paddingHorizontal: 18,
    marginTop: -10,
  },

  /* GLASS CARD */
  card: {
    backgroundColor: "rgba(255,255,255,0.07)",
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(179,102,255,0.35)",
    shadowColor: "#b366ff",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },

  cardTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.6,
    textShadowColor: "rgba(179,102,255,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  description: {
    fontSize: 15,
    color: "#ddd",
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.9,
  },

  /* META ROWS */
  metaList: { gap: 10 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    color: "#cfcaff",
    fontSize: 14,
    marginLeft: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  /* METRICS GRID */
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  metricCard: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "rgba(179,102,255,0.4)",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#b366ff",
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },

  metricValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "#b366ff",
    textShadowRadius: 6,
  },

  metricLabel: {
    color: "#ccc",
    marginTop: 4,
    fontSize: 13,
  },

  /* TAGS */
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  tag: {
    backgroundColor: "rgba(179,102,255,0.3)",
    borderRadius: 14,
    height: 32,
    justifyContent: "center",
  },

  /* FOUNDERS */
  founderCard: {
    flexDirection: "row",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  founderAvatar: {
    backgroundColor: "#b366ff",
    elevation: 6,
  },

  founderInfo: { marginLeft: 12, flex: 1 },

  founderName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  founderTitle: {
    color: "#b366ff",
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
  },

  founderBio: {
    color: "#ccc",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },

  /* FUNDING ROWS */
  fundingRow: {
    paddingVertical: 10,
    marginBottom: 3,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  /* REQUESTS MANAGEMENT */
  requestSubSection: {
    marginBottom: 15,
  },
  requestSubTitle: {
    color: "#b366ff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  requestContent: {
    marginLeft: 10,
    flex: 1,
  },
  requestUser: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  requestMsg: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  noRequestsText: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },

  fundingAmount: {
    color: "#6dff9b",
    fontWeight: "700",
    marginTop: 4,
    fontSize: 16,
  },

  fundingDate: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },

  /* TIMELINE */
  timelineRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  timelineDot: {
    width: 10,
    height: 10,
    backgroundColor: "#b366ff",
    borderRadius: 20,
    shadowColor: "#b366ff",
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  timelineDescription: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },

  timelineDate: {
    color: "#888",
    fontSize: 12,
  },

  /* BUTTONS */
  gradientBtn: {
    marginBottom: 14,
  },

  gradientInner: {
    borderRadius: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  gradientText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  outlinedBtn: {
    borderWidth: 1.5,
    borderColor: "#b366ff",
    borderRadius: 20,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  outlinedText: {
    color: "#b366ff",
    fontSize: 15,
    fontWeight: "700",
  },

  actions: {
    marginBottom: 70,
    marginTop: 10,
  },
});

/* METRIC HELPER */
function metric(value, icon, label) {
  if (!value) return null;
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={24} color="#b366ff" />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
