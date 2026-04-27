import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/geminiConfig';

const { width } = Dimensions.get('window');

export default function ChatbotScreen() {
  const { theme } = useTheme();
  
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I am your AI assistant powered by Gemini. You can ask me questions regarding business, funding application processes, or startup guidance. How can I help you today?', isUser: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  // Keep track of the model that worked to skip discovery next time
  const [cachedModel, setCachedModel] = useState(null);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isLoading]);

  const fetchGeminiResponse = async (userText) => {
    // 1. If we already found a model that works, use it immediately
    if (cachedModel) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${cachedModel}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userText }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            })
          }
        );
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          return data.candidates[0].content.parts[0].text;
        }
        // If cached model fails (e.g. rate limit), fallback to discovery
        setCachedModel(null);
      } catch (err) {
        setCachedModel(null);
      }
    }

    // 2. Discover/Attempt models
    const primaryAttemptModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-pro'
    ];

    for (const model of primaryAttemptModels) {
      try {
        const modelId = `models/${model}`;
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userText }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            })
          }
        );

        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          setCachedModel(modelId); // Remember this model
          return data.candidates[0].content.parts[0].text;
        }
        if (data.error && data.error.code === 404) continue;
      } catch (err) { continue; }
    }

    // 3. Deep Discovery
    try {
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
      const listData = await listResponse.json();
      
      if (listData.models && listData.models.length > 0) {
        const compatibleModel = listData.models.find(m => m.supportedGenerationMethods.includes('generateContent'));
        if (compatibleModel) {
          setCachedModel(compatibleModel.name);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${compatibleModel.name}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: userText }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
              })
            }
          );
          const data = await response.json();
          if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
          }
        }
      }
    } catch (err) { console.error("Discovery failed", err); }

    return "I am sorry, I couldn't find a compatible model for your API key. Please check your internet connection or verify the key in Google AI Studio.";
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), text: inputText.trim(), isUser: true };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Get real AI response
    const botText = await fetchGeminiResponse(currentInput);
    const botResponse = { id: (Date.now() + 1).toString(), text: botText, isUser: false };
    setMessages(prev => [...prev, botResponse]);
    setIsLoading(false);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.isUser;
    return (
      <View style={[styles.messageBubble, { 
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        backgroundColor: isUser ? '#b366ff' : 'rgba(255,255,255,0.05)',
        borderBottomRightRadius: isUser ? 0 : 16,
        borderBottomLeftRadius: isUser ? 16 : 0,
        borderLeftWidth: isUser ? 0 : 3,
        borderLeftColor: isUser ? 'transparent' : '#b366ff',
      }]}>
        <Text style={{ color: '#fff', fontSize: 16, lineHeight: 24, fontWeight: isUser ? '500' : '400' }}>{item.text}</Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0f1226', '#171735']} style={styles.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.botIcon}>
             <Ionicons name="chatbubbles" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Business Assistant</Text>
            <Text style={styles.headerSubtitle}>Online | Specialized Guidance</Text>
          </View>
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={isLoading ? (
              <View style={[styles.messageBubble, { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.05)', borderBottomLeftRadius: 0, borderLeftWidth: 3, borderLeftColor: '#b366ff' }]}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontStyle: 'italic' }}>Generating response from model...</Text>
              </View>
            ) : null}
          />
          
          <View style={styles.inputArea}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, isLoading && { opacity: 0.5 }]}
                placeholder={isLoading ? "Please wait..." : "Ask about business, funding..."}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                multiline
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  { backgroundColor: (inputText.trim() && !isLoading) ? '#b366ff' : 'rgba(179,102,255,0.2)' }
                ]} 
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons name="send" size={20} color={(inputText.trim() && !isLoading) ? "#fff" : "rgba(255,255,255,0.3)"} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  keyboardView: {
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
  botIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#b366ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#cfcfe6',
    fontSize: 12,
  },
  messageList: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  inputArea: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(179,102,255,0.2)',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: '#fff',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

