'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit, logError } from '@/lib/logger'

const ALLOWED_STATUS = ['draft', 'activo', 'finalizado'] as const
const ALLOWED_ROLES = ['admin', 'member'] as const

export async function actionUpdateList(
  groupId: string,
  userId: string,
  bets: { wikidata_id: string; type: string; name: string; status: string; snippet?: string; age?: number | null }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  if (user.id !== userId) throw new Error('No puedes modificar la lista de otro usuario')

  const { data: group } = await supabase
    .from('groups')
    .select('status')
    .eq('id', groupId)
    .single()
  if (!group) throw new Error('Grupo no encontrado')
  if (group.status !== 'draft') throw new Error('El período de edición ha finalizado')

  const validatedBets = bets.slice(0, 50).map(b => ({
    group_id: groupId,
    user_id: userId,
    type: String(b.type || 'default').slice(0, 50),
    name: String(b.name).slice(0, 200),
    status: b.status === 'deceased' ? 'deceased' : 'alive',
    wikidata_id: String(b.wikidata_id).slice(0, 100),
    snippet: String(b.snippet || '').slice(0, 500),
    age: typeof b.age === 'number' ? b.age : null,
  }))

  const { data: oldBets } = await supabase
    .from('bets')
    .select('wikidata_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)

  const oldIds = new Set(oldBets?.map(b => b.wikidata_id) || [])
  const newIds = new Set(validatedBets.map(b => b.wikidata_id))
  const added = validatedBets.filter(b => !oldIds.has(b.wikidata_id))
  const removed = [...oldIds].filter(id => !newIds.has(id))

  if (removed.length > 0) {
    await supabase.from('bets').delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .in('wikidata_id', removed)
  }

  for (const bet of added) {
    await supabase.from('bets').insert(bet)
  }

  logAudit('groups.updateList', 'Lista actualizada', {
    userId: user.id,
    groupId,
    metadata: { added: added.length, removed: removed.length },
  })

  revalidatePath(`/dashboard/${groupId}`)
}

export async function actionJoinGroup(userId: string, token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  if (user.id !== userId) throw new Error('No puedes unir a otro usuario')

  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .single()

  if (inviteError || !invite) throw new Error('Invitación no encontrada')
  if (invite.used) throw new Error('Esta invitación ya ha sido utilizada')
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) throw new Error('Esta invitación ha expirado')
  if (invite.max_uses > 0) {
    const { count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', invite.group_id)
    if (count && count >= invite.max_uses) throw new Error('El grupo ha alcanzado el límite de miembros')
  }

  const { data: existingMember } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', invite.group_id)
    .eq('user_id', userId)
    .maybeSingle()
  if (existingMember) throw new Error('Ya eres miembro de este grupo')

  const { data: group } = await supabase
    .from('groups')
    .select('status')
    .eq('id', invite.group_id)
    .single()
  if (!group || group.status === 'activo') throw new Error('El grupo ya ha comenzado')

  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .single()

  await supabase.from('group_members').insert({
    group_id: invite.group_id,
    user_id: userId,
    role: 'member',
  })

  await supabase.from('activity_logs').insert({
    group_id: invite.group_id,
    message: `${userData?.name || 'Alguien'} se unió al grupo`,
  })

  logAudit('groups.joinGroup', `${userData?.name || 'Alguien'} se unió al grupo`, {
    userId: user.id,
    groupId: invite.group_id,
  })

  revalidatePath(`/dashboard/${invite.group_id}`)
}

export async function actionLeaveGroup(userId: string, groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  if (user.id !== userId) throw new Error('No puedes expulsarte a ti mismo de esta forma')

  const { data: group } = await supabase
    .from('groups')
    .select('creator_id, name')
    .eq('id', groupId)
    .single()
  if (!group) throw new Error('Grupo no encontrado')
  if (group.creator_id === userId) throw new Error('El creador no puede abandonar el grupo. Debe eliminarlo.')

  await supabase.from('group_members').delete()
    .match({ group_id: groupId, user_id: userId })

  logAudit('groups.leaveGroup', 'Usuario abandonó el grupo', { userId: user.id, groupId })
  revalidatePath('/dashboard')
}

export async function actionKickMember(groupId: string, targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: callerMember } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()
  if (!callerMember || callerMember.role !== 'admin') throw new Error('No tienes permisos de administrador')

  if (targetUserId === user.id) throw new Error('No puedes expulsarte a ti mismo')

  await supabase.from('group_members').delete()
    .match({ group_id: groupId, user_id: targetUserId })

  logAudit('groups.kickMember', 'Miembro expulsado', { userId: user.id, groupId, metadata: { targetUserId } })
  revalidatePath(`/dashboard/${groupId}`)
}

