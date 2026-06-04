import { Bike, Check, Printer, Shield, Utensils } from 'lucide-react';
import type { ServiceType } from '../types';

interface ServiceSelectorProps {
  selectedService: ServiceType;
  onSelectService: (service: ServiceType) => void;
}

export default function ServiceSelector({ selectedService, onSelectService }: ServiceSelectorProps) {
  const services: { id: ServiceType; label: string; subLabel: string; icon: any; color: string }[] = [
    {
      id: 'food',
      label: 'Makanan',
      subLabel: 'Kantin UMP',
      icon: Utensils,
      color: 'amber'
    },
    {
      id: 'photocopy',
      label: 'Fotokopi',
      subLabel: 'Modul & Makalah',
      icon: Printer,
      color: 'blue'
    },
    {
      id: 'laundry',
      label: 'Laundry',
      subLabel: 'Kiloan & Satuan',
      icon: Shield,
      color: 'purple'
    },
    {
      id: 'ojek',
      label: 'Ojek',
      subLabel: 'Antar Jemput',
      icon: Bike,
      color: 'emerald'
    }
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    amber: { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-500' },
    blue: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-500' },
    purple: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-500' },
    emerald: { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-500' }
  };

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {services.map((service) => {
        const IconComponent = service.icon;
        const isSelected = selectedService === service.id;
        const color = colorMap[service.color];

        return (
          <button
            key={service.id}
            onClick={() => onSelectService(service.id)}
            className={`flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xl border-2 transition-all active:scale-95 cursor-pointer text-center relative ${
              isSelected
                ? `border-[var(--color-teal)] ${color.bg} shadow-lg`
                : 'border-slate-100 hover:border-slate-200 bg-white shadow-xs hover:shadow-sm'
            }`}
            id={`service-${service.id}`}
          >
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl mb-1.5 sm:mb-3 transition-all ${
                isSelected ? 'bg-white/20' : `bg-${service.color}-50 text-${service.color}-600`
              }`}
            >
              <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${isSelected ? 'text-white' : ''}`} />
            </div>

            <span className={`font-bold text-[10px] sm:text-xs ${isSelected ? 'text-white' : 'text-navy-dark'}`}>
              {service.label}
            </span>
            <span className={`text-[9px] sm:text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
              {service.subLabel}
            </span>

            {isSelected && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                <Check className={`w-3 h-3 ${color.text}`} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
