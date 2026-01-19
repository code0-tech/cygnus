import React from 'react'
import { useTranslations } from 'next-intl'
import { FeatureCard } from './FeatuerCard'
import { AnimatedChart } from '../AnimatedChart'

export const RuntimeCard: React.FC = () => {
  const t = useTranslations('FeatureSection')

  return (
    <FeatureCard>
        <div className={'h-full flex flex-col gap-4'}>
            <div className={'flex flex-col gap-1'}>
                <p className={'font-semibold text-lg text-brand'}>
                    {t('runtimeTitle')}
                </p>
                <p className={'text-white/50 text-sm text-justify'}>
                    {t('runtimeDescription')}
                </p>
            </div>
            <AnimatedChart />
        </div>
    </FeatureCard>
  )
}
