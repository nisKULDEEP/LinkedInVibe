import React, { useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const frequencies = [
  { value: 'monthly', label: 'Monthly', priceSuffix: '/month' },
  { value: 'weekly', label: 'Weekly', priceSuffix: '/week' },
];

const currencies = {
  USD: { symbol: '$', label: 'USD ($)', flag: '🇺🇸' },
  INR: { symbol: '₹', label: 'INR (₹)', flag: '🇮🇳' },
};

const tiers = [
  {
    name: 'Hobby / BYOK',
    id: 'tier-hobby',
    href: '#',
    price: { 
        monthly: { USD: '$0', INR: '₹0' }, 
        weekly: { USD: '$0', INR: '₹0' } 
    },
    description: 'Perfect for testing. Use your own API keys.',
    features: [
      'Bring Your Own Key (Gemini)',
      '10 Posts Generation / Day',
      'Basic Post Formatting',
      'Manual Copy-Paste',
    ],
    featured: false,
  },
  {
    name: 'Starter',
    id: 'tier-starter',
    href: '/dashboard',
    price: { 
        monthly: { USD: '$9', INR: '₹299' }, 
        weekly: { USD: '$2.99', INR: '₹89' } 
    },
    description: 'Great for personal branding. 1 post per day.',
    features: [
      '30 AI Posts / Month',
      'Basic Image Generation',
      'Unicode Formatting',
      'Post History',
    ],
    featured: false,
  },
  {
    name: 'Growth',
    id: 'tier-growth',
    href: '/dashboard',
    price: { 
        monthly: { USD: '$29', INR: '₹999' }, 
        weekly: { USD: '$9', INR: '₹299' } 
    },
    description: 'For power users & creators. 100 posts/month.',
    features: [
      '100 AI Posts / Month',
      '✨ Premium Image Generation',
      '🚀 One-Click Scheduling',
      'Viral Hook Optimization',
      'Cloud Sync & History',
      'Priority Support',
    ],
    featured: true,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: 'mailto:sales@linkedinvibe.com',
    price: { 
        monthly: { USD: 'Custom', INR: 'Custom' }, 
        weekly: { USD: 'Custom', INR: 'Custom' } 
    },
    description: 'For agencies and large teams.',
    features: [
      'Unlimited Posts',
      'Team Collaboration',
      'Custom AI Models',
      'API Access',
      'Dedicated Account Manager',
    ],
    featured: false,
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Pricing() {
  const [frequency, setFrequency] = useState(frequencies[0]);
  const [currency, setCurrency] = useState('USD');

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Flexible plans for every creator
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          From a single post a day to full-scale automation. Choose what fits you.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {/* Currency Toggle */}
            <div className="flex items-center gap-2 rounded-full p-1 ring-1 ring-inset ring-gray-200 bg-gray-50/50">
                {Object.keys(currencies).map((curr) => (
                    <button
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        className={classNames(
                            currency === curr ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900',
                            'rounded-full px-4 py-1.5 text-sm font-semibold transition-all flex items-center gap-1.5'
                        )}
                    >
                        <span>{currencies[curr].flag}</span>
                        {currencies[curr].label}
                    </button>
                ))}
            </div>

            {/* Frequency Toggle */}
            <div className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200 bg-gray-50/50">
                {frequencies.map((option) => (
                <button
                    key={option.value}
                    onClick={() => setFrequency(option)}
                    className={classNames(
                    option.value === frequency.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900',
                    'cursor-pointer rounded-full px-5 py-2 transition-all'
                    )}
                >
                    {option.label}
                </button>
                ))}
            </div>
        </div>

        <div className="isolate mx-auto mt-12 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.featured ? 'bg-gray-900 ring-gray-900 scale-105 z-10' : 'bg-white ring-gray-200',
                'rounded-3xl p-8 ring-1 xl:p-10 transition-all duration-200 hover:shadow-xl flex flex-col justify-between'
              )}
            >
              <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3
                      id={tier.id}
                      className={classNames(
                        tier.featured ? 'text-white' : 'text-gray-900',
                        'text-lg font-semibold leading-8'
                      )}
                    >
                      {tier.name}
                    </h3>
                    {tier.featured && (
                      <span className="rounded-full bg-blue-500 px-2.5 py-1 text-xs font-semibold leading-5 text-white">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className={classNames(tier.featured ? 'text-gray-300' : 'text-gray-600', 'mt-4 text-sm leading-6')}>
                    {tier.description}
                  </p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className={classNames(tier.featured ? 'text-white' : 'text-gray-900', 'text-4xl font-bold tracking-tight')}>
                      {tier.price[frequency.value][currency]}
                    </span>
                    {tier.price[frequency.value][currency] !== 'Custom' && (
                        <span className={classNames(tier.featured ? 'text-gray-300' : 'text-gray-600', 'text-sm font-semibold leading-6')}>
                        {frequency.priceSuffix}
                        </span>
                    )}
                  </p>
                  
                  <ul
                    role="list"
                    className={classNames(
                      tier.featured ? 'text-gray-300' : 'text-gray-600',
                      'mt-8 space-y-3 text-sm leading-6'
                    )}
                  >
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <Check
                          className={classNames(tier.featured ? 'text-blue-400' : 'text-blue-600', 'h-6 w-5 flex-none')}
                          aria-hidden="true"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
              </div>
              <Link
                to={tier.href}
                aria-describedby={tier.id}
                className={classNames(
                  tier.featured
                    ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-400 focus-visible:outline-blue-500'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
                  'mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
                )}
              >
                {tier.price[frequency.value][currency] === 'Custom' ? 'Contact Sales' : (tier.featured || tier.name === 'Starter' ? 'Subscribe Now' : 'Start Free')}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
