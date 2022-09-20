import { useState } from 'react'
import { useRouter } from 'next/router'
import { getSession } from 'next-auth/react'
import { HiPaperAirplane } from 'react-icons/hi'
import { GetServerSideProps, NextPage } from 'next'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider } from 'react-hook-form'

import { SEO } from 'components/SEO'
import { Input, RadioGroup } from 'components/Form'
import { ChallengeHeaderSmall } from 'components/Challenge'

import api from 'service/api'
import { Challenge, Solution } from 'types'
import { LEVELS_OPTIONS } from 'utils/constants'
import { formattedChallenge } from 'utils/format'
import { createClientPrismic } from 'service/prismic'
import { ChallengeProvider } from 'hook/useChallenge'
import { zodSolutionSchema, SolutionForm } from 'utils/zod'
import { connectMongoose, SolutionModel } from 'service/mongoose'

import styles from './styles.module.scss'

interface PageProps {
  solution: Solution
  challenge: Challenge
}

const SolutionChallengePage: NextPage<PageProps> = ({
  solution,
  challenge
}) => {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(false)

  const useFormMethods = useForm<SolutionForm>({
    mode: 'all',
    resolver: zodResolver(zodSolutionSchema),
    defaultValues: solution
  })

  const onSubmit = async (data: SolutionForm): Promise<void> => {
    setLoading(true)

    try {
      await api.post(`challenge/${challenge.id}/solution`, data)
      router.push('/')
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ChallengeProvider challenge={challenge}>
      <SEO
        tabName="Enviar solução"
        title="Enviar solução"
        description="Formulário para participar do desafio"
      />

      <ChallengeHeaderSmall />

      <section className={styles.container}>
        <FormProvider {...useFormMethods}>
          <form
            className={styles.form}
            onSubmit={useFormMethods.handleSubmit(onSubmit)}
          >
            <h2>Formulário de envio</h2>

            <Input
              type="url"
              label="Repositório"
              name="repository_url"
              placeholder="Link do repositório do github"
            />

            <Input
              name="url"
              type="url"
              label="Visualização"
              placeholder="Link para visualizar o projeto"
            />

            <Input
              label="Post do linkedin"
              name="linkedin_url"
              placeholder="Link do post sobre a solução do desafio"
            />

            <RadioGroup
              name="level"
              label="Selecione a dificuldade"
              options={LEVELS_OPTIONS}
            />

            <button
              type="submit"
              className={`button ${styles.button__submit} ${
                loading ? 'loading' : ''
              }`}
              disabled={loading}
            >
              <HiPaperAirplane />
              Enviar
            </button>
          </form>
        </FormProvider>
      </section>
    </ChallengeProvider>
  )
}

export const getServerSideProps: GetServerSideProps = async props => {
  const { req, query } = props
  const session = await getSession({ req })

  if (session === null) {
    return {
      props: {},
      redirect: {
        destination: '/login'
      }
    }
  }

  const challenge_id = query.slug as string
  const { _id: user_id, challenges } = session.user

  const isParticipant = challenges.includes(challenge_id)

  if (isParticipant) {
    try {
      const prismic = createClientPrismic({ req })
      const response = await prismic.getByUID<any>('challenges', challenge_id)

      const challenge = formattedChallenge(response)

      await connectMongoose()
      const queryMongo = { user_id, challenge_id }
      const ignoreFields = { createdAt: 0, updatedAt: 0, _id: 0, user_id: 0 }
      const solution = await SolutionModel.findOne(queryMongo, ignoreFields)

      return {
        props: {
          solution: solution?._doc || {},
          challenge
        }
      }
    } catch (err) {
      console.log(err)
    }
  }

  return {
    props: {},
    redirect: {
      destination: '/desafio/'.concat(challenge_id),
      permanent: false
    }
  }
}

export default SolutionChallengePage
