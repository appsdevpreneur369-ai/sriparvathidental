import {
  Activity, AlignCenter, Anchor, ArrowRight, ArrowUpRight, Award, BadgeCheck, HeartPulse, Users, Calendar, CalendarCheck, CalendarClock, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleAlert, CircleDashed, ClipboardCheck, Clock, Download, Droplet, ExternalLink, Eye, HandHeart, IndianRupee, Info, Layers, Leaf,
  LoaderCircle, LogIn, Mail, MapPin, Menu, MessageCircle, Navigation, Phone, Puzzle, Scissors, ShieldCheck, Siren, Smile, Snowflake,
  Sparkle, Sparkles, Stethoscope, TriangleAlert, UserPlus, Wind, X, Zap, type LucideIcon,
} from 'lucide-react';

// Content refers to icons by kebab-case name. Unknown names fall back to a sparkle.
const ICONS: Record<string, LucideIcon> = {
  activity: Activity, 'align-center': AlignCenter, anchor: Anchor, 'arrow-right': ArrowRight, 'arrow-up-right': ArrowUpRight, award: Award,
  'badge-check': BadgeCheck, 'heart-pulse': HeartPulse, users: Users, calendar: Calendar,
  'calendar-check': CalendarCheck, 'calendar-clock': CalendarClock, check: Check, 'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'circle-alert': CircleAlert, 'circle-dashed': CircleDashed,
  'clipboard-check': ClipboardCheck, clock: Clock, download: Download, droplet: Droplet, 'external-link': ExternalLink, eye: Eye,
  'hand-heart': HandHeart, 'indian-rupee': IndianRupee, info: Info, layers: Layers, leaf: Leaf, loader: LoaderCircle,
  'log-in': LogIn, mail: Mail, 'map-pin': MapPin, menu: Menu, 'message-circle': MessageCircle, navigation: Navigation,
  phone: Phone, puzzle: Puzzle, scissors: Scissors, 'shield-check': ShieldCheck, siren: Siren, smile: Smile,
  snowflake: Snowflake, sparkle: Sparkle, sparkles: Sparkles, stethoscope: Stethoscope, 'triangle-alert': TriangleAlert,
  'user-plus': UserPlus, wind: Wind, x: X, zap: Zap,
};

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.8 }: { name: string; className?: string; strokeWidth?: number }) {
  const C = ICONS[name] ?? Sparkles;
  return <C className={className} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" />;
}

/** WhatsApp glyph (lucide ships no brand marks). */
export function WhatsAppIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
