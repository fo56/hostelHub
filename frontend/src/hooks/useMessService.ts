// hooks/useMessService.ts
import { useApi } from './useApi'

export const useMessService = () => {
  const { request } = useApi()

  const openVoting = (days: number) =>
    request('/admin/menu/voting/open', 'POST', { days })

  const getVotingStatus = async () => {
    const res = await request('/admin/menu/voting/status', 'GET')
    return {
      ended: res.ended,
      endsAt: res.endsAt,
    }
  }

  const generateMenu = () =>
    request('/admin/menu/generate', 'POST')

  return {
    openVoting,
    getVotingStatus,
    generateMenu,
  }
}
