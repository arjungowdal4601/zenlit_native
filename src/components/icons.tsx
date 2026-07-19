import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  ArrowLeft,
  ArrowUp,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  EllipsisVertical,
  Info,
  LoaderCircle,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Paperclip,
  Search,
  SquarePen,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  X,
} from 'lucide-react-native';

const iconMap = {
  'arrow-left': ArrowLeft,
  'arrow-up': ArrowUp,
  'alert-circle': CircleAlert,
  'alert-triangle': TriangleAlert,
  calendar: Calendar,
  camera: Camera,
  check: Check,
  'check-circle': CircleCheck,
  'chevron-right': ChevronRight,
  'edit-3': SquarePen,
  info: Info,
  loader: LoaderCircle,
  'log-out': LogOut,
  mail: Mail,
  menu: Menu,
  'message-square': MessageSquare,
  'more-vertical': EllipsisVertical,
  paperclip: Paperclip,
  search: Search,
  'trash-2': Trash2,
  upload: Upload,
  user: User,
  x: X,
  'x-circle': CircleX,
} as const;

export type IconName = keyof typeof iconMap;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  strokeWidth?: number;
};

export const Feather: React.FC<IconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  style,
}) => {
  const Icon = iconMap[name];

  return <Icon color={color} size={size} strokeWidth={strokeWidth} style={style} />;
};
