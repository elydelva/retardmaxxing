"use client";

import {
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Home,
  Key,
  Layout,
  LogOut,
  type LucideProps,
  MapPin,
  Shield,
  Smartphone,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { forwardRef } from "react";

export const ICONS = {
  briefcase: Briefcase,
  calendar: Calendar,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  "circle-help": CircleHelp,
  "credit-card": CreditCard,
  home: Home,
  key: Key,
  layout: Layout,
  "log-out": LogOut,
  "map-pin": MapPin,
  shield: Shield,
  smartphone: Smartphone,
  "trash-2": Trash2,
  user: User,
  users: Users,
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
}

const Icon = forwardRef<SVGSVGElement, IconProps>(({ name, ...props }, ref) => {
  const IconComponent = ICONS[name];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent {...props} ref={ref} />;
});
Icon.displayName = "Icon";

export { Icon };
