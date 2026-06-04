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
      label: 'Titip Makanan',
      subLabel: 'Kantin UMP',
      icon: Utensils,
      color: 'amber'
    },
    {
      id: 'photocopy',
      label: 'Fotokopi / Print',
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
      label: 'Ojek Kampus',
      subLabel: 'P2P Antar Jemput',
      icon: Bike,
      color: 'emerald'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {services.map((service) => {
        const IconComponent = service.icon;
        const isSelected = selectedService === service.id;

        return (
          <button
            key={service.id}
            onClick={() => onSelectService(service.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all group active:scale-95 cursor-pointer text-center relative ${
              isSelected
                ? 'border-teal bg-teal-light/10 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 bg-white shadow-xs'
            }`}
            id={`service-${service.id}`}
          >
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-xl mb-3 transition-colors ${
                isSelected ? 'bg-teal text-white' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100'
              }`}
            >
              <IconComponent className="w-6 h-6" />
            </div>

            <span className={`font-semibold text-xs text-navy-dark ${isSelected ? 'text-teal font-extrabold' : ''}`}>
              {service.label}
            </span>
            <span className="text-[10px] text-slate-400 mt-1">{service.subLabel}</span>

            {isSelected && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-teal text-white rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
