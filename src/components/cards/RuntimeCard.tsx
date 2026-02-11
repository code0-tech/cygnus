import React from 'react'
import { FeatureCard } from './FeatureCard'
import { AnimatedChart } from '../AnimatedChart'
import Link from "next/link"
import { IconArrowUpRight } from '@tabler/icons-react'
import { Button } from '@/components/Button'

export const RuntimeCard: React.FC = () => {
  return (
    <FeatureCard>
        <div className={'h-full flex flex-col gap-4'}>
            <div className={'flex flex-col gap-1'}>
                <p className={'font-semibold text-lg text-brand'}>
                    runtimeTitle
                </p>
                <p className={'text-white/50 text-sm text-justify'}>
                    runtimeDescription
                </p>
                <Link href="">
                    <Button variant="link" className="mt-2 gap-1 text-xs">
                        featureLinkButton
                        <IconArrowUpRight size={16} />
                    </Button>
                </Link>
            </div>
            <AnimatedChart />
        </div>
    </FeatureCard>
  )
}
