'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logAudit, logError } from '@/lib/logger'
import { buildWikidataEntityUrl, fetchWikidata } from '@/lib/wikidata'

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: userDoc } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userDoc || !['admin', 'creator'].includes(userDoc.role)) {
    logError('admin.assertAdmin', 'Acceso denegado', { userId: user.id, metadata: { role: userDoc?.role } })
    throw new Error('Acceso denegado: se requieren permisos de administrador')
  }
}

export async function actionReviewAllRecords() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  await assertAdmin(supabase)

  const adminSupabase = await createAdminClient()

  const { data: records, error } = await adminSupabase
    .from('review_records')
    .select('*')
    .eq('status', 'alive')

  if (error || !records || records.length === 0) {
    logAudit('admin.reviewAllRecords', 'No hay registros pendientes', { userId: user.id })
    return 'No hay registros pendientes de revisión'
  }

  const allRecordIds = records.map(r => r.wikidata_id)
  const CHUNK_SIZE = 50
  const deceasedFound: string[] = []

  for (let i = 0; i < allRecordIds.length; i += CHUNK_SIZE) {
    const chunk = allRecordIds.slice(i, i + CHUNK_SIZE)

    try {
      const url = buildWikidataEntityUrl(chunk)
      const data = await fetchWikidata<{ entities: Record<string, { claims?: Record<string, unknown> }> }>(url)

      chunk.forEach((id) => {
        const entity = data.entities[id]
        if (entity?.claims?.P570) {
          deceasedFound.push(id)
        }
      })
    } catch (err) {
      logError('admin.reviewAllRecords.wikidata', 'Error consultando Wikidata', {
        userId: user.id,
        metadata: { chunk, error: String(err) },
      })
    }
  }

  for (const wikidataId of deceasedFound) {
    await adminSupabase.from('review_records')
      .update({ status: 'deceased' })
      .eq('wikidata_id', wikidataId)

    const record = records.find(r => r.wikidata_id === wikidataId)
    if (!record?.lists) continue

    for (const list of record.lists) {
      const { userId: betUserId, groupId } = list

      const { data: bet } = await adminSupabase
        .from('bets')
        .select('*')
        .eq('wikidata_id', wikidataId)
        .eq('user_id', betUserId)
        .eq('group_id', groupId)
        .single()

      if (bet && bet.status === 'alive') {
        await adminSupabase.from('bets').update({ status: 'deceased' }).eq('id', bet.id)

        const { data: member } = await adminSupabase
          .from('group_members')
          .select('points')
          .eq('group_id', groupId)
          .eq('user_id', betUserId)
          .single()

        if (member) {
          await adminSupabase.from('group_members')
            .update({ points: (member.points || 0) + 1 })
            .eq('group_id', groupId)
            .eq('user_id', betUserId)
        }
      }
    }
  }

  logAudit('admin.reviewAllRecords.complete', `Detectados ${deceasedFound.length} fallecimientos`, {
    userId: user.id,
    metadata: { totalProcessed: allRecordIds.length, deceasedFound },
  })

  revalidatePath('/admin')
  return `Se han detectado ${deceasedFound.length} fallecimientos nuevos`
}

export async function actionCloseAllLists() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  await assertAdmin(supabase)

  const adminSupabase = await createAdminClient()

  const { data: groups, error } = await adminSupabase
    .from('groups')
    .select('id, name')
    .eq('status', 'draft')

  if (error || !groups) throw new Error('Error al obtener grupos')

  for (const group of groups) {
    await adminSupabase.from('groups')
      .update({ status: 'activo' })
      .eq('id', group.id)

    await adminSupabase.from('activity_logs').insert({
      group_id: group.id,
      message: 'Listas cerradas por administrador.',
    })
  }

  logAudit('admin.closeAllLists', `Cerradas ${groups.length} listas`, {
    userId: user.id,
    metadata: { groupIds: groups.map(g => ({ id: g.id, name: g.name })) },
  })

  revalidatePath('/admin')
  return `Se cerraron ${groups.length} grupos`
}
