import React from 'react'
import { useTranslations } from 'next-intl'
import { FeatureCard } from './FeatureCard'
import { AnimatedChart } from '../AnimatedChart'
import { Link } from '@/i18n/navigation'
import { IconArrowUpRight } from '@tabler/icons-react'

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
                <Link href="">
                    <button className={"mt-2 flex items-center gap-1 text-xs text-white/50 hover:text-brand"}>
                        {t("featureLinkButton")}
                        <IconArrowUpRight size={16} />
                    </button>
                </Link>
            </div>
            <AnimatedChart />
        </div>
    </FeatureCard>
  )
}
