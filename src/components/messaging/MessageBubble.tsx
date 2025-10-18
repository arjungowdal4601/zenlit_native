import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, CheckCheck, Clock3 } from 'lucide-react-native';

export type MessageStatus = 'pending' | 'failed' | 'sent' | 'delivered' | 'read';

export type MessageBubbleProps = {
  text: string;
  createdAt: string; // ISO string
  isMine?: boolean;
  status?: MessageStatus;
  onRetry?: () => void;
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const formatHHmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const statusIconFor = (status: MessageStatus) => {
  switch (status) {
    case 'pending':
      return { icon: Clock3, color: '#94a3b8' };
    case 'failed':
      return { icon: Clock3, color: '#f87171' };
    case 'delivered':
      return { icon: CheckCheck, color: '#2563eb' };
    case 'read':
      return { icon: CheckCheck, color: '#22c55e' };
    case 'sent':
    default:
      return { icon: Check, color: '#2563eb' };
  }
};

const statusDescription: Record<MessageStatus, string> = {
  pending: 'pending',
  failed: 'not sent',
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  createdAt,
  isMine = false,
  status = 'sent',
  onRetry,
}) => {
  const timeLabel = formatHHmm(new Date(createdAt));
  const showStatus = isMine;
  const { icon: StatusIcon, color: statusColor } = statusIconFor(status);
  const interactive = status === 'failed' && !!onRetry;
  const accessibilityLabel = `${text || 'Message'}, ${timeLabel}${
    showStatus ? `, status ${statusDescription[status]}` : ''
  }${interactive ? '. Double tap to retry sending.' : ''}`;

  const content = (
    <View style={[styles.container, isMine ? styles.mine : styles.theirs]}>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.time}>{timeLabel}</Text>
        {showStatus ? (
          <StatusIcon strokeWidth={2.2} size={14} color={statusColor} />
        ) : null}
      </View>
    </View>
  );

  if (interactive) {
    return (
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.pressableWrapper,
          isMine ? styles.wrapperMine : styles.wrapperTheirs,
          pressed ? styles.pressablePressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={[styles.pressableWrapper, isMine ? styles.wrapperMine : styles.wrapperTheirs]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  pressableWrapper: {
    maxWidth: '82%',
  },
  wrapperMine: {
    alignSelf: 'flex-end',
  },
  wrapperTheirs: {
    alignSelf: 'flex-start',
  },
  pressablePressed: {
    opacity: 0.85,
  },
  container: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginVertical: 4,
  },
  mine: {
    backgroundColor: '#111827',
  },
  theirs: {
    backgroundColor: '#0b0b0b',
  },
  text: {
    color: '#ffffff',
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 6,
  },
  time: {
    color: '#94a3b8',
    fontSize: 11,
  },
});

export default MessageBubble;
