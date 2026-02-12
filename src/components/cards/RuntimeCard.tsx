import React from 'react'
import { FeatureCard } from './FeatureCard'
import { AnimatedChart } from '../AnimatedChart'
import { FeatureCardContent, FeatureCardText } from '../FeatureCardText'

interface RuntimeCardProps {
  content?: FeatureCardContent | null
}

export const RuntimeCard: React.FC<RuntimeCardProps> = ({ content }) => {
  return (
    <FeatureCard>
        <div className={'h-full flex flex-col gap-4'}>
            <FeatureCardText content={content}/>
            <AnimatedChart />
        </div>
    </FeatureCard>
  )
}