export async function actionUpdateGroup(groupId: string, data: { name?: string; description?: string; deadline?: string; max_bets?: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: group } = await supabase
    .from('groups')
    .select('creator_id')
    .eq('id', groupId)
    .single()
  if (!group) throw new Error('Grupo no encontrado')
  if (group.creator_id !== user.id) throw new Error('Solo el creador puede modificar el grupo')

  const update: Record<string, unknown> = {}
  if (data.name !== undefined) update.name = String(data.name).slice(0, 200)
  if (data.description !== undefined) update.description = String(data.description).slice(0, 2000)
  if (data.deadline !== undefined) update.deadline = data.deadline
  if (data.max_bets !== undefined) {
    const n = Number(data.max_bets)
    if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error('max_bets debe ser un número entre 1 y 100')
    update.max_bets = n
  }

  await supabase.from('groups').update(update).eq('id', groupId)
  logAudit('groups.updateGroup', 'Grupo actualizado', { userId: user.id, groupId, metadata: { update } })
  revalidatePath(`/dashboard/${groupId}`)
}

export async function actionDeleteGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: group } = await supabase
    .from('groups')
    .select('creator_id')
    .eq('id', groupId)
    .single()
  if (!group) throw new Error('Grupo no encontrado')
  if (group.creator_id !== user.id) throw new Error('Solo el creador puede eliminar el grupo')

  await supabase.from('groups').delete().eq('id', groupId)
  logAudit('groups.deleteGroup', 'Grupo eliminado', { userId: user.id, groupId })
  revalidatePath('/dashboard')
}

export async function actionPromoteToAdmin(groupId: string, targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: callerMember } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()
  if (!callerMember || callerMember.role !== 'admin') throw new Error('No tienes permisos de administrador')

  await supabase.from('group_members').update({ role: 'admin' })
    .match({ group_id: groupId, user_id: targetUserId })

  logAudit('groups.promoteToAdmin', 'Miembro promovido a admin', {
    userId: user.id, groupId, metadata: { targetUserId },
  })
  revalidatePath(`/dashboard/${groupId}`)
}

export async function actionCloseGroupLists(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()
  if (!member || member.role !== 'admin') throw new Error('No tienes permisos de administrador')

  await supabase.from('groups').update({ status: 'activo' }).eq('id', groupId)
  await supabase.from('activity_logs').insert({
    group_id: groupId,
    message: 'Listas cerradas oficialmente. El juego ha comenzado.',
  })

  logAudit('groups.closeGroupLists', 'Listas cerradas', { userId: user.id, groupId })
  revalidatePath(`/dashboard/${groupId}`)
}

export async function actionSetNameStatusAcrossGroup(
  groupId: string,
  name: string,
  status: 'alive' | 'deceased'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()
  if (!member || member.role !== 'admin') throw new Error('No tienes permisos de administrador')

  const sanitizedName = String(name).slice(0, 200)

  const { data: bets } = await supabase
    .from('bets')
    .select('*')
    .eq('group_id', groupId)
    .ilike('name', sanitizedName)

  if (!bets || bets.length === 0) return

  const toUpdate = bets.filter(b => b.status !== status)
  for (const bet of toUpdate) {
    await supabase.from('bets').update({ status }).eq('id', bet.id)

    const pointsDelta = status === 'deceased' ? 1 : -1
    const { data: memberRow } = await supabase
      .from('group_members')
      .select('points')
      .eq('group_id', groupId)
      .eq('user_id', bet.user_id)
      .single()

    if (memberRow) {
      await supabase.from('group_members')
        .update({ points: Math.max(0, (memberRow.points || 0) + pointsDelta) })
        .eq('group_id', groupId)
        .eq('user_id', bet.user_id)
    }
  }

  logAudit('groups.setNameStatus', `Estado cambiado a ${status} para "${name}"`, {
    userId: user.id, groupId, metadata: { name, status },
  })
  revalidatePath(`/dashboard/${groupId}`)
}

export async function actionCreateGroup(data: {
  name: string
  description: string
  deadline: string
  max_bets: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const name = String(data.name).trim().slice(0, 200)
  if (!name) throw new Error('El nombre del grupo es obligatorio')

  const description = String(data.description || '').trim().slice(0, 2000)
  const maxBets = Math.min(Math.max(Math.round(Number(data.max_bets) || 10), 1), 100)
  const deadline = data.deadline ? new Date(data.deadline).toISOString() : ''

  if (!deadline) throw new Error('La fecha límite es obligatoria')

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name,
      description,
      status: 'draft',
      deadline,
      creator_id: user.id,
      max_bets: maxBets,
    })
    .select('id')
    .single()

  if (error || !group) throw new Error('Error al crear el grupo')

  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()
  const username = userData?.name || 'Alguien'

  await supabase.from('activity_logs').insert([
    { group_id: group.id, message: `Grupo ${name} creado por ${username}` },
    { group_id: group.id, message: `${username} se unió al grupo` },
  ])

  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'admin',
  })

  logAudit('groups.createGroup', `Grupo "${name}" creado`, { userId: user.id, groupId: group.id })
  revalidatePath('/dashboard')
  return { groupId: group.id }
}
