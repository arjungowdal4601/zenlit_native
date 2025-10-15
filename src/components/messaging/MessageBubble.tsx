import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type ChatMsg = {
  id: string;
  text: string;
  sentAt: string;
  fromMe: boolean;
};

const formatMessageTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
};

export type MessageBubbleProps = {
  message: ChatMsg;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isMe = message.fromMe;
  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowPeer]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubblePeer]}>
        <Text style={[styles.text, isMe ? styles.textMe : styles.textPeer]}>{message.text}</Text>
        <View style={[styles.metaRow, isMe ? styles.metaMe : styles.metaPeer]}>
          <Text style={[styles.time, isMe ? styles.timeMe : styles.timePeer]}>
            {formatMessageTime(message.sentAt)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowPeer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  bubbleMe: {
    backgroundColor: '#2563eb',
    borderTopRightRadius: 8,
  },
  bubblePeer: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopLeftRadius: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textMe: {
    color: '#ffffff',
  },
  textPeer: {
    color: '#e2e8f0',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaMe: {
    justifyContent: 'flex-end',
  },
  metaPeer: {
    justifyContent: 'flex-start',
  },
  time: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  timeMe: {
    color: 'rgba(255, 255, 255, 0.76)',
  },
  timePeer: {
    color: '#94a3b8',
  },
});

export default MessageBubble;
