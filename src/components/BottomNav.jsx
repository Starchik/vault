import { Wallet, Repeat, CreditCard } from 'lucide-react'

const TABS = [
  { id: 'wallet', label: 'Кошелёк', icon: Wallet },
  { id: 'swap', label: 'Обмен', icon: Repeat },
  { id: 'buy', label: 'Купить', icon: CreditCard },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
