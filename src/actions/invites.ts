'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function actionCreateInvite(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()
  if (!member || member.role !== 'admin') throw new Error('Solo administradores pueden crear invitaciones')

  const { data, error } = await supabase
    .from('invites')
    .insert({
      group_id: groupId,
      created_by: user.id,
      used: false,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('token')
    .single()

  if (error) throw new Error('Error al crear invitación')

  revalidatePath(`/dashboard/${groupId}`)
  return data.token
}

export async function actionResolveInvite(token: string) {
  const supabase = await createClient()
  const { data: invite } = await supabase
    .from('invites')
    .select('*, groups:group_id(name, description, status, deadline, creator_id, max_bets)')
    .eq('token', token)
    .single()

  if (!invite) return null
  if (invite.used) return null
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return null

  return invite
}
