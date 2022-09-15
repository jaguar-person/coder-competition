import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { PrismicNextImage } from '@prismicio/next'
import { HiCheck, HiDocumentText, HiPlus, HiUserGroup } from 'react-icons/hi'

import api from 'service/api'
import { Challenge } from 'types'

import styles from './styles.module.scss'

interface ChallengeHeaderProps extends Challenge {
  isParticipate: boolean
  setParticipate: () => void
}

export const ChallengeHeader = ({
  isParticipate,
  setParticipate,
  ...challenge
}: ChallengeHeaderProps) => {
  const router = useRouter()
  const { status, data } = useSession()

  const challengeSlug = router.query?.slug as string
  const isResultsPage = router.asPath.includes(`${challengeSlug}/participantes`)

  const toParticipateChallenge = async () => {
    if (status !== 'authenticated') {
      router.push('/login')
    }

    if (!isParticipate) {
      await api.post(`/challenge/${challenge.id}/participate`)
      setParticipate()
    }
  }

  return (
    <header className={styles.header} data-size="default">
      <div className={styles.header__image}>
        <PrismicNextImage
          field={challenge.image}
          layout="fill"
          objectFit="cover"
        />
      </div>

      <h3>{challenge.authors[0].name}</h3>

      <h1>
        <Link href={'/desafio/'.concat(challenge.id)}>
          <a>{challenge.name}</a>
        </Link>
      </h1>

      <div className={styles.header__links}>
        <Link href={`/desafio/${challengeSlug}`}>
          <a className="button outline" aria-hidden={isResultsPage}>
            <HiDocumentText />
            Detalhes
          </a>
        </Link>

        <div>
          {isParticipate ? (
            <span className="button">
              <HiCheck />
              Participando
            </span>
          ) : (
            <button
              type="button"
              className="button outline"
              onClick={toParticipateChallenge}
            >
              <HiPlus />
              Participar
            </button>
          )}

          {challenge.status.type === 'finished' ||
            (data?.user.role === 'admin' && (
              <Link href={`/desafio/${challengeSlug}/participantes`}>
                <a className="button outline" aria-hidden={!isResultsPage}>
                  <HiUserGroup />
                  Ver participantes
                </a>
              </Link>
            ))}
        </div>
      </div>
    </header>
  )
}
